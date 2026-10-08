#!/usr/bin/env node
import fs from "node:fs";
import vm from "node:vm";
import * as THREE from "../assets/vendor/three/three.module.min.js";

let source = fs.readFileSync(new URL("../venus-full-exploration.js", import.meta.url), "utf8");
const end = source.lastIndexOf("\n})();");
if (end < 0) throw new Error("Unable to instrument Venus Full Exploration IIFE.");
source = source.slice(0, end) + "\n globalThis.__VENUS_OUTER_AUDIT__={REGIONS,VenusRegionWorld,QUALITY_PROFILES};" + source.slice(end);
globalThis.window = {};
globalThis.document = {};
vm.runInThisContext(source, { filename: "venus-full-exploration.js" });
const { REGIONS, VenusRegionWorld, QUALITY_PROFILES } = globalThis.__VENUS_OUTER_AUDIT__;
const scene = { add() {}, remove() {} };
const renderer = { capabilities: { getMaxAnisotropy() { return 16; } } };
const quality = { ...QUALITY_PROFILES.MEDIUM };
const assert = (ok, msg) => { if (!ok) throw new Error(`FAIL: ${msg}`); console.log(`PASS: ${msg}`); };

const signatures = new Map();
for (const region of REGIONS) {
  const world = new VenusRegionWorld(THREE, scene, renderer, region, quality);
  world.morphologyWeight = 1;
  const radii = [region.playRadius * 1.10, region.playRadius * 1.45, region.playRadius * 1.85];
  const vals = [];
  for (const r of radii) {
    for (let i = 0; i < 48; i += 1) {
      const a = i / 48 * Math.PI * 2;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      vals.push(world.visualHeightAt(x, z, 0.08));
    }
  }
  const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
  const variance = vals.reduce((s,v)=>s+(v-mean)**2,0)/vals.length;
  const min = Math.min(...vals), max = Math.max(...vals);
  assert(Number.isFinite(mean) && vals.every(Number.isFinite), `${region.id}: outer continuation is finite across multiple radii`);
  assert(variance > 0.0025, `${region.id}: outer world is not a flat/blank filler (variance ${variance.toFixed(4)})`);
  assert(max - min > 0.22, `${region.id}: distant continuation preserves meaningful relief (${(max-min).toFixed(3)} km range)`);
  const farBlend = world.continuationBlendAt(region.playRadius * 1.8, 0);
  const nearBlend = world.continuationBlendAt(region.playRadius * 0.55, 0);
  assert(farBlend > 0.80 && nearBlend < 0.15, `${region.id}: continuation blends in outside the playable core instead of replacing near terrain`);
  const centered = vals.map(v=>v-mean);
  const norm = Math.sqrt(centered.reduce((s,v)=>s+v*v,0));
  signatures.set(region.id,{centered,norm});
  world.dispose();
}
const corr=(a,b)=>a.centered.reduce((s,v,i)=>s+v*b.centered[i],0)/Math.max(1e-9,a.norm*b.norm);
let maxCorr=-Infinity,pair='';
const ids=REGIONS.map(r=>r.id);
for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++) { const c=corr(signatures.get(ids[i]),signatures.get(ids[j])); if(c>maxCorr){maxCorr=c;pair=`${ids[i]} vs ${ids[j]}`;} }
assert(maxCorr < 0.92, `outer worlds remain region-specific rather than one generic ring (max correlation ${maxCorr.toFixed(3)}: ${pair})`);
assert(quality.continuationFarSegments < quality.backgroundSegments, "outer continuation reduces geometry cost relative to the detailed core terrain");
assert(quality.continuationMidSegments < quality.backgroundSegments, "outer continuation remains substantially cheaper than detailed core terrain");
console.log("Venus outer-world verification complete.");
