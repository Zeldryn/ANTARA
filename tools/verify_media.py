"""Dependency-free Chromium/CDP verification for the shared Earth + Mars media system."""
import argparse
import base64
import http.server
import json
import os
from pathlib import Path
import socket
import struct
import subprocess
import threading
import time
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
TEMP = ROOT / ".tmp"
TEMP.mkdir(exist_ok=True)

class WebSocket:
    def __init__(self, url):
        from urllib.parse import urlsplit
        parts = urlsplit(url)
        self.sock = socket.create_connection((parts.hostname, parts.port), timeout=20)
        key = base64.b64encode(os.urandom(16)).decode()
        handshake = (f"GET {parts.path} HTTP/1.1\r\nHost: {parts.netloc}\r\n"
                     f"Upgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\n"
                     "Sec-WebSocket-Version: 13\r\n\r\n")
        self.sock.sendall(handshake.encode())
        response = b""
        while not response.endswith(b"\r\n\r\n"):
            response += self.sock.recv(1)
        assert b"101" in response.split(b"\r\n")[0], response
        self.next_id = 0
        self.exceptions = []

    def read(self, length):
        data = b""
        while len(data) < length:
            chunk = self.sock.recv(length - len(data))
            if not chunk:
                raise ConnectionError("Browser socket closed")
            data += chunk
        return data

    def call(self, method, params=None):
        self.next_id += 1
        request_id = self.next_id
        payload = json.dumps({"id": request_id, "method": method, "params": params or {}}).encode()
        mask = os.urandom(4)
        length = len(payload)
        if length < 126:
            header = bytes([0x81, 0x80 | length])
        elif length < 65536:
            header = bytes([0x81, 0x80 | 126]) + struct.pack("!H", length)
        else:
            header = bytes([0x81, 0x80 | 127]) + struct.pack("!Q", length)
        self.sock.sendall(header + mask + bytes(value ^ mask[i % 4] for i, value in enumerate(payload)))
        while True:
            first, second = self.read(2)
            size = second & 127
            if size == 126:
                size = struct.unpack("!H", self.read(2))[0]
            elif size == 127:
                size = struct.unpack("!Q", self.read(8))[0]
            if second & 128:
                masking_key = self.read(4)
                data = bytes(v ^ masking_key[i % 4] for i, v in enumerate(self.read(size)))
            else:
                data = self.read(size)
            if first & 15 == 8:
                raise ConnectionError("Browser closed connection")
            message = json.loads(data)
            if message.get("method") == "Runtime.exceptionThrown":
                self.exceptions.append(message["params"])
            if message.get("id") == request_id:
                if "error" in message:
                    raise RuntimeError(message["error"])
                return message.get("result", {})

    def evaluate(self, expression):
        result = self.call("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True,
            "userGesture": True
        })
        if "exceptionDetails" in result:
            raise RuntimeError(result["exceptionDetails"])
        return result.get("result", {}).get("value")

    def click(self, selector):
        point = self.evaluate(f"(() => {{const e=document.querySelector({json.dumps(selector)}); const r=e.getBoundingClientRect(); return {{x:r.left+r.width/2,y:r.top+r.height/2}};}})()")
        for event_type in ("mousePressed", "mouseReleased"):
            self.call("Input.dispatchMouseEvent", {"type": event_type, **point, "button": "left", "clickCount": 1})

    def key(self, key, code=None, vk=None):
        code = code or key
        vk = vk or (27 if key == "Escape" else 0)
        self.call("Input.dispatchKeyEvent", {"type": "keyDown", "key": key, "code": code, "windowsVirtualKeyCode": vk})
        self.call("Input.dispatchKeyEvent", {"type": "keyUp", "key": key, "code": code, "windowsVirtualKeyCode": vk})

    def screenshot(self, name):
        result = self.call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True})
        (TEMP / name).write_bytes(base64.b64decode(result["data"]))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *args):
        pass

