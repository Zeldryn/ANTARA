#!/usr/bin/env node
import fs from "node:fs";
import vm from "node:vm";
import * as THREE from "../assets/vendor/three/three.module.min.js";

const sourcePath = new URL("../venus-full-exploration.js", import.meta.url);
let source = fs.readFileSync(sourcePath, "utf8");
const end = source.lastIndexOf("\n})();");
if (end < 0) throw new Error("Unable to instrument Venus Full Exploration IIFE.");
source = source.slice(0, end)
  + "\n  globalThis.__ANTARA_VENUS_MORPH_AUDIT__ = { REGIONS, VenusRegionWorld };"
  + source.slice(end);

globalThis.window = {};
globalThis.document = {};
vm.runInThisContext(source, { filename: "venus-full-exploration.js" });

const { REGIONS, VenusRegionWorld } = globalThis.__ANTARA_VENUS_MORPH_AUDIT__;
const scene = { add() {}, remove() {} };
const renderer = { capabilities: { getMaxAnisotropy() { return 16; } } };
const quality = {
  name: "LOW",
  tileSize: 32,
  tileHalfCount: 3,
  nearSegments: 64,
  midSegments: 38,
  farSegments: 22,
  backgroundSegments: 52,
  maxDpr: 1.18,
  minDpr: 0.78,
  supersample: 1,
  pixelBudget: 2250000,
  anisotropy: 3,
  accentCount: 0,
  propMultiplier: 5,
  particleCount: 0,
  microTextureSize: 192,
  shaderDetailTier: 2,
  radarSize: 576,
  visibleDistance: 142,
  coreVisibleDistance: 54,
  atmosphereParticles: 0
};

const worlds = new Map();
for (const region of REGIONS) {
  const world = new VenusRegionWorld(THREE, scene, renderer, region, quality);
  world.morphologyWeight = 1;
  worlds.set(region.id, world);
}

const H = (id, x, z) => {
  const world = worlds.get(id);
  const point = world.worldPointFromReference({ x, z });
  return world.morphologyHeightAt(point.x, point.z);
};
const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
};

assert(REGIONS.length === 5, "exactly five Venus exploration destinations remain registered");
assert(REGIONS.every(region => region.lookTarget), "every destination has a region-specific initial look target");
assert(new Set(REGIONS.map(region => `${region.spawn.x},${region.spawn.z}`)).size === 5, "spawn compositions differ across all five destinations");

// Maat: a broad shield rising gradually from low plains, with an irregular summit depression/rim.
assert(H("maat", 14, -47.5) > H("maat", 2, -47.5) + 0.20, "Maat summit contains an irregular depression/rim rather than one pointed vertex");
assert(H("maat", 0, 20) > H("maat", -24, 82) + 2.0, "Maat has long broad slopes rising from the low volcanic spawn plain");
assert(H("maat", 0, -46) > H("maat", 0, 70) + 4.0, "Maat retains a dominant volcanic edifice across regional scale");

// Maxwell: major connected mountain relief plus a large Cleopatra depression/rim relationship.
assert(H("maxwell", -60, -8) > H("maxwell", 60, -8) + 0.45, "Maxwell preserves the steeper western relief asymmetry");
assert(H("maxwell", 98, -38) > H("maxwell", 48, -38) + 0.8, "Cleopatra reads as a major basin with a strong outer rim");

// Aphrodite/Ovda: broad highland plus a pronounced fault-controlled trough.
assert(H("aphrodite", -30, -8) > H("aphrodite", 18, -6) + 0.50, "Ovda ridge/highland relief contrasts with the major trough system");
assert(H("aphrodite", 0, -8) > H("aphrodite", 0, 110) + 0.9, "Aphrodite remains a broad elevated tectonic province");

// Ishtar: smooth elevated interior versus selected mountain margins and low exterior.
assert(H("ishtar", -10, -2) > H("ishtar", 0, 100) + 2.0, "Lakshmi Planum remains a large elevated plateau");
assert(H("ishtar", -95, -4) > H("ishtar", -10, -2) + 1.0, "Ishtar selected mountain margin rises dramatically above the plateau interior");

// Alpha: no single dominant summit; local lows/fault valleys interrupt the tessera fabric.
assert(H("alpha", -38, -34) < H("alpha", 4, -8) - 0.20, "Alpha contains smoother/lower resurfaced areas inside the tessera province");
assert(H("alpha", 10, 78) < H("alpha", 4, -8) - 0.15, "Alpha includes a subdued southern Eve-related low");

const samples = new Map();
for (const region of REGIONS) {
  const world = worlds.get(region.id);
  const values = [];
  for (let iz = -30; iz <= 30; iz += 1) {
    for (let ix = -30; ix <= 30; ix += 1) {
      const x = (ix / 30) * region.playRadius * 0.92;
      const z = (iz / 30) * region.playRadius * 0.92;
      values.push(world.morphologyHeightAt(x, z));
    }
  }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const centered = values.map(value => value - mean);
  const norm = Math.sqrt(centered.reduce((sum, value) => sum + value * value, 0));
  samples.set(region.id, { centered, norm });
}

const correlation = (a, b) => {
  let dot = 0;
  for (let i = 0; i < a.centered.length; i += 1) dot += a.centered[i] * b.centered[i];
  return dot / Math.max(1e-9, a.norm * b.norm);
};
let maxPairCorrelation = -Infinity;
let maxPair = "";
const ids = REGIONS.map(region => region.id);
for (let i = 0; i < ids.length; i += 1) {
  for (let j = i + 1; j < ids.length; j += 1) {
    const value = correlation(samples.get(ids[i]), samples.get(ids[j]));
    if (value > maxPairCorrelation) {
      maxPairCorrelation = value;
      maxPair = `${ids[i]} vs ${ids[j]}`;
    }
  }
}
assert(maxPairCorrelation < 0.90, `neutral-heightfield morphology is not a five-map reskin (highest correlation ${maxPairCorrelation.toFixed(3)}: ${maxPair})`);

for (const world of worlds.values()) world.dispose();
console.log("Venus morphology verification complete.");
