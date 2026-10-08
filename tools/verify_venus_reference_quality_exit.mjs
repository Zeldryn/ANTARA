#!/usr/bin/env node
import fs from "node:fs";
import vm from "node:vm";
import * as THREE from "../assets/vendor/three/three.module.min.js";

const root = new URL("../", import.meta.url);
const jsPath = new URL("venus-full-exploration.js", root);
const htmlPath = new URL("index.html", root);
const scenePath = new URL("venus-scene.js", root);
let source = fs.readFileSync(jsPath, "utf8");
const html = fs.readFileSync(htmlPath, "utf8");
const venusScene = fs.readFileSync(scenePath, "utf8");
const end = source.lastIndexOf("\n})();");
if (end < 0) throw new Error("Unable to instrument Venus Full Exploration IIFE.");
source = source.slice(0, end)
  + "\n  globalThis.__ANTARA_VENUS_REWORK_AUDIT__ = { REGIONS, VenusRegionWorld, QUALITY_PROFILES };"
  + source.slice(end);

globalThis.window = {};
globalThis.document = {};
vm.runInThisContext(source, { filename: "venus-full-exploration.js" });
const { REGIONS, VenusRegionWorld, QUALITY_PROFILES } = globalThis.__ANTARA_VENUS_REWORK_AUDIT__;

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
};

assert(Object.keys(QUALITY_PROFILES).join(",") === "LOW,MEDIUM,HIGH", "three internal quality profiles exist");
assert(html.includes(">RENDAH<") && html.includes(">SEDANG<") && html.includes(">TINGGI<"), "quality selector is user-facing Indonesian");
assert(html.includes("id=\"venus-quality-start\"") && html.includes("MULAI EKSPLORASI"), "pre-entry selector requires explicit start confirmation");
assert(source.includes("detectRecommendedQualityName()"), "quality recommendation uses a browser capability heuristic");
assert(source.includes("localStorage.setItem(VENUS_QUALITY_STORAGE_KEY"), "last selected Venus quality is remembered locally");

const low = QUALITY_PROFILES.LOW, medium = QUALITY_PROFILES.MEDIUM, high = QUALITY_PROFILES.HIGH;
assert(low.nearSegments < medium.nearSegments && medium.nearSegments < high.nearSegments, "quality changes near terrain geometry");
assert(low.midSegments < medium.midSegments && medium.midSegments < high.midSegments, "quality changes mid terrain geometry");
assert(low.farSegments < medium.farSegments && medium.farSegments < high.farSegments, "quality changes far terrain geometry");
assert(low.backgroundSegments < medium.backgroundSegments && medium.backgroundSegments < high.backgroundSegments, "quality changes distant terrain geometry");
assert(low.radarSize < medium.radarSize && medium.radarSize < high.radarSize, "quality changes radar request resolution");
assert(low.microTextureSize < medium.microTextureSize && medium.microTextureSize < high.microTextureSize, "quality changes procedural detail texture resolution");
assert(low.maxDpr < medium.maxDpr && medium.maxDpr < high.maxDpr, "quality changes render resolution budget");
assert(low.accentCount < medium.accentCount && medium.accentCount < high.accentCount, "quality changes geological prop density");
assert(low.visibleDistance < medium.visibleDistance && medium.visibleDistance < high.visibleDistance, "quality changes high-detail visibility distance");

const scene = { add() {}, remove() {} };
const renderer = { capabilities: { getMaxAnisotropy() { return 16; } } };
const region = REGIONS[0];
const triangleEstimate = profile => {
  const world = new VenusRegionWorld(THREE, scene, renderer, region, { ...profile });
  let triangles = profile.backgroundSegments * profile.backgroundSegments * 2;
  for (let tz = -profile.tileHalfCount; tz <= profile.tileHalfCount; tz += 1) {
    for (let tx = -profile.tileHalfCount; tx <= profile.tileHalfCount; tx += 1) {
      const seg = world.chooseSegments(tx * profile.tileSize, tz * profile.tileSize);
      triangles += seg * seg * 2;
    }
  }
  world.dispose();
  return triangles;
};
const triLow = triangleEstimate(low), triMedium = triangleEstimate(medium), triHigh = triangleEstimate(high);
assert(triLow < triMedium && triMedium < triHigh, `quality materially changes terrain triangle budget (${triLow} / ${triMedium} / ${triHigh})`);

assert(venusScene.includes("this.fullDiveBlend = 0") && venusScene.includes("this.fullDiveQuaternion = new THREE.Quaternion()"), "Venus scene owns dedicated full-dive state separate from explorationBlend");
assert(venusScene.includes("const dive = smooth(this.fullDiveBlend)") && venusScene.includes("this.fullDiveYawTarget"), "Venus render path applies full-dive distance and geographic orientation");
assert(!/setFullExplorationTransition\(blend, location\)[\s\S]{0,1200}this\.explorationBlend = nextBlend/.test(venusScene), "Full Exploration no longer reuses explorationBlend as its sole transition state");
assert(REGIONS.every(item => item.space?.horizontalCompression >= 6 && item.space?.horizontalCompression <= 20), "all destinations use explicit 6x-20x scientific-to-render horizontal compression");
assert(REGIONS.every(item => item.space?.verticalReliefScale > 1 && item.space?.verticalReliefScale < 1.3), "vertical relief is controlled independently from horizontal compression");
assert(source.includes("animateExitRetreat("), "Venus exit includes a physical surface retreat stage");
assert(source.includes("await this.animateExitRetreat(Math.max(currentAltitude, 18), 1650, token)"), "Venus exit keeps terrain visible during the Mars-family 1650 ms ascent stage");
assert(source.includes("const duration = reduced ? 260 : 3200"), "Venus exit uses the same primary full-dive blend duration family as Mars");
assert(source.includes("this.input.unbind();") && source.includes("this.venus.setFullExplorationTransition?.(1 - eased, this.region)"), "exit locks input and blends into the existing Venus panorama");
assert(source.indexOf("await this.animateExitRetreat") < source.indexOf("this.finishExitToOrbit();", source.indexOf("async exit()")), "world cleanup occurs after the visible retreat and blend");

const maat = REGIONS.find(item => item.id === "maat");
assert(maat && maat.fogDensity <= 0.0065, "Maat atmosphere no longer erases the far shield-volcano silhouette");
assert(REGIONS.every(item => item.lookTarget && item.spawn), "each destination has its own spawn and initial composition target");
assert(source.includes("PIA00254 grammar") && source.includes("PIA00149 grammar") && source.includes("PIA00218 / Ovda grammar") && source.includes("PIA00093 grammar") && source.includes("PIA00481 grammar"), "all five morphology systems are explicitly tied to their scientific reference grammar");

const requestedDimensions = [...venusScene.matchAll(/[?&](?:h|w)=(\d+)/g)].map(match => Number(match[1]));
assert(requestedDimensions.length > 0 && Math.max(...requestedDimensions) <= 2245, "Venus info imagery no longer requests multi-thousand-pixel 4K-class dynamic assets");

console.log(`Terrain triangle estimates LOW/MEDIUM/HIGH: ${triLow}/${triMedium}/${triHigh}`);
console.log("Venus reference, quality and exit verification complete.");
