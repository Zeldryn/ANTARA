"""Browser checks using Chromium's DevTools protocol, with no Python dependencies.

Usage: python tools/verify_browser.py --browser "path/to/chromium-browser"
Screenshots and test output are written under .tmp/ (not shipped with the site).
"""
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
        payload = json.dumps({"id": self.next_id, "method": method, "params": params or {}}).encode()
        mask = os.urandom(4)
        length = len(payload)
        header = bytes([0x81, 0x80 | length]) if length < 126 else bytes([0x81, 0x80 | 126]) + struct.pack("!H", length)
        self.sock.sendall(header + mask + bytes(value ^ mask[i % 4] for i, value in enumerate(payload)))
        while True:
            first, second = self.read(2)
            length = second & 127
            if length == 126:
                length = struct.unpack("!H", self.read(2))[0]
            elif length == 127:
                length = struct.unpack("!Q", self.read(8))[0]
            data = self.read(length)
            if first & 15 == 8:
                raise ConnectionError("Browser closed connection")
            message = json.loads(data)
            if message.get("method") == "Runtime.exceptionThrown":
                self.exceptions.append(message["params"])
            if message.get("id") == self.next_id:
                if "error" in message:
                    raise RuntimeError(message["error"])
                return message.get("result", {})

    def evaluate(self, expression):
        result = self.call("Runtime.evaluate", {"expression": expression, "returnByValue": True, "awaitPromise": True, "userGesture": True})
        if "exceptionDetails" in result:
            raise RuntimeError(result["exceptionDetails"])
        return result.get("result", {}).get("value")

    def screenshot(self, name):
        result = self.call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True})
        (TEMP / name).write_bytes(base64.b64decode(result["data"]))

    def click(self, selector):
        point = self.evaluate(f"(() => {{const r=document.querySelector({json.dumps(selector)}).getBoundingClientRect();return {{x:r.x+r.width/2,y:r.y+r.height/2}}}})()")
        for event in ["mousePressed", "mouseReleased"]:
            self.call("Input.dispatchMouseEvent", {"type": event, **point, "button": "left", "clickCount": 1})


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):
        pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", required=True)
    args = parser.parse_args()
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}"
    profile = TEMP / ("browser-profile-" + uuid.uuid4().hex[:8])
    log = (TEMP / "browser-log.txt").open("w")
    process = subprocess.Popen([args.browser, "--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--remote-debugging-port=0", f"--user-data-dir={profile}", "about:blank"], stdout=log, stderr=log, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
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
            time.sleep(0.15)
        if not any(page["type"] == "page" for page in pages):
            raise RuntimeError("Headless browser failed to open a page; see .tmp/browser-log.txt")
        page = next(page for page in pages if page["type"] == "page")
        browser = WebSocket(page["webSocketDebuggerUrl"])
        browser.call("Page.enable")
        browser.call("Runtime.enable")
        browser.call("Network.enable")
        browser.call("Emulation.setDeviceMetricsOverride", {"width": 1440, "height": 960, "deviceScaleFactor": 1, "mobile": False})
        browser.call("Page.navigate", {"url": url})
        time.sleep(2)
        browser.evaluate("localStorage.clear()")
        browser.call("Page.reload")
        time.sleep(2)
        assert browser.evaluate("sound.context === null && phase === 'idle'"), "Audio unlocked before interaction"
        assert browser.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() === '#f9f4e8'"), "Root theme variables missing"
        assert browser.evaluate("getComputedStyle(document.querySelector('h1')).color === 'rgb(249, 244, 232)'"), "Title contrast lost"
        browser.screenshot("desktop.png")
        assert browser.evaluate("flight.stage.hidden"), "Rocket visible before launch"
        assert browser.evaluate("Array.from(document.images).every(img => img.complete && img.naturalWidth > 0)"), "Missing rocket image"
        browser.click("#audio-toggle")
        assert browser.evaluate("sound.muted && sound.context === null"), "Prelaunch mute caused playback"
        browser.click("#audio-toggle")
        browser.click("#launch-button")
        time.sleep(0.65)
        entering = browser.evaluate("flight.vehicle.getBoundingClientRect().top")
        browser.screenshot("rocket-entering.png")
        time.sleep(2.2)
        running = browser.evaluate("({phase, state: sound.context.state, sources: sound.sources.size, master: sound.master.gain.value, failed: sound.unavailable})")
        print("Launch:", running)
        assert running["phase"] == "preparing" and running["state"] == "running" and running["sources"] >= 3 and not running["failed"]
        browser.screenshot("preparation.png")
        print("Flight state:", browser.evaluate("({elapsed, stage:flight.stage.dataset.phase, hidden:flight.stage.hidden, mars:mars.mode})"), "Exceptions:", browser.exceptions, flush=True)
        assert browser.evaluate("['ignition','ascent'].includes(flight.stage.dataset.phase) && !flight.stage.hidden"), "Ignition staging failed"
        assert browser.evaluate("flight.vehicle.getBoundingClientRect().top") < entering, "Rocket did not rise from below"
        # Check the actual mixed signal is audible and within a comfortable digital range.
        rms = browser.evaluate("""(async () => {
          const analyser = sound.context.createAnalyser(); analyser.fftSize = 2048;
          sound.master.connect(analyser);
          await new Promise(resolve => setTimeout(resolve, 120));
          const samples = new Float32Array(2048); analyser.getFloatTimeDomainData(samples);
          sound.master.disconnect(analyser);
          return Math.sqrt(samples.reduce((sum, n) => sum + n*n, 0) / samples.length);
        })()""")
        print("Mixed audio RMS:", rms)
        assert 0.0001 < rms < 0.3
        browser.click("#audio-toggle")
        time.sleep(0.5)
        assert browser.evaluate("sound.master.gain.value === 0 && localStorage.getItem('antariksa-muted') === 'true'"), "Mute failed"
        browser.click("#audio-toggle")
        time.sleep(0.8)
        browser.screenshot("liftoff.png")
        time.sleep(4.5)
        assert browser.evaluate("phase === 'mars' && mars.active && !mars.element.hidden"), "Mars transition failed"
        assert browser.evaluate("flight.vehicle.getBoundingClientRect().bottom < 0"), "Rocket failed to exit through the top"
        browser.screenshot("mars-distant.png")
        distant = browser.evaluate("mars.distance")
        print("Mars renderer:", browser.evaluate("({mode:mars.mode, texture:mars.element.dataset.texture, distance:mars.distance})"), flush=True)
        assert browser.evaluate("mars.mode === 'webgl' && mars.planet.geometry.type === 'SphereGeometry' && mars.planet.material.map.image.width === 2048"), "Real textured 3D sphere missing"
        time.sleep(13)
        assert browser.evaluate("mars.distance") < distant / 7, "Mars did not approach the camera"
        assert browser.evaluate("!mars.caption.inert"), "Mars caption and return control never appeared"
        angle = browser.evaluate("mars.planet.rotation.y")
        browser.screenshot("mars-arrival.png")
        time.sleep(1.2)
        assert browser.evaluate("mars.planet.rotation.y") > angle + 0.015, "Mars is static after arrival"
        assert browser.evaluate("sound.sources.size === 1"), "Facility ambience continued in space"
        assert browser.evaluate("mars.renderer.info.programs.every(p => !p.diagnostics || p.diagnostics.runnable !== false)"), "Mars shader compilation failed"
        browser.click("#replay-button")
        time.sleep(1.3)
        assert browser.evaluate("phase === 'idle' && sound.sources.size === 0 && !launchButton.disabled"), "Replay leaked audio sources"
        assert browser.evaluate("flight.stage.hidden && !mars.active && mars.frame === null && mars.element.hidden"), "Replay did not stop both scenes"
        browser.click("#launch-button")
        time.sleep(0.2)
        browser.evaluate("launchButton.click()")
        assert browser.evaluate("phase === 'preparing'"), "Duplicate click changed phase"
        time.sleep(8.6)
        browser.call("Input.dispatchKeyEvent", {"type": "keyDown", "key": "Escape", "code": "Escape", "windowsVirtualKeyCode": 27})
        time.sleep(1.3)
        browser.call("Emulation.setDeviceMetricsOverride", {"width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True})
        browser.screenshot("mobile.png")
        assert browser.evaluate("document.documentElement.scrollWidth === innerWidth"), "Horizontal mobile overflow"
        browser.click("#launch-button")
        time.sleep(3)
        browser.screenshot("mobile-ignition.png")
        assert browser.evaluate("(() => { const r = flight.vehicle.getBoundingClientRect(); return r.left > 0 && r.right < innerWidth && r.top > 0 && r.bottom < innerHeight; })()"), "Mobile rocket is clipped during ignition"
        time.sleep(6)
        browser.evaluate("mars.time = 14; mars.render()")
        browser.screenshot("mars-mobile.png")
        assert browser.evaluate("phase === 'mars' && mars.finalRadius * 2 < innerWidth && document.documentElement.scrollWidth === innerWidth"), "Mobile Mars does not fit"
        browser.call("Input.dispatchKeyEvent", {"type": "keyDown", "key": "Escape", "code": "Escape", "windowsVirtualKeyCode": 27})
        time.sleep(1.3)
        assert browser.evaluate("phase === 'idle' && sound.sources.size === 0 && flight.stage.hidden"), "Cancellation leaked scheduled audio"
        browser.call("Emulation.setDeviceMetricsOverride", {"width": 768, "height": 1024, "deviceScaleFactor": 1, "mobile": True})
        browser.screenshot("tablet.png")
        # Mute survives a reload without creating an audio context.
        browser.click("#audio-toggle")
        browser.call("Page.reload")
        time.sleep(1)
        assert browser.evaluate("sound.muted && sound.context === null"), "Mute preference not restored"
        browser.click("#audio-toggle")
        # Exercise the background-tab lifecycle handler and its clock suspension.
        browser.click("#launch-button")
        time.sleep(0.8)
        browser.evaluate("Object.defineProperty(document, 'hidden', {configurable:true, get:()=>true}); document.dispatchEvent(new Event('visibilitychange'))")
        time.sleep(0.4)
        assert browser.evaluate("sound.context.state === 'suspended' && sound.master.gain.value === 0"), "Background audio did not suspend"
        browser.evaluate("delete document.hidden; document.dispatchEvent(new Event('visibilitychange'))")
        time.sleep(0.8)
        assert browser.evaluate("sound.context.state === 'running' && sound.master.gain.value > 0.4"), "Foreground audio did not resume"
        browser.evaluate("resetMission()")
        time.sleep(1.3)
        # Missing audio files should be contained, including before the first click.
        browser.call("Network.setBlockedURLs", {"urls": ["*assets/audio/*"]})
        browser.call("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": "reduce"}]})
        browser.call("Page.reload")
        time.sleep(1)
        browser.click("#launch-button")
        time.sleep(9)
        assert browser.evaluate("phase === 'mars' && sound.unavailable"), "Audio failure blocked the mission"
        assert browser.evaluate("getComputedStyle(document.querySelector('.scene-art')).transform === 'none'"), "Reduced motion was ignored"
        angle = browser.evaluate("mars.planet.rotation.y")
        time.sleep(1)
        assert browser.evaluate("mars.planet.rotation.y") == angle, "Reduced-motion Mars still rotates"
        # Force unsupported WebGL and a missing texture: the software sphere must
        # still approach and rotate with the procedural replacement surface.
        browser.call("Page.addScriptToEvaluateOnNewDocument", {"source": "const nativeGetContext=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:nativeGetContext.call(this,kind,...args)}"})
        browser.call("Network.setBlockedURLs", {"urls": ["*assets/textures/*"]})
        browser.call("Emulation.setEmulatedMedia", {"features": []})
        browser.call("Page.reload")
        time.sleep(1)
        browser.click("#launch-button")
        time.sleep(9)
        assert browser.evaluate("phase === 'mars' && mars.mode === 'canvas' && mars.element.dataset.texture === 'procedural'"), "GPU/texture failure has no fallback"
        browser.evaluate("mars.time=14; mars.render()")
        browser.screenshot("mars-fallback.png")
        print("PASS: preserved launch, real 3D Mars approach/rotation, local texture, mobile composition, reset, audio continuity/fades, reduced motion, missing-audio and GPU/texture fallbacks.", flush=True)
        assert not browser.exceptions, browser.exceptions
    finally:
        process.terminate()
        process.wait(timeout=10)
        server.shutdown()
        log.close()


if __name__ == "__main__":
    main()