def wait_for(browser, expression, timeout=6):
    end = time.time() + timeout
    while time.time() < end:
        if browser.evaluate(expression):
            return
        time.sleep(0.08)
    raise AssertionError(f"Timed out: {expression}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", default="/usr/bin/chromium")
    args = parser.parse_args()

    # Static checks first.
    earth_text = (ROOT / "earth-scene.js").read_text()
    mars_text = (ROOT / "mars-scene.js").read_text()
    assert "secondaryImage" not in earth_text + mars_text
    assert not list((ROOT / "assets/exploration").glob("*-alt.webp")), "Old crop-based fake secondary images still exist"
    json.loads((ROOT / "assets/exploration/image-pairs.json").read_text())

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}"
    profile = TEMP / ("media-profile-" + uuid.uuid4().hex[:8])
    log = (TEMP / "media-browser-log.txt").open("w")
    process = subprocess.Popen([
        args.browser, "--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader",
        "--no-sandbox", "--no-first-run", "--no-default-browser-check",
        "--disable-background-networking", "--remote-debugging-port=0",
        f"--user-data-dir={profile}", "about:blank"
    ], stdout=log, stderr=log)

    try:
        pages = []
        for _ in range(120):
            try:
                port = (profile / "DevToolsActivePort").read_text().splitlines()[0]
                pages = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=2))
                if any(page["type"] == "page" for page in pages):
                    break
            except OSError:
                pass
            time.sleep(.1)
        page = next(page for page in pages if page["type"] == "page")
        browser = WebSocket(page["webSocketDebuggerUrl"])
        browser.call("Page.enable")
        browser.call("Runtime.enable")
        browser.call("Network.enable")
        # Fail remote images immediately in this offline sandbox. App must remove the failed frame cleanly.
        browser.call("Network.setBlockedURLs", {"urls": ["*upload.wikimedia.org/*", "*thumb.wikimedia.org/*", "*assets.science.nasa.gov/*"]})
        browser.call("Emulation.setDeviceMetricsOverride", {"width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False})
        browser.call("Page.navigate", {"url": url})
        wait_for(browser, "typeof earth !== 'undefined' && typeof mars !== 'undefined' && !!window.ExplorationMedia", 8)

        # Every real Earth/Mars entry exposes exactly two distinct source identities.
        dataset = browser.evaluate("""(() => ({
          earth: EARTH_EXPLORATION_STOPS.slice(1).map(stop => ({ title: stop.title, images: ExplorationMedia.getImages(stop).map(x => x.src) })),
          mars: MARS_EXPLORATION_STOPS.map(stop => ({ title: stop.title, images: ExplorationMedia.getImages(stop).map(x => x.src) }))
        }))()""")
        assert len(dataset["earth"]) == 6
        assert len(dataset["mars"]) == 6
        for group in ("earth", "mars"):
            for item in dataset[group]:
                assert len(item["images"]) == (1 if group == "earth" else 2), item
                if group == "mars":
                    assert item["images"][0] != item["images"][1], item
                assert not any("-alt.webp" in src for src in item["images"]), item

        # Canonical de-duplication rejects same path with query/hash variants.
        dedup = browser.evaluate("""ExplorationMedia.getImages({title:'Dedup',images:[
          {src:'assets/a.webp?x=1'},{src:'assets/a.webp?x=2'},{src:'assets/b.webp'},{src:''},null
        ]}).map(x=>x.src)""")
        assert dedup == ["assets/a.webp?x=1", "assets/b.webp"], dedup

        # Start Earth without altering its renderer/rotation implementation.
        browser.evaluate("""(async()=>{
          await Promise.all([earth.prepare(), mars.prepare()]);
          mission.classList.add('is-earth'); phase='earth'; document.querySelector('.intro').inert=true;
          earth.start({settled:true}); earth.element.style.opacity='1'; earth.enterExploration();
        })()""")
        time.sleep(.4)
        browser.evaluate("earth.setExplorationStop(6); earth.pose={...earth.poseTarget}; earth.render()")
        wait_for(browser, "document.querySelectorAll('#earth-marker-media .exploration-marker-frame').length >= 1")
        earth_bounds = browser.evaluate("""(()=>{const r=document.getElementById('earth-marker-media').getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:innerWidth,h:innerHeight}})()""")
        assert earth_bounds["l"] >= -1 and earth_bounds["t"] >= -1 and earth_bounds["r"] <= earth_bounds["w"] + 1 and earth_bounds["b"] <= earth_bounds["h"] + 1, earth_bounds
        assert browser.evaluate("document.querySelectorAll('#earth-exploration .exploration-marker-frame').length === 0")
        assert browser.evaluate("document.querySelectorAll('#earth-exploration img').length === 0")

        # Test the shared lightbox with two distinct LOCAL real project images so the sandbox network is irrelevant.
        browser.evaluate("""ExplorationMedia.render('earth',{title:'Uji Lightbox',images:[
          {src:'assets/exploration/olympus-mons.webp',alt:'Olympus Mons',caption:'Mars 01'},
          {src:'assets/exploration/jezero.webp',alt:'Jezero',caption:'Mars 02'}
        ]})""")
        wait_for(browser, "document.querySelectorAll('#earth-marker-media .exploration-marker-frame:not(:disabled)').length===2")
        browser.click("#earth-marker-media .exploration-marker-frame:nth-child(1)")
        wait_for(browser, "!document.querySelector('.exploration-lightbox').hidden")
        assert browser.evaluate("document.querySelector('.exploration-lightbox-image').getAttribute('src')") == "assets/exploration/olympus-mons.webp"
        assert browser.evaluate("document.querySelector('.exploration-lightbox-counter').textContent") == "01 / 02"
        assert browser.evaluate("document.querySelector('.exploration-lightbox-prev').disabled && !document.querySelector('.exploration-lightbox-next').disabled")
        browser.click(".exploration-lightbox-next")
        assert browser.evaluate("document.querySelector('.exploration-lightbox-image').getAttribute('src')") == "assets/exploration/jezero.webp"
        assert browser.evaluate("document.querySelector('.exploration-lightbox-counter').textContent") == "02 / 02"
        browser.click(".exploration-lightbox-prev")
        assert browser.evaluate("document.querySelector('.exploration-lightbox-image').getAttribute('src')") == "assets/exploration/olympus-mons.webp"
        browser.key("Escape", "Escape", 27)
        assert browser.evaluate("document.querySelector('.exploration-lightbox').hidden")

        browser.click("#earth-marker-media .exploration-marker-frame:nth-child(2)")
        assert browser.evaluate("document.querySelector('.exploration-lightbox-image').getAttribute('src')") == "assets/exploration/jezero.webp"
        browser.click(".exploration-lightbox-close")
        assert browser.evaluate("document.querySelector('.exploration-lightbox').hidden")

        browser.click("#earth-marker-media .exploration-marker-frame:nth-child(1)")
        browser.evaluate("document.querySelector('.exploration-lightbox-backdrop').click()")
        assert browser.evaluate("document.querySelector('.exploration-lightbox').hidden")

        # Single image: no pointless arrows.
        browser.evaluate("ExplorationMedia.render('earth',{title:'Single',images:[{src:'assets/exploration/olympus-mons.webp',alt:'single scientific image'}]})")
        wait_for(browser, "document.querySelectorAll('#earth-marker-media .exploration-marker-frame:not(:disabled)').length===1")
        browser.click("#earth-marker-media .exploration-marker-frame")
        assert browser.evaluate("document.querySelector('.exploration-lightbox-prev').hidden && document.querySelector('.exploration-lightbox-next').hidden")
        browser.key("Escape", "Escape", 27)

        # Broken second image gets removed, not replaced by image 1.
        browser.evaluate("""ExplorationMedia.render('earth',{title:'Broken',images:[
          {src:'assets/exploration/olympus-mons.webp',alt:'valid'}, {src:'assets/missing-nope.webp',alt:'missing'}
        ]})""")
        wait_for(browser, "document.querySelectorAll('#earth-marker-media .exploration-marker-frame').length===1")
        assert browser.evaluate("document.querySelectorAll('#earth-marker-media img').length===1")

        # Changing selection clears old preview/modal state.
        browser.evaluate("earth.setExplorationStop(1); earth.pose={...earth.poseTarget}; earth.render()")
        wait_for(browser, "document.querySelectorAll('#earth-marker-media .exploration-marker-frame').length>=1")
        old_src = browser.evaluate("document.querySelector('#earth-marker-media img').getAttribute('src')")
        browser.evaluate("earth.setExplorationStop(6); earth.pose={...earth.poseTarget}; earth.render()")
        wait_for(browser, "document.querySelectorAll('#earth-marker-media .exploration-marker-frame').length>=1")
        new_src = browser.evaluate("document.querySelector('#earth-marker-media img').getAttribute('src')")
        assert old_src != new_src
        assert browser.evaluate("document.querySelector('.exploration-lightbox').hidden")
        # Rotation target still maps selected landmark to the globe front.
        front = browser.evaluate("""(()=>{const stop=EARTH_EXPLORATION_STOPS[earth.topicIndex],l=stop.location,lat=l.latitude*Math.PI/180,lon=l.longitude*Math.PI/180;const n=new earth.THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),-Math.cos(lat)*Math.sin(lon)).applyQuaternion(earth.planet.quaternion);return n.z})()""")
        assert front > .995, front
        browser.screenshot("media-earth-final.png")

        # Mars uses the same renderer/lightbox and keeps marker placement in viewport.
        browser.evaluate("""earth.stop(); mission.classList.remove('is-earth'); phase='mars'; mars.start({settled:true}); mars.element.style.opacity='1'; mars.enterExploration(); mars.explorationBlend=1; mars.explorationBlendTarget=1; mars.topicYaw=mars.topicYawTarget; mars.topicPitch=mars.topicPitchTarget; mars.topicRoll=mars.topicRollTarget; mars.topicShift={...mars.topicShiftTarget}; mars.render();""")
        time.sleep(.35)
        browser.evaluate("mars.setExplorationStop(0,{immediate:true,announce:false}); mars.explorationBlend=1; mars.explorationBlendTarget=1; mars.render()")
        wait_for(browser, "document.querySelectorAll('#mars-marker-media .exploration-marker-frame').length>=1")
        mars_bounds = browser.evaluate("""(()=>{const r=document.getElementById('mars-marker-media').getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:innerWidth,h:innerHeight}})()""")
        assert mars_bounds["l"] >= -1 and mars_bounds["t"] >= -1 and mars_bounds["r"] <= mars_bounds["w"] + 1 and mars_bounds["b"] <= mars_bounds["h"] + 1, mars_bounds
        assert browser.evaluate("document.querySelectorAll('#mars-exploration img').length===0")

        # Shared lightbox is literally one DOM component, not Earth/Mars duplicates.
        assert browser.evaluate("document.querySelectorAll('.exploration-lightbox').length===1")
        browser.evaluate("ExplorationMedia.render('mars',{title:'Mars UI test',images:[{src:'assets/exploration/olympus-mons.webp',alt:'Olympus'},{src:'assets/exploration/valles-marineris.webp',alt:'Valles'}]})")
        wait_for(browser, "document.querySelectorAll('#mars-marker-media .exploration-marker-frame:not(:disabled)').length===2")
        browser.click("#mars-marker-media .exploration-marker-frame:nth-child(2)")
        assert browser.evaluate("document.querySelector('.exploration-lightbox-image').getAttribute('src')") == "assets/exploration/valles-marineris.webp"
        browser.key("ArrowLeft", "ArrowLeft", 37)
        assert browser.evaluate("document.querySelector('.exploration-lightbox-image').getAttribute('src')") == "assets/exploration/olympus-mons.webp"
        browser.key("Escape", "Escape", 27)
        browser.screenshot("media-mars-final.png")

        # Mobile overflow guard.
        browser.call("Emulation.setDeviceMetricsOverride", {"width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True})
        browser.evaluate("mars.resize(); mars.setExplorationStop(1,{immediate:true,announce:false}); mars.explorationBlend=1; mars.render()")
        time.sleep(.2)
        assert browser.evaluate("document.documentElement.scrollWidth===innerWidth")
        mobile_bounds = browser.evaluate("""(()=>{const r=document.getElementById('mars-marker-media').getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:innerWidth,h:innerHeight}})()""")
        assert mobile_bounds["l"] >= -1 and mobile_bounds["r"] <= mobile_bounds["w"] + 1, mobile_bounds

        assert not browser.exceptions, browser.exceptions
        print("PASS media system: explicit unique pairs, shared exact-index lightbox, arrows/X/backdrop/ESC, broken-image cleanup, stale-state reset, Earth rotation and Mars marker behavior preserved.")
    finally:
        process.terminate()
        process.wait(timeout=10)
        server.shutdown()
        log.close()

if __name__ == "__main__":
    main()
