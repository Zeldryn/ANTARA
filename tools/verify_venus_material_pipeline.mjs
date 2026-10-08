#!/usr/bin/env node
import fs from "node:fs";
import vm from "node:vm";
import * as THREE from "../assets/vendor/three/three.module.min.js";

const sourcePath = new URL("../venus-full-exploration.js", import.meta.url);
let source = fs.readFileSync(sourcePath, "utf8");
const end = source.lastIndexOf("\n})();");
if (end < 0) throw new Error("Unable to instrument Venus IIFE");
source = source.slice(0, end) + "\n globalThis.__VENUS_MATERIAL_AUDIT__={REGIONS,VenusRegionWorld,QUALITY_PROFILES};" + source.slice(end);
globalThis.window = {};
globalThis.document = {};
vm.runInThisContext(source, { filename: "venus-full-exploration.js" });
const { REGIONS, VenusRegionWorld, QUALITY_PROFILES } = globalThis.__VENUS_MATERIAL_AUDIT__;
const scene = { add(){}, remove(){} };
const renderer = { capabilities: { getMaxAnisotropy(){ return 16; } } };
const assert = (ok, msg) => { if (!ok) throw new Error(`FAIL: ${msg}`); console.log(`PASS: ${msg}`); };

assert(source.includes("map: null"), "radar is no longer wired through MeshStandardMaterial.map alpha");
assert(source.includes("Radar is sampled in shared world/geographic space"), "radar albedo uses one shared world/geographic projection across chunks");
assert(source.includes("uVenusRadarEnabled * uVenusRadarStrength * venusRadarFeather"), "radar coverage feathers into the same Venus base material instead of exposing a second material");
assert(!source.includes("venus-regional-underlay-"), "overlapping regional underlay mesh was removed");
assert(source.includes("this.background = null;"), "core terrain has no second terrain sheet intersecting it");
assert(source.includes("data[o + 3] < 250"), "transparent/no-data radar pixels are explicitly detected");
assert(source.includes("data[i] = 255") || source.includes("data[i] = 255;"), "sanitized radar output is forced opaque");
assert(!/discard\s*;/.test(source.slice(source.indexOf("createMaterial"), source.indexOf("geometryForRect"))), "Venus terrain shader does not discard radar/no-data fragments");

for (const [name, q] of Object.entries(QUALITY_PROFILES)) {
  assert(q.nearSegments % q.midSegments === 0, `${name}: near/mid core LOD edge grids are integer-compatible`);
  assert(q.midSegments % q.farSegments === 0, `${name}: mid/far core LOD edge grids are integer-compatible`);
}

const region = REGIONS.find(r => r.id === "maat");
const quality = { ...QUALITY_PROFILES.MEDIUM, accentCount: 0, atmosphereParticles: 0 };
const world = new VenusRegionWorld(THREE, scene, renderer, region, quality);
world.topography.emergencyApproximation = true;
world.referenceElevation = 0;
world.outerScientificBaseline = 0;
world.morphologyWeight = 1;

for (const z of [-world.coreHalf, -12, 0, 11, world.coreHalf]) {
  const a = world.heightAt(world.coreHalf, z);
  const b = world.continuationSurfaceHeightAt(world.coreHalf, z, 1);
  assert(Math.abs(a - b) < 1e-9, `core/continuation height is identical at seam z=${z.toFixed(1)}`);
}

// Medium tile at tx=2 borders a far tile at tx=3. The finer tile is stitched
// to the coarse edge so both surfaces occupy the same edge curve.
const size = world.tileSize;
const midSegments = quality.midSegments;
const farSegments = quality.farSegments;
const left = world.geometryForPatch(2 * size, 0, size, midSegments, false, { left: midSegments, right: farSegments, top: midSegments, bottom: midSegments });
const right = world.geometryForPatch(3 * size, 0, size, farSegments, false, { left: midSegments, right: farSegments, top: farSegments, bottom: farSegments });
const lp = left.getAttribute("position");
const rp = right.getAttribute("position");
const ln = left.getAttribute("normal");
const rn = right.getAttribute("normal");
const ratio = midSegments / farSegments;
let maxY = 0, maxNormal = 0;
for (let j = 0; j <= farSegments; j += 1) {
  const li = (j * ratio) * (midSegments + 1) + midSegments;
  const ri = j * (farSegments + 1);
  maxY = Math.max(maxY, Math.abs(lp.getY(li) - rp.getY(ri)));
  maxNormal = Math.max(maxNormal, Math.abs(ln.getX(li)-rn.getX(ri)), Math.abs(ln.getY(li)-rn.getY(ri)), Math.abs(ln.getZ(li)-rn.getZ(ri)));
}
assert(maxY < 1e-6, `mid/far neighboring chunk edge heights are stitched (${maxY.toExponential(2)} km max mismatch)`);
assert(maxNormal < 1e-5, `neighboring chunk edge normals are world-sampled consistently (${maxNormal.toExponential(2)} max mismatch)`);
left.dispose(); right.dispose(); world.dispose();

const sceneSource = fs.readFileSync(new URL("../venus-scene.js", import.meta.url), "utf8");
const alphaAsset = new URL("../assets/venus-alpha-regio-reference.svg", import.meta.url);
assert(fs.existsSync(alphaAsset), "Alpha Regio has a local reference asset");
assert(sceneSource.includes('src: "assets/venus-alpha-regio-reference.svg"'), "Venus Info Mode uses the local Alpha reference instead of a remote hotlink");
assert(source.includes('image: "assets/venus-alpha-regio-reference.svg"'), "Full Exploration selector uses the same local Alpha reference");
console.log("Venus material/tile pipeline verification complete.");
