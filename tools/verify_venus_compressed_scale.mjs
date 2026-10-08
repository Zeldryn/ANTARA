#!/usr/bin/env node
import fs from "node:fs";
import vm from "node:vm";
import * as THREE from "../assets/vendor/three/three.module.min.js";

const path = new URL("../venus-full-exploration.js", import.meta.url);
let source = fs.readFileSync(path, "utf8");
const end = source.lastIndexOf("\n})();");
source = source.slice(0, end) + "\n globalThis.__VENUS_SCALE_AUDIT__={REGIONS,VenusRegionWorld,QUALITY_PROFILES,VENUS_REGIONAL_TOPO_HALF_EXTENT_KM};" + source.slice(end);
globalThis.window = {}; globalThis.document = {};
vm.runInThisContext(source, { filename: "venus-full-exploration.js" });
const { REGIONS, VenusRegionWorld, QUALITY_PROFILES, VENUS_REGIONAL_TOPO_HALF_EXTENT_KM } = globalThis.__VENUS_SCALE_AUDIT__;
const scene = { add(){}, remove(){} }; const renderer = { capabilities: { getMaxAnisotropy(){ return 16; } } };
const assert = (ok, message) => { if (!ok) throw new Error(`FAIL: ${message}`); console.log(`PASS: ${message}`); };

for (const region of REGIONS) {
  const world = new VenusRegionWorld(THREE, scene, renderer, region, { ...QUALITY_PROFILES.MEDIUM, accentCount: 0, atmosphereParticles: 0 });
  world.morphologyWeight = 1;
  const sourceRadius = region.playRadius * world.horizontalCompression;
  assert(sourceRadius < VENUS_REGIONAL_TOPO_HALF_EXTENT_KM, `${region.name}: entire playable radius stays inside the 330 km regional GTDR crop (${sourceRadius.toFixed(1)} km source radius)`);
  const spawn = world.worldPointFromReference(region.spawn);
  const target = world.worldPointFromReference(region.lookTarget);
  const travel = Math.hypot(target.x - spawn.x, target.z - spawn.z);
  assert(travel >= 6 && travel <= 22, `${region.name}: defining composition is reachable/readable within compact expedition scale (${travel.toFixed(1)} render km)`);
  for (const observation of region.education?.observations || []) {
    const anchor = world.worldPointFromReference(observation.anchor || {x:0,z:0});
    assert(Math.hypot(anchor.x, anchor.z) < region.playRadius, `${region.name}/${observation.id}: educational anchor remains inside compressed playable world`);
  }
  world.dispose();
}

const maat = REGIONS.find(r => r.id === "maat");
const maatWorld = new VenusRegionWorld(THREE, scene, renderer, maat, { ...QUALITY_PROFILES.MEDIUM, accentCount: 0, atmosphereParticles: 0 });
maatWorld.morphologyWeight = 1;
const maatSpawn = maatWorld.worldPointFromReference(maat.spawn);
const maatSummit = maatWorld.worldPointFromReference(maat.featureCenter);
assert(Math.hypot(maatSummit.x - maatSpawn.x, maatSummit.z - maatSpawn.z) < 20, "Maat full edifice is visually approachable from spawn instead of spanning ~100 km of render space");
assert(maatWorld.morphologyHeightAt(maatSummit.x, maatSummit.z) - maatWorld.morphologyHeightAt(maatSpawn.x, maatSpawn.z) > 4.5, "Maat keeps strong vertical relief while horizontal geography is compressed");
maatWorld.dispose();
console.log("Venus compressed scientific visualization verification complete.");
