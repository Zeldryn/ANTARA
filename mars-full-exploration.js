"use strict";

/*
 * ANTARA Mars Full Exploration
 *
 * The normal Mars renderer remains authoritative for orbit mode. This module owns
 * a second, lazy surface renderer and only becomes active after the user explicitly
 * enters Full Exploration.
 *
 * Elevation comes from the Jaanga 128 px/degree derivative of MGS MOLA MEGDR.
 * Surface imagery is streamed as geographic LOD from NASA Trek: Viking MDIM 2.1
 * color imagery for the global base plus THEMIS day IR as a real-data detail layer
 * close to the terrain. The original 2K Mars texture remains only as an offline
 * placeholder while scientific imagery tiles load.
 *
 * Deployments can self-host compatible sources before this file runs:
 *   window.ANTARA_MARS_TERRAIN_BASE = "assets/mars-mola-128p/";
 *   window.ANTARA_MARS_VIKING_TEMPLATE = ".../{z}/{row}/{col}.jpg";
 *   window.ANTARA_MARS_THEMIS_TEMPLATE = ".../{z}/{row}/{col}.jpg";
 */

(() => {
  const DEG = Math.PI / 180;
  const MARS_RADIUS_KM = 3389.5;
  const KM_PER_DEG_LAT = 2 * Math.PI * MARS_RADIUS_KM / 360;
  const DEFAULT_TILE_BASE = "https://jaanga.github.io/mars-heightmaps-128p/";
  const TILE_BASE = String(window.ANTARA_MARS_TERRAIN_BASE || DEFAULT_TILE_BASE).replace(/\/?$/, "/");
  const TILE_SIZE = 128;
  const IMAGERY_TILE_SIZE = 256;
  const MAX_EXPLORATION_ALTITUDE_KM = 30;
  const ALTITUDE_LIMIT_WARNING_KM = 29.75;
  const MIN_DATA_LAT = -87.999;
  const MAX_DATA_LAT = 87.999;
  const DEFAULT_VIKING_TEMPLATE = "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{row}/{col}.jpg";
  const DEFAULT_THEMIS_TEMPLATE = "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v12_clon0_ly/1.0.0/default/default028mm/{z}/{row}/{col}.jpg";
  const VIKING_TEMPLATE = String(window.ANTARA_MARS_VIKING_TEMPLATE || DEFAULT_VIKING_TEMPLATE);
  const THEMIS_TEMPLATE = String(window.ANTARA_MARS_THEMIS_TEMPLATE || DEFAULT_THEMIS_TEMPLATE);

  const STATES = Object.freeze({
    IDLE: "IDLE",
    PREPARING: "PREPARING",
    ENTERING: "ENTERING",
    EXPLORING: "EXPLORING",
    TRAVELLING: "TRAVELLING_TO_LOCATION",
    EXITING: "EXITING",
    ERROR: "ERROR"
  });

  const LANDMARKS = Object.freeze([
    {
      id: "jezero",
      name: "Kawah Jezero",
      type: "Kawah tumbukan dan bekas danau purba",
      latitude: 18.41,
      longitudeEast: 77.69,
      heading: 0.18,
      source: "https://planetarynames.wr.usgs.gov/Feature/14300"
    },
    {
      id: "olympus",
      name: "Olympus Mons",
      type: "Gunung api perisai raksasa",
      latitude: 18.65,
      longitudeEast: 226.20,
      heading: -0.65,
      source: "https://planetarynames.wr.usgs.gov/Feature/4453"
    },
    {
      id: "valles",
      name: "Valles Marineris",
      type: "Sistem ngarai raksasa",
      latitude: -14.01,
      longitudeEast: 301.41,
      heading: -0.12,
      source: "https://planetarynames.wr.usgs.gov/Feature/6288"
    },
    {
      id: "gale",
      name: "Gale Crater",
      type: "Kawah tumbukan, lokasi eksplorasi Curiosity",
      latitude: -5.37,
      longitudeEast: 137.81,
      heading: 0.44,
      source: "https://planetarynames.wr.usgs.gov/Feature/2071"
    }
  ]);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = value => {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };
  const smootherstep = value => {
    const t = clamp(value, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  };
  const wrapLongitude = longitude => {
    let result = longitude;
    while (result < -180) result += 360;
    while (result >= 180) result -= 360;
    return result;
  };
  const eastLongitude = signedLongitude => ((signedLongitude % 360) + 360) % 360;
  const shortestLongitudeDelta = (from, to) => wrapLongitude(to - from);
  const formatCoordinate = (latitude, longitudeEast) => {
    const latHemisphere = latitude >= 0 ? "N" : "S";
    return `${Math.abs(latitude).toFixed(3)}° ${latHemisphere}  ·  ${eastLongitude(longitudeEast).toFixed(3)}° E`;
  };
  const formatAltitude = km => km < 1 ? `${Math.max(0, km * 1000).toFixed(0)} M` : `${Math.max(0, km).toFixed(km < 10 ? 2 : 1)} KM`;
  const formatSpeed = kmPerSecond => kmPerSecond < 1 ? `${Math.round(kmPerSecond * 1000)} M/S` : `${kmPerSecond.toFixed(2)} KM/S`;

  class MolaTileProvider {
    constructor(baseUrl = TILE_BASE) {
      this.baseUrl = baseUrl;
      this.cache = new Map();
      this.pending = new Map();
      this.generation = 0;
      this.maxCache = 72;
      this.sourceLabel = baseUrl.includes("jaanga.github.io") ? "MOLA / PDS · tiled derivative" : "MOLA / PDS · local tiles";
    }

    tileForLocation(latitude, signedLongitude) {
      const safeLat = clamp(latitude, MIN_DATA_LAT, MAX_DATA_LAT);
      return {
        lonWest: Math.floor(wrapLongitude(signedLongitude)),
        latNorth: Math.ceil(safeLat)
      };
    }

    tileKey(lonWest, latNorth) {
      return `${wrapLongitude(lonWest)},${latNorth}`;
    }

    tileUrl(lonWest, latNorth) {
      const lon = Math.floor(wrapLongitude(lonWest));
      const lat = Math.floor(clamp(latNorth, -87, 88));
      const lonText = lon >= 0 ? `+${lon}` : `${lon}`;
      const latText = lat >= 0 ? `+${lat}` : `${lat}`;
      return `${this.baseUrl}${lonText}/128p${lonText}${latText}.png`;
    }

    async load(lonWest, latNorth) {
      const lon = Math.floor(wrapLongitude(lonWest));
      const lat = Math.floor(clamp(latNorth, -87, 88));
      const key = this.tileKey(lon, lat);
      if (this.cache.has(key)) {
        const cached = this.cache.get(key);
        cached.lastUsed = performance.now();
        return cached;
      }
      if (this.pending.has(key)) return this.pending.get(key);

      const promise = this.loadImageTile(lon, lat).finally(() => this.pending.delete(key));
      this.pending.set(key, promise);
      return promise;
    }

    loadImageTile(lonWest, latNorth) {
      const generation = this.generation;
      return new Promise((resolve, reject) => {
        const image = new Image();
        const url = this.tileUrl(lonWest, latNorth);
        let settled = false;
        const timeout = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          image.src = "";
          reject(new Error(`MOLA tile timeout: ${url}`));
        }, 12000);

        image.crossOrigin = "anonymous";
        image.decoding = "async";
        image.onload = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          if (generation !== this.generation) {
            reject(new Error("MOLA tile request cancelled."));
            return;
          }
          try {
            const canvas = document.createElement("canvas");
            canvas.width = TILE_SIZE;
            canvas.height = TILE_SIZE;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            context.drawImage(image, 0, 0, TILE_SIZE, TILE_SIZE);
            const rgba = context.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data;
            const heights = new Float32Array(TILE_SIZE * TILE_SIZE);
            let min = Infinity;
            let max = -Infinity;
            for (let i = 0, p = 0; p < heights.length; i += 4, p += 1) {
              // Jaanga's reference rover reconstructs each height sample as R + 255 * G.
              // A fixed datum offset only recenters the renderer's Y range; it does not alter
              // the MOLA-derived height differences that form mountains, craters, and valleys.
              const encoded = rgba[i] + rgba[i + 1] * 255;
              const meters = encoded - 32768;
              const km = meters / 1000;
              heights[p] = km;
              if (km < min) min = km;
              if (km > max) max = km;
            }
            const tile = { lonWest, latNorth, heights, min, max, lastUsed: performance.now(), url };
            this.cache.set(this.tileKey(lonWest, latNorth), tile);
            this.trimCache();
            resolve(tile);
          } catch (error) {
            reject(new Error(`MOLA tile decode failed: ${error.message}`));
          }
        };
        image.onerror = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          reject(new Error(`MOLA tile unavailable: ${url}`));
        };
        image.src = url;
      });
    }

    trimCache() {
      if (this.cache.size <= this.maxCache) return;
      const sorted = [...this.cache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      while (sorted.length && this.cache.size > this.maxCache) {
        const [key] = sorted.shift();
        this.cache.delete(key);
      }
    }

    sampleTile(tile, latitude, signedLongitude) {
      const lonDelta = wrapLongitude(signedLongitude - tile.lonWest);
      const x = clamp(lonDelta, 0, 0.999999) * (TILE_SIZE - 1);
      const y = clamp(tile.latNorth - latitude, 0, 0.999999) * (TILE_SIZE - 1);
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(TILE_SIZE - 1, x0 + 1);
      const y1 = Math.min(TILE_SIZE - 1, y0 + 1);
      const tx = x - x0;
      const ty = y - y0;
      const h00 = tile.heights[y0 * TILE_SIZE + x0];
      const h10 = tile.heights[y0 * TILE_SIZE + x1];
      const h01 = tile.heights[y1 * TILE_SIZE + x0];
      const h11 = tile.heights[y1 * TILE_SIZE + x1];
      return lerp(lerp(h00, h10, tx), lerp(h01, h11, tx), ty);
    }

    sampleCached(latitude, signedLongitude) {
      const address = this.tileForLocation(latitude, signedLongitude);
      const tile = this.cache.get(this.tileKey(address.lonWest, address.latNorth));
      if (!tile) return null;
      tile.lastUsed = performance.now();
      return this.sampleTile(tile, latitude, signedLongitude);
    }

    clear() {
      this.generation += 1;
      this.cache.clear();
      this.pending.clear();
    }
  }

  class MarsImageryProvider {
    constructor(quality) {
      this.quality = quality;
      this.imageCache = new Map();
      this.pendingImages = new Map();
      this.patchCache = new Map();
      this.pendingPatches = new Map();
      this.generation = 0;
      this.maxImageCache = quality.name === "HIGH" ? 220 : quality.name === "MEDIUM" ? 150 : 90;
      this.maxPatchCache = quality.name === "HIGH" ? 96 : quality.name === "MEDIUM" ? 64 : 40;
      this.sourceLabel = "MOLA elevation · NASA Trek Viking 232 m · THEMIS 100 m";
      this.layers = {
        viking: {
          id: "viking",
          template: VIKING_TEMPLATE,
          minZoom: 0,
          maxZoom: Math.min(7, quality.imageryMaxZ),
          minLat: -90,
          maxLat: 90
        },
        themis: {
          id: "themis",
          template: THEMIS_TEMPLATE,
          minZoom: 0,
          maxZoom: Math.min(9, quality.themisMaxZ),
          minLat: -65,
          maxLat: 65
        }
      };
    }

    profileForAltitude(altitudeKm, latitude) {
      const altitude = clamp(altitudeKm, 0, MAX_EXPLORATION_ALTITUDE_KM);
      let colorZoom = altitude > 22 ? 5 : altitude > 10 ? 6 : 7;
      colorZoom = Math.min(colorZoom, this.layers.viking.maxZoom);

      let detailZoom = null;
      let detailStrength = 0;
      if (latitude >= this.layers.themis.minLat && latitude <= this.layers.themis.maxLat && this.layers.themis.maxZoom >= 8 && altitude < 12) {
        detailZoom = altitude <= 3.5 ? 9 : 8;
        detailZoom = Math.min(detailZoom, this.layers.themis.maxZoom);
        detailStrength = altitude <= 1.25 ? 0.58 : altitude <= 3.5 ? 0.48 : altitude <= 8 ? 0.36 : 0.26;
      }

      const baseTextureSize = colorZoom >= 7 ? 256 : colorZoom === 6 ? 192 : colorZoom === 5 ? 128 : 96;
      const detailTextureSize = detailZoom === 9 ? 640 : detailZoom === 8 ? 384 : 0;
      const textureSize = Math.min(this.quality.textureSize, Math.max(baseTextureSize, detailTextureSize));
      return {
        colorZoom,
        detailZoom,
        detailStrength,
        textureSize,
        key: `v${colorZoom}-t${detailZoom ?? 0}-s${textureSize}`
      };
    }

    gridForZoom(zoom) {
      return { columns: 2 ** (zoom + 1), rows: 2 ** zoom };
    }

    tileUrl(layer, zoom, row, col) {
      return layer.template
        .replace("{z}", String(zoom))
        .replace("{row}", String(row))
        .replace("{col}", String(col));
    }

    async loadImage(layer, zoom, row, col) {
      const grid = this.gridForZoom(zoom);
      if (row < 0 || row >= grid.rows) throw new Error("Imagery tile outside latitude range.");
      const wrappedCol = ((col % grid.columns) + grid.columns) % grid.columns;
      const key = `${layer.id}:${zoom}:${row}:${wrappedCol}`;
      if (this.imageCache.has(key)) {
        const cached = this.imageCache.get(key);
        cached.lastUsed = performance.now();
        return cached.image;
      }
      if (this.pendingImages.has(key)) return this.pendingImages.get(key);

      const generation = this.generation;
      const promise = new Promise((resolve, reject) => {
        const image = new Image();
        let settled = false;
        const url = this.tileUrl(layer, zoom, row, wrappedCol);
        const timeout = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          image.src = "";
          reject(new Error(`Mars imagery timeout: ${url}`));
        }, 7000);
        image.crossOrigin = "anonymous";
        image.decoding = "async";
        image.onload = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          if (generation !== this.generation) return reject(new Error("Mars imagery request cancelled."));
          this.imageCache.set(key, { image, lastUsed: performance.now() });
          this.trimImageCache();
          resolve(image);
        };
        image.onerror = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          reject(new Error(`Mars imagery unavailable: ${url}`));
        };
        image.src = url;
      }).finally(() => this.pendingImages.delete(key));
      this.pendingImages.set(key, promise);
      return promise;
    }

    trimImageCache() {
      if (this.imageCache.size <= this.maxImageCache) return;
      const entries = [...this.imageCache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      while (entries.length && this.imageCache.size > this.maxImageCache) {
        const [key] = entries.shift();
        this.imageCache.delete(key);
      }
    }

    trimPatchCache() {
      if (this.patchCache.size <= this.maxPatchCache) return;
      const entries = [...this.patchCache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      while (entries.length && this.patchCache.size > this.maxPatchCache) {
        const [key] = entries.shift();
        this.patchCache.delete(key);
      }
    }

    async buildLayerPatch(layer, zoom, lonWest, latNorth, size) {
      if (latNorth < layer.minLat || latNorth - 1 > layer.maxLat) return null;
      const grid = this.gridForZoom(zoom);
      const worldWidth = grid.columns * IMAGERY_TILE_SIZE;
      const worldHeight = grid.rows * IMAGERY_TILE_SIZE;
      const x0 = ((lonWest + 180) / 360) * worldWidth;
      const x1 = ((lonWest + 181) / 360) * worldWidth;
      const y0 = ((90 - latNorth) / 180) * worldHeight;
      const y1 = ((91 - latNorth) / 180) * worldHeight;
      const colStart = Math.floor(x0 / IMAGERY_TILE_SIZE);
      const colEnd = Math.floor((x1 - 1e-6) / IMAGERY_TILE_SIZE);
      const rowStart = Math.floor(y0 / IMAGERY_TILE_SIZE);
      const rowEnd = Math.floor((y1 - 1e-6) / IMAGERY_TILE_SIZE);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d", { alpha: false });
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      let successfulTiles = 0;

      const jobs = [];
      for (let row = rowStart; row <= rowEnd; row += 1) {
        for (let col = colStart; col <= colEnd; col += 1) {
          jobs.push((async () => {
            try {
              const image = await this.loadImage(layer, zoom, row, col);
              const tileX = col * IMAGERY_TILE_SIZE;
              const tileY = row * IMAGERY_TILE_SIZE;
              const dx = ((tileX - x0) / (x1 - x0)) * size;
              const dy = ((tileY - y0) / (y1 - y0)) * size;
              const dw = (IMAGERY_TILE_SIZE / (x1 - x0)) * size;
              const dh = (IMAGERY_TILE_SIZE / (y1 - y0)) * size;
              context.drawImage(image, dx, dy, dw, dh);
              successfulTiles += 1;
            } catch {}
          })());
        }
      }
      await Promise.all(jobs);
      return successfulTiles === jobs.length ? canvas : null;
    }

    combineScientificDetail(baseCanvas, detailCanvas, strength) {
      if (!detailCanvas || strength <= 0) return baseCanvas;
      const size = baseCanvas.width;
      const output = document.createElement("canvas");
      output.width = size;
      output.height = size;
      const outputContext = output.getContext("2d", { willReadFrequently: true });
      outputContext.drawImage(baseCanvas, 0, 0, size, size);

      const detail = document.createElement("canvas");
      detail.width = size;
      detail.height = size;
      const detailContext = detail.getContext("2d", { willReadFrequently: true });
      detailContext.drawImage(detailCanvas, 0, 0, size, size);

      const low = document.createElement("canvas");
      const lowSize = Math.max(24, Math.round(size / 8));
      low.width = lowSize;
      low.height = lowSize;
      const lowContext = low.getContext("2d");
      lowContext.imageSmoothingEnabled = true;
      lowContext.imageSmoothingQuality = "high";
      lowContext.drawImage(detailCanvas, 0, 0, lowSize, lowSize);
      const blurred = document.createElement("canvas");
      blurred.width = size;
      blurred.height = size;
      const blurredContext = blurred.getContext("2d", { willReadFrequently: true });
      blurredContext.imageSmoothingEnabled = true;
      blurredContext.imageSmoothingQuality = "high";
      blurredContext.drawImage(low, 0, 0, size, size);

      try {
        const basePixels = outputContext.getImageData(0, 0, size, size);
        const detailPixels = detailContext.getImageData(0, 0, size, size).data;
        const blurredPixels = blurredContext.getImageData(0, 0, size, size).data;
        const pixels = basePixels.data;
        for (let i = 0; i < pixels.length; i += 4) {
          const detailLum = detailPixels[i] * 0.299 + detailPixels[i + 1] * 0.587 + detailPixels[i + 2] * 0.114;
          const lowLum = blurredPixels[i] * 0.299 + blurredPixels[i + 1] * 0.587 + blurredPixels[i + 2] * 0.114;
          const highPass = clamp((detailLum - lowLum) / 255, -0.24, 0.24);
          const gain = clamp(1 + highPass * strength * 2.1, 0.82, 1.18);
          pixels[i] = clamp(pixels[i] * gain, 0, 255);
          pixels[i + 1] = clamp(pixels[i + 1] * gain, 0, 255);
          pixels[i + 2] = clamp(pixels[i + 2] * gain, 0, 255);
        }
        outputContext.putImageData(basePixels, 0, 0);
        return output;
      } catch {
        return baseCanvas;
      }
    }

    async buildPatch(lonWest, latNorth, profile) {
      const size = profile.textureSize;
      const key = `${lonWest},${latNorth}:${profile.key}:${size}`;
      if (this.patchCache.has(key)) {
        const cached = this.patchCache.get(key);
        cached.lastUsed = performance.now();
        return cached.canvas;
      }
      if (this.pendingPatches.has(key)) return this.pendingPatches.get(key);
      const generation = this.generation;
      const promise = (async () => {
        const base = await this.buildLayerPatch(this.layers.viking, profile.colorZoom, lonWest, latNorth, size);
        if (!base || generation !== this.generation) return null;
        let result = base;
        if (profile.detailZoom !== null) {
          const detail = await this.buildLayerPatch(this.layers.themis, profile.detailZoom, lonWest, latNorth, size);
          if (generation !== this.generation) return null;
          if (detail) result = this.combineScientificDetail(base, detail, profile.detailStrength);
        }
        this.patchCache.set(key, { canvas: result, lastUsed: performance.now() });
        this.trimPatchCache();
        return result;
      })().finally(() => this.pendingPatches.delete(key));
      this.pendingPatches.set(key, promise);
      return promise;
    }

    prefetch(lonWest, latNorth, profile) {
      this.buildPatch(lonWest, latNorth, profile).catch(() => {});
    }

    clear() {
      this.generation += 1;
      this.imageCache.clear();
      this.pendingImages.clear();
      this.patchCache.clear();
      this.pendingPatches.clear();
    }
  }

  class TerrainManager {
    constructor(THREE, scene, provider, imagery, surfaceImage, quality) {
      this.THREE = THREE;
      this.scene = scene;
      this.provider = provider;
      this.imagery = imagery;
      this.quality = quality;
      this.meshes = new Map();
      this.requestGeneration = 0;
      this.origin = { latitude: 0, signedLongitude: 0 };
      this.lastCenterTile = "";
      this.lastTextureProfile = "";
      this.group = new THREE.Group();
      this.scene.add(this.group);

      // The orbit renderer only has a 2K global color map, so it is retained as
      // a continuity placeholder only. Scientific surface color is upgraded per
      // geographic tile from NASA Trek Viking imagery, with THEMIS IR contributing
      // real higher-frequency detail close to the ground.
      this.sourceCanvas = document.createElement("canvas");
      this.sourceCanvas.width = surfaceImage.width || 2048;
      this.sourceCanvas.height = surfaceImage.height || 1024;
      const sourceContext = this.sourceCanvas.getContext("2d", { willReadFrequently: true });
      sourceContext.drawImage(surfaceImage, 0, 0, this.sourceCanvas.width, this.sourceCanvas.height);
      this.sourcePixels = sourceContext.getImageData(0, 0, this.sourceCanvas.width, this.sourceCanvas.height).data;
      this.sourceWidth = this.sourceCanvas.width;
      this.sourceHeight = this.sourceCanvas.height;
    }

    setOrigin(latitude, longitudeEast) {
      this.origin.latitude = clamp(latitude, MIN_DATA_LAT, MAX_DATA_LAT);
      this.origin.signedLongitude = wrapLongitude(longitudeEast > 180 ? longitudeEast - 360 : longitudeEast);
      this.lastCenterTile = "";
    }

    worldFromGeo(latitude, signedLongitude) {
      const cosLatitude = Math.max(0.08, Math.cos(this.origin.latitude * DEG));
      const dLon = shortestLongitudeDelta(this.origin.signedLongitude, signedLongitude);
      return {
        x: dLon * KM_PER_DEG_LAT * cosLatitude,
        z: -(latitude - this.origin.latitude) * KM_PER_DEG_LAT
      };
    }

    geoFromWorld(x, z) {
      const cosLatitude = Math.max(0.08, Math.cos(this.origin.latitude * DEG));
      const latitude = clamp(this.origin.latitude - z / KM_PER_DEG_LAT, MIN_DATA_LAT, MAX_DATA_LAT);
      const signedLongitude = wrapLongitude(this.origin.signedLongitude + x / (KM_PER_DEG_LAT * cosLatitude));
      return { latitude, signedLongitude, longitudeEast: eastLongitude(signedLongitude) };
    }

    desiredRadius() {
      return this.quality.radius;
    }

    segmentsForOffset(dx, dy) {
      const ring = Math.max(Math.abs(dx), Math.abs(dy));
      if (ring === 0) return this.quality.nearSegments;
      if (ring === 1) return this.quality.midSegments;
      return this.quality.farSegments;
    }

    async ensureAround(latitude, signedLongitude, { requiredRadius = 1, onProgress = null, textureAltitude = MAX_EXPLORATION_ALTITUDE_KM } = {}) {
      const center = this.provider.tileForLocation(latitude, signedLongitude);
      const radius = this.desiredRadius();
      const generation = ++this.requestGeneration;
      const desired = new Map();
      const mandatory = [];
      const optional = [];

      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const lonWest = Math.floor(wrapLongitude(center.lonWest + dx));
          const latNorth = center.latNorth - dy;
          if (latNorth > 88 || latNorth < -87) continue;
          const segments = this.segmentsForOffset(dx, dy);
          const key = `${this.provider.tileKey(lonWest, latNorth)}@${segments}`;
          const entry = { key, lonWest, latNorth, segments, dx, dy };
          desired.set(key, entry);
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= requiredRadius) mandatory.push(entry);
          else optional.push(entry);
        }
      }

      this.prune(desired);
      let completed = 0;
      const total = Math.max(1, mandatory.length);
      const loadEntry = async entry => {
        if (generation !== this.requestGeneration) return;
        if (this.meshes.has(entry.key)) {
          const existing = this.meshes.get(entry.key);
          const ring = Math.max(Math.abs(entry.dx), Math.abs(entry.dy));
          await this.upgradeEntryTexture(existing, textureAltitude, ring);
          completed += 1;
          onProgress?.(completed / total);
          return;
        }
        const tile = await this.provider.load(entry.lonWest, entry.latNorth);
        if (generation !== this.requestGeneration) return;
        const mesh = this.createTileMesh(tile, entry.segments);
        this.group.add(mesh);
        const record = { mesh, tile, lonWest: entry.lonWest, latNorth: entry.latNorth, segments: entry.segments, textureProfile: "fallback", textureLoading: "", textureToken: 0 };
        this.meshes.set(entry.key, record);
        const ring = Math.max(Math.abs(entry.dx), Math.abs(entry.dy));
        await this.primeEntryTexture(record, textureAltitude, ring);
        completed += 1;
        onProgress?.(completed / total);
      };

      await Promise.all(mandatory.map(loadEntry));
      if (generation !== this.requestGeneration) return;
      this.lastCenterTile = this.provider.tileKey(center.lonWest, center.latNorth);

      // Outer LOD tiles are intentionally background work. They improve the horizon
      // without blocking the user from entering the experience.
      Promise.allSettled(optional.map(async entry => {
        if (generation !== this.requestGeneration || this.meshes.has(entry.key)) return;
        const tile = await this.provider.load(entry.lonWest, entry.latNorth);
        if (generation !== this.requestGeneration) return;
        const mesh = this.createTileMesh(tile, entry.segments);
        this.group.add(mesh);
        const record = { mesh, tile, lonWest: entry.lonWest, latNorth: entry.latNorth, segments: entry.segments, textureProfile: "fallback", textureLoading: "", textureToken: 0 };
        this.meshes.set(entry.key, record);
        const ring = Math.max(Math.abs(entry.dx), Math.abs(entry.dy));
        this.primeEntryTexture(record, textureAltitude, ring).catch(() => {});
      }));
    }

    maybeStream(latitude, signedLongitude, altitudeKm) {
      const center = this.provider.tileForLocation(latitude, signedLongitude);
      const key = this.provider.tileKey(center.lonWest, center.latNorth);
      const profileKey = this.imagery.profileForAltitude(altitudeKm, latitude).key;
      if (key === this.lastCenterTile && profileKey === this.lastTextureProfile) return;
      this.lastTextureProfile = profileKey;
      if (key === this.lastCenterTile) {
        this.refreshTextureLOD(altitudeKm, latitude, signedLongitude);
        return;
      }
      this.ensureAround(latitude, signedLongitude, { requiredRadius: 0, textureAltitude: altitudeKm }).catch(() => {});
    }

    createFallbackAlbedo(tile) {
      const THREE = this.THREE;
      const size = Math.min(192, this.quality.textureSize);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const sourceX = ((tile.lonWest + 180) / 360) * this.sourceWidth;
      const sourceY = ((90 - tile.latNorth) / 180) * this.sourceHeight;
      const sourceW = this.sourceWidth / 360;
      const sourceH = this.sourceHeight / 180;
      context.drawImage(this.sourceCanvas, sourceX, sourceY, sourceW, sourceH, 0, 0, size, size);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = Math.min(this.quality.anisotropy || 4, 8);
      texture.needsUpdate = true;
      return texture;
    }

    createMolaNormalMap(tile) {
      const THREE = this.THREE;
      const size = TILE_SIZE;
      const data = new Uint8Array(size * size * 4);
      const heights = tile.heights;
      const centerLat = tile.latNorth - 0.5;
      const spacingX = Math.max(0.08, KM_PER_DEG_LAT * Math.cos(centerLat * DEG) / (size - 1));
      const spacingZ = KM_PER_DEG_LAT / (size - 1);
      let out = 0;
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const left = heights[y * size + Math.max(0, x - 1)];
          const right = heights[y * size + Math.min(size - 1, x + 1)];
          const north = heights[Math.max(0, y - 1) * size + x];
          const south = heights[Math.min(size - 1, y + 1) * size + x];
          const dx = (right - left) / Math.max(spacingX * 2, 0.001);
          const dz = (south - north) / Math.max(spacingZ * 2, 0.001);
          let nx = -dx * 0.58;
          let ny = 1;
          let nz = -dz * 0.58;
          const length = Math.hypot(nx, ny, nz) || 1;
          nx /= length;
          ny /= length;
          nz /= length;
          data[out++] = Math.round((nx * 0.5 + 0.5) * 255);
          data[out++] = Math.round((ny * 0.5 + 0.5) * 255);
          data[out++] = Math.round((nz * 0.5 + 0.5) * 255);
          data[out++] = 255;
        }
      }
      const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = Math.min(this.quality.anisotropy || 4, 8);
      texture.needsUpdate = true;
      return texture;
    }

    textureFromCanvas(canvas) {
      const THREE = this.THREE;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = this.quality.anisotropy || 4;
      texture.needsUpdate = true;
      return texture;
    }

    cancelTextureTransition(entry, disposeCandidate = true) {
      const transition = entry?.textureTransition;
      if (!transition) return;
      transition.cancelled = true;
      const overlay = transition.overlay;
      if (overlay?.parent) overlay.parent.remove(overlay);
      if (overlay?.material) {
        overlay.material.map = null;
        overlay.material.normalMap = null;
        overlay.material.dispose?.();
      }
      if (disposeCandidate && transition.texture && transition.texture !== entry.mesh?.material?.map) {
        transition.texture.dispose?.();
      }
      entry.textureTransition = null;
    }

    async crossfadeEntryTexture(entry, nextTexture, requestToken) {
      if (!entry?.mesh?.parent || requestToken !== entry.textureToken) {
        nextTexture.dispose?.();
        return false;
      }
      this.cancelTextureTransition(entry);
      const mesh = entry.mesh;
      const THREE = this.THREE;
      const overlayMaterial = new THREE.MeshStandardMaterial({
        map: nextTexture,
        normalMap: mesh.material.normalMap,
        normalMapType: THREE.ObjectSpaceNormalMap,
        roughness: mesh.material.roughness,
        metalness: 0,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        dithering: true
      });
      const overlay = new THREE.Mesh(mesh.geometry, overlayMaterial);
      overlay.frustumCulled = mesh.frustumCulled;
      overlay.renderOrder = 1;
      mesh.add(overlay);
      const transition = { overlay, texture: nextTexture, cancelled: false };
      entry.textureTransition = transition;

      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      const duration = reduced ? 0 : 240;
      if (duration > 0) {
        const start = performance.now();
        await new Promise(resolve => {
          const frame = now => {
            if (transition.cancelled || requestToken !== entry.textureToken || !mesh.parent) return resolve();
            const t = smoothstep((now - start) / duration);
            overlayMaterial.opacity = t;
            if (t < 1) requestAnimationFrame(frame);
            else resolve();
          };
          requestAnimationFrame(frame);
        });
      }

      if (transition.cancelled || requestToken !== entry.textureToken || !mesh.parent) {
        if (entry.textureTransition === transition) this.cancelTextureTransition(entry);
        else nextTexture.dispose?.();
        return false;
      }

      const previous = mesh.material.map;
      mesh.material.map = nextTexture;
      mesh.material.needsUpdate = true;
      if (overlay.parent) overlay.parent.remove(overlay);
      overlayMaterial.map = null;
      overlayMaterial.normalMap = null;
      overlayMaterial.dispose();
      entry.textureTransition = null;
      if (previous && previous !== nextTexture) previous.dispose?.();
      return true;
    }

    async upgradeEntryTexture(entry, altitudeKm, ring = 0) {
      if (!entry?.mesh || !entry.tile || !this.imagery) return;
      const latitude = entry.latNorth - 0.5;
      const visualAltitude = clamp(altitudeKm + ring * 7, 0, MAX_EXPLORATION_ALTITUDE_KM);
      const profile = this.imagery.profileForAltitude(visualAltitude, latitude);
      if (entry.textureProfile === profile.key || entry.textureLoading === profile.key) return;
      const requestToken = (entry.textureToken || 0) + 1;
      entry.textureToken = requestToken;
      entry.textureLoading = profile.key;
      try {
        const canvas = await this.imagery.buildPatch(entry.lonWest, entry.latNorth, profile);
        if (!canvas || requestToken !== entry.textureToken || !entry.mesh.parent) return;
        const nextTexture = this.textureFromCanvas(canvas);
        const applied = await this.crossfadeEntryTexture(entry, nextTexture, requestToken);
        if (applied && requestToken === entry.textureToken) entry.textureProfile = profile.key;
      } catch {
        // Keep the current lower LOD texture if the higher detail source is unavailable.
      } finally {
        if (entry.textureLoading === profile.key) entry.textureLoading = "";
      }
    }

    async primeEntryTexture(entry, altitudeKm, ring = 0) {
      if (!entry?.mesh) return;
      const latitude = entry.latNorth - 0.5;
      const desiredAltitude = clamp(altitudeKm + ring * 7, 0, MAX_EXPLORATION_ALTITUDE_KM);
      const desiredProfile = this.imagery.profileForAltitude(desiredAltitude, latitude);
      const coarseProfile = this.imagery.profileForAltitude(MAX_EXPLORATION_ALTITUDE_KM, latitude);
      if (entry.textureProfile === "fallback" && coarseProfile.key !== desiredProfile.key) {
        await this.upgradeEntryTexture(entry, MAX_EXPLORATION_ALTITUDE_KM, 0);
      }
      await this.upgradeEntryTexture(entry, altitudeKm, ring);
    }

    refreshTextureLOD(altitudeKm, latitude, signedLongitude) {
      const center = this.provider.tileForLocation(latitude, signedLongitude);
      for (const entry of this.meshes.values()) {
        const dx = Math.abs(shortestLongitudeDelta(center.lonWest, entry.lonWest));
        const dy = Math.abs(center.latNorth - entry.latNorth);
        const ring = Math.max(dx, dy);
        this.upgradeEntryTexture(entry, altitudeKm, ring).catch(() => {});
      }
    }

    prefetchAhead(latitude, signedLongitude, altitudeKm) {
      const address = this.provider.tileForLocation(latitude, signedLongitude);
      this.provider.load(address.lonWest, address.latNorth).catch(() => {});
      const profile = this.imagery.profileForAltitude(altitudeKm, latitude);
      const coarse = this.imagery.profileForAltitude(MAX_EXPLORATION_ALTITUDE_KM, latitude);
      this.imagery.prefetch(address.lonWest, address.latNorth, coarse);
      if (profile.key !== coarse.key) this.imagery.prefetch(address.lonWest, address.latNorth, profile);
    }

    createTileMesh(tile, segments) {
      const THREE = this.THREE;
      const verticesPerSide = segments + 1;
      const topVertexCount = verticesPerSide * verticesPerSide;
      const skirtVertexCount = verticesPerSide * 8;
      const positions = new Float32Array((topVertexCount + skirtVertexCount) * 3);
      const uvs = new Float32Array((topVertexCount + skirtVertexCount) * 2);
      const indices = [];
      let p = 0;
      let uv = 0;

      for (let iz = 0; iz <= segments; iz += 1) {
        const fz = iz / segments;
        const latitude = tile.latNorth - fz;
        for (let ix = 0; ix <= segments; ix += 1) {
          const fx = ix / segments;
          const signedLongitude = wrapLongitude(tile.lonWest + fx);
          const world = this.worldFromGeo(latitude, signedLongitude);
          const height = this.provider.sampleTile(tile, latitude, signedLongitude);
          positions[p++] = world.x;
          positions[p++] = height;
          positions[p++] = world.z;
          uvs[uv++] = fx;
          uvs[uv++] = 1 - fz;
        }
      }

      for (let z = 0; z < segments; z += 1) {
        for (let x = 0; x < segments; x += 1) {
          const a = z * verticesPerSide + x;
          const b = a + 1;
          const c = a + verticesPerSide;
          const d = c + 1;
          indices.push(a, c, b, b, c, d);
        }
      }

      const skirtDepth = 0.09;
      let skirtCursor = topVertexCount;
      const addSkirt = edge => {
        const skirtTop = [];
        const skirtBottom = [];
        for (const sourceIndex of edge) {
          const sourceP = sourceIndex * 3;
          const sourceUv = sourceIndex * 2;
          const topIndex = skirtCursor++;
          const bottomIndex = skirtCursor++;
          for (const [targetIndex, yOffset] of [[topIndex, 0], [bottomIndex, -skirtDepth]]) {
            const targetP = targetIndex * 3;
            const targetUv = targetIndex * 2;
            positions[targetP] = positions[sourceP];
            positions[targetP + 1] = positions[sourceP + 1] + yOffset;
            positions[targetP + 2] = positions[sourceP + 2];
            uvs[targetUv] = uvs[sourceUv];
            uvs[targetUv + 1] = uvs[sourceUv + 1];
          }
          skirtTop.push(topIndex);
          skirtBottom.push(bottomIndex);
        }
        for (let i = 0; i < edge.length - 1; i += 1) {
          const a = skirtTop[i];
          const b = skirtTop[i + 1];
          const sa = skirtBottom[i];
          const sb = skirtBottom[i + 1];
          indices.push(a, sa, b, b, sa, sb);
        }
      };

      const north = [];
      const south = [];
      const west = [];
      const east = [];
      for (let i = 0; i <= segments; i += 1) {
        north.push(i);
        south.push(segments * verticesPerSide + i);
        west.push(i * verticesPerSide);
        east.push(i * verticesPerSide + segments);
      }
      addSkirt(north);
      addSkirt(south);
      addSkirt(west);
      addSkirt(east);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();

      const tileTexture = this.createFallbackAlbedo(tile);
      const normalTexture = this.createMolaNormalMap(tile);
      const material = new THREE.MeshStandardMaterial({
        map: tileTexture,
        normalMap: normalTexture,
        normalMapType: THREE.ObjectSpaceNormalMap,
        roughness: 0.93,
        metalness: 0,
        color: 0xffffff,
        dithering: true
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = true;
      mesh.userData.molaTile = `${tile.lonWest},${tile.latNorth}`;
      mesh.userData.surfaceTexture = tileTexture;
      mesh.userData.normalTexture = normalTexture;
      return mesh;
    }

    disposeMesh(mesh) {
      for (const child of [...mesh.children]) {
        if (!child?.material) continue;
        if (child.material.map && child.material.map !== mesh.material?.map) child.material.map.dispose?.();
        child.material.map = null;
        child.material.normalMap = null;
        child.material.dispose?.();
        mesh.remove(child);
      }
      mesh.geometry.dispose();
      mesh.material?.map?.dispose?.();
      mesh.material?.normalMap?.dispose?.();
      mesh.material?.dispose?.();
    }

    prune(desired) {
      for (const [key, entry] of this.meshes) {
        if (desired.has(key)) continue;
        this.cancelTextureTransition(entry);
        this.group.remove(entry.mesh);
        this.disposeMesh(entry.mesh);
        this.meshes.delete(key);
      }
    }

    getHeightAtWorld(x, z) {
      const geo = this.geoFromWorld(x, z);
      return this.provider.sampleCached(geo.latitude, geo.signedLongitude);
    }

    clearMeshes() {
      this.requestGeneration += 1;
      for (const entry of this.meshes.values()) {
        this.cancelTextureTransition(entry);
        this.group.remove(entry.mesh);
        this.disposeMesh(entry.mesh);
      }
      this.meshes.clear();
      this.lastCenterTile = "";
      this.lastTextureProfile = "";
    }

    dispose() {
      this.clearMeshes();
      this.group.removeFromParent();
      this.sourcePixels = null;
      this.sourceCanvas = null;
    }
  }

  class MarsInputManager {
    constructor(controller) {
      this.controller = controller;
      this.keys = new Set();
      this.pointerActions = new Map();
      this.dragPointers = new Map();
      this.dragPointer = null;
      this.bound = false;
      this.abortController = null;
      this.pointerLockSupported = typeof document !== "undefined" && "pointerLockElement" in document;
    }

    bind() {
      if (this.bound) return;
      this.bound = true;
      this.abortController = new AbortController();
      const signal = this.abortController.signal;
      const viewport = this.controller.viewport;
      window.addEventListener("keydown", event => this.onKeyDown(event), { signal, capture: true });
      window.addEventListener("keyup", event => this.onKeyUp(event), { signal, capture: true });
      window.addEventListener("blur", () => this.clear(), { signal });
      viewport.addEventListener("pointerdown", event => this.onLookStart(event), { signal });
      viewport.addEventListener("pointermove", event => this.onLookMove(event), { signal });
      viewport.addEventListener("pointerup", event => this.onLookEnd(event), { signal });
      viewport.addEventListener("pointercancel", event => this.onLookEnd(event), { signal });
      viewport.addEventListener("contextmenu", event => event.preventDefault(), { signal });
      document.addEventListener("mousemove", event => this.onLockedMouseMove(event), { signal });
      document.addEventListener("pointerlockchange", () => this.onPointerLockChange(), { signal });

      this.controller.root.querySelectorAll("[data-mars-control]").forEach(button => {
        button.addEventListener("pointerdown", event => this.onControlStart(event, button), { signal });
        button.addEventListener("pointerup", event => this.onControlEnd(event), { signal });
        button.addEventListener("pointercancel", event => this.onControlEnd(event), { signal });
        button.addEventListener("lostpointercapture", event => this.onControlEnd(event), { signal });
        button.addEventListener("contextmenu", event => event.preventDefault(), { signal });
      });
    }

    unbind() {
      if (document.pointerLockElement === this.controller.viewport) document.exitPointerLock?.();
      this.abortController?.abort();
      this.abortController = null;
      this.bound = false;
      this.controller.root?.classList.remove("is-pointer-locked");
      this.clear();
    }

    isInteractive() {
      return this.controller.state === STATES.EXPLORING;
    }

    onKeyDown(event) {
      if (!this.controller.active) return;
      const key = event.key.toLowerCase();
      const relevant = ["w", "a", "s", "d", "q", "e", "shift", "control", "escape"].includes(key);
      if (!relevant) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (key === "escape") {
        if (event.repeat) return;
        if (document.pointerLockElement === this.controller.viewport) {
          document.exitPointerLock?.();
          this.clear();
          return;
        }
        this.controller.exit();
        return;
      }
      if (!this.isInteractive()) return;
      this.keys.add(key);
      this.controller.dismissTutorial();
    }

    onKeyUp(event) {
      if (!this.controller.active) return;
      const key = event.key.toLowerCase();
      if (!["w", "a", "s", "d", "q", "e", "shift", "control"].includes(key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.keys.delete(key);
    }

    onLookStart(event) {
      if (!this.isInteractive()) return;
      if (event.target.closest("button, a, [data-mars-ui]")) return;
      if (event.pointerType === "mouse") {
        if (event.button !== 0) return;
        this.controller.dismissTutorial();
        if (this.controller.viewport.requestPointerLock) {
          if (document.pointerLockElement !== this.controller.viewport) {
            try { this.controller.viewport.requestPointerLock(); } catch {}
          }
          return;
        }
      }
      this.dragPointer = event.pointerId;
      this.dragPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.controller.viewport.setPointerCapture?.(event.pointerId);
      this.controller.dismissTutorial();
    }

    onLookMove(event) {
      if (!this.isInteractive() || this.dragPointer !== event.pointerId) return;
      const previous = this.dragPointers.get(event.pointerId);
      if (!previous) return;
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      previous.x = event.clientX;
      previous.y = event.clientY;
      this.controller.addLookDelta(dx, dy, event.pointerType === "touch" ? "touch" : "mouse");
    }

    onLockedMouseMove(event) {
      if (!this.isInteractive() || document.pointerLockElement !== this.controller.viewport) return;
      this.controller.addLookDelta(event.movementX || 0, event.movementY || 0, "locked");
    }

    onPointerLockChange() {
      const locked = document.pointerLockElement === this.controller.viewport;
      this.controller.root.classList.toggle("is-pointer-locked", locked);
      if (!locked) this.keys.clear();
    }

    onLookEnd(event) {
      this.dragPointers.delete(event.pointerId);
      if (this.dragPointer === event.pointerId) this.dragPointer = null;
    }

    onControlStart(event, button) {
      if (!this.isInteractive()) return;
      event.preventDefault();
      event.stopPropagation();
      button.setPointerCapture?.(event.pointerId);
      this.pointerActions.set(event.pointerId, button.dataset.marsControl);
      button.classList.add("is-held");
      this.controller.dismissTutorial();
    }

    onControlEnd(event) {
      const action = this.pointerActions.get(event.pointerId);
      this.pointerActions.delete(event.pointerId);
      if (!action) return;
      const button = event.currentTarget;
      button?.classList?.remove("is-held");
    }

    actionActive(action) {
      if ([...this.pointerActions.values()].includes(action)) return true;
      if (action === "forward") return this.keys.has("w");
      if (action === "backward") return this.keys.has("s");
      if (action === "left") return this.keys.has("a");
      if (action === "right") return this.keys.has("d");
      if (action === "down") return this.keys.has("q");
      if (action === "up") return this.keys.has("e");
      return false;
    }

    boost() { return this.keys.has("shift"); }
    precision() { return this.keys.has("control"); }

    movementAxes() {
      return {
        forward: Number(this.actionActive("forward")) - Number(this.actionActive("backward")),
        strafe: Number(this.actionActive("right")) - Number(this.actionActive("left")),
        vertical: Number(this.actionActive("up")) - Number(this.actionActive("down"))
      };
    }

    clear() {
      this.keys.clear();
      this.pointerActions.clear();
      this.dragPointers.clear();
      this.dragPointer = null;
      this.controller.root?.querySelectorAll(".is-held").forEach(button => button.classList.remove("is-held"));
    }
  }

  window.MarsFullExploration = class MarsFullExploration {
    constructor(marsScene) {
      this.mars = marsScene;
      this.root = document.getElementById("mars-full-exploration");
      this.viewport = document.getElementById("mars-full-viewport");
      this.entryButton = document.getElementById("mars-full-explore-button");
      this.exitButton = document.getElementById("mars-full-exit");
      this.fullscreenButton = document.getElementById("mars-fullscreen-toggle");
      this.locationButton = document.getElementById("mars-location-toggle");
      this.locationMenu = document.getElementById("mars-location-menu");
      this.loading = document.getElementById("mars-full-loading");
      this.loadingProgress = document.getElementById("mars-full-loading-progress");
      this.loadingStatus = document.getElementById("mars-full-loading-status");
      this.errorPanel = document.getElementById("mars-full-error");
      this.errorMessage = document.getElementById("mars-full-error-message");
      this.errorReturn = document.getElementById("mars-full-error-return");
      this.tutorial = document.getElementById("mars-full-tutorial");
      this.tutorialClose = document.getElementById("mars-tutorial-close");
      this.travelVeil = document.getElementById("mars-travel-veil");
      this.travelLabel = document.getElementById("mars-travel-label");
      this.infoCard = document.getElementById("mars-landmark-card");
      this.infoName = document.getElementById("mars-landmark-name");
      this.infoType = document.getElementById("mars-landmark-type");
      this.infoCoords = document.getElementById("mars-landmark-coords");
      this.infoSource = document.getElementById("mars-landmark-source");
      this.hudCoordinates = document.getElementById("mars-hud-coordinates");
      this.hudAltitude = document.getElementById("mars-hud-altitude");
      this.hudAltitudeLimit = document.getElementById("mars-hud-altitude-limit");
      this.hudSpeed = document.getElementById("mars-hud-speed");
      this.hudLocation = document.getElementById("mars-hud-location");
      this.hudQuality = document.getElementById("mars-hud-quality");
      this.hudData = document.getElementById("mars-hud-data");

      this.state = STATES.IDLE;
      this.prepared = false;
      this.preparingPromise = null;
      this.resourceGeneration = 0;
      this.frame = null;
      this.previous = 0;
      this.elapsed = 0;
      this.streamClock = 0;
      this.statsClock = 0;
      this.statsFrames = 0;
      this.lowFpsWindows = 0;
      this.highFpsWindows = 0;
      this.lastGround = 0;
      this.cameraAltitude = 2.8;
      this.speed = 0;
      this.yaw = 0.18;
      this.pitch = -0.28;
      this.lookYawTarget = this.yaw;
      this.lookPitchTarget = this.pitch;
      this.velocity = { x: 0, y: 0, z: 0 };
      this.currentLandmark = LANDMARKS[0];
      this.transitionToken = 0;
      this.infoTimeout = null;
      this.tutorialTimeout = null;
      this.quality = this.detectQuality();
      this.input = new MarsInputManager(this);
      this.tick = this.tick.bind(this);

      this.root.inert = true;
      this.buildLocationMenu();
      this.bindUI();
    }

    get active() {
      return this.state !== STATES.IDLE;
    }

    detectQuality() {
      const width = window.innerWidth;
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 4;
      const coarse = window.matchMedia("(pointer: coarse)").matches;

      // Do not classify a strong high-DPI desktop as LOW simply because DPR makes
      // its theoretical pixel count large. Quality selection is capability based;
      // the render-pixel budget below controls the actual resolution separately.
      if (coarse || width <= 760 || cores <= 4 || memory <= 3) {
        return { name: "LOW", radius: 1, nearSegments: 72, midSegments: 40, farSegments: 22, maxDpr: 1.35, minDpr: 0.9, supersample: 1, pixelBudget: 2500000, anisotropy: 4, imageryMaxZ: 6, themisMaxZ: 8, textureSize: 256 };
      }
      if (cores >= 8 && memory >= 6) {
        return { name: "HIGH", radius: 3, nearSegments: 128, midSegments: 96, farSegments: 48, maxDpr: 2, minDpr: 1, supersample: 1.24, pixelBudget: 8400000, anisotropy: 16, imageryMaxZ: 7, themisMaxZ: 9, textureSize: 640 };
      }
      return { name: "MEDIUM", radius: 2, nearSegments: 112, midSegments: 64, farSegments: 32, maxDpr: 1.8, minDpr: 0.94, supersample: 1.12, pixelBudget: 5000000, anisotropy: 8, imageryMaxZ: 7, themisMaxZ: 8, textureSize: 384 };
    }

    calculateIdealDpr() {
      const width = Math.max(1, this.viewport?.clientWidth || window.innerWidth);
      const height = Math.max(1, this.viewport?.clientHeight || window.innerHeight);
      const cssPixels = width * height;
      const deviceDpr = window.devicePixelRatio || 1;
      const requested = Math.max(deviceDpr, this.quality.supersample || 1);
      const budgetDpr = Math.sqrt(this.quality.pixelBudget / cssPixels);
      return clamp(Math.min(requested, this.quality.maxDpr, budgetDpr), this.quality.minDpr, this.quality.maxDpr);
    }

    bindUI() {
      this.entryButton.addEventListener("click", () => this.enter());
      this.exitButton.addEventListener("click", () => this.exit());
      this.errorReturn.addEventListener("click", () => this.failBackToOrbit());
      this.tutorialClose.addEventListener("click", () => this.dismissTutorial(true));
      this.locationButton.addEventListener("click", event => {
        event.stopPropagation();
        const open = !this.locationMenu.classList.contains("is-open");
        this.locationMenu.classList.toggle("is-open", open);
        this.locationButton.setAttribute("aria-expanded", String(open));
      });
      this.locationMenu.addEventListener("click", event => {
        const button = event.target.closest("[data-landmark]");
        if (!button) return;
        this.locationMenu.classList.remove("is-open");
        this.locationButton.setAttribute("aria-expanded", "false");
        const landmark = LANDMARKS.find(item => item.id === button.dataset.landmark);
        if (landmark) this.travelToLandmark(landmark);
      });
      this.fullscreenButton.addEventListener("click", () => this.toggleFullscreen());
      document.addEventListener("fullscreenchange", () => this.updateFullscreenLabel());
      document.addEventListener("visibilitychange", () => {
        if (!this.active) return;
        if (document.hidden) this.stopLoop();
        else this.startLoop();
      });
      window.addEventListener("resize", () => {
        if (this.prepared) this.resize();
      });
      window.addEventListener("orientationchange", () => {
        if (this.prepared) window.setTimeout(() => this.resize(), 120);
      });
      document.addEventListener("pointerdown", event => {
        if (!this.active || !this.locationMenu.classList.contains("is-open")) return;
        if (event.target.closest("#mars-location-menu, #mars-location-toggle")) return;
        this.locationMenu.classList.remove("is-open");
        this.locationButton.setAttribute("aria-expanded", "false");
      });
    }

    buildLocationMenu() {
      const fragment = document.createDocumentFragment();
      LANDMARKS.forEach(landmark => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("role", "menuitem");
        button.dataset.landmark = landmark.id;
        button.innerHTML = `<span>${landmark.name}</span><small>${formatCoordinate(landmark.latitude, landmark.longitudeEast)}</small>`;
        fragment.append(button);
      });
      this.locationMenu.replaceChildren(fragment);
    }

    async enter() {
      if (this.active || !this.mars.active) return;
      if (this.mars.exploring) this.mars.exitExploration();
      this.state = STATES.PREPARING;
      this.transitionToken += 1;
      const token = this.transitionToken;
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.root.classList.add("is-preparing");
      this.root.classList.remove("is-error", "is-surface-visible", "is-active", "is-exiting");
      this.loading.hidden = false;
      this.errorPanel.hidden = true;
      this.setLoading(0.04, "MENGHUBUNGKAN DATA TOPOGRAFI MOLA");
      this.entryButton.disabled = true;
      this.mars.caption.inert = true;
      document.getElementById("mission").classList.add("is-mars-full");
      document.getElementById("announcement").textContent = "Menyiapkan Eksplorasi Pengalaman Penuh Mars.";

      try {
        await this.prepare();
        if (token !== this.transitionToken || this.state !== STATES.PREPARING) {
          if (this.state === STATES.IDLE) this.disposeSurface();
          return;
        }
        const landmark = this.currentLandmark || LANDMARKS[0];
        this.terrain.setOrigin(landmark.latitude, landmark.longitudeEast);
        this.setLoading(0.18, `MEMUAT PERMUKAAN ${landmark.name.toUpperCase()}`);
        await this.terrain.ensureAround(landmark.latitude, wrapLongitude(landmark.longitudeEast > 180 ? landmark.longitudeEast - 360 : landmark.longitudeEast), {
          requiredRadius: 1,
          textureAltitude: 2.8,
          onProgress: progress => this.setLoading(0.18 + progress * 0.72, "MEMUAT TOPOGRAFI + IMAGERY HD")
        });
        if (token !== this.transitionToken || this.state !== STATES.PREPARING) return;
        this.setCameraAtLandmark(landmark, { altitude: 58 });
        this.setLoading(1, "PERMUKAAN SIAP");
        await this.wait(180);
        if (token !== this.transitionToken) return;
        await this.runEntryTransition(token);
      } catch (error) {
        if (token !== this.transitionToken) return;
        this.showError(error);
      }
    }

    async prepare() {
      if (this.prepared) return;
      if (this.preparingPromise) return this.preparingPromise;
      const generation = this.resourceGeneration;
      const promise = (async () => {
        await this.mars.prepare();
        if (generation !== this.resourceGeneration) throw new Error("Mars exploration preparation cancelled.");
        const THREE = this.mars.THREE;
        if (!THREE || !this.mars.surface) throw new Error("WebGL surface renderer tidak tersedia pada perangkat ini.");
        this.THREE = THREE;

        const canvas = document.createElement("canvas");
        canvas.className = "mars-full-canvas";
        canvas.setAttribute("aria-hidden", "true");
        const context = canvas.getContext("webgl2", {
          alpha: true,
          antialias: this.quality.name !== "LOW",
          powerPreference: "high-performance"
        });
        if (!context) throw new Error("WebGL2 diperlukan untuk terrain Mars 3D.");

        this.renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: this.quality.name !== "LOW" });
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.02;
        this.quality.anisotropy = Math.min(this.quality.anisotropy, this.renderer.capabilities.getMaxAnisotropy());
        this.idealDpr = this.calculateIdealDpr();
        this.currentDpr = this.idealDpr;
        this.renderer.setPixelRatio(this.currentDpr);
        this.renderer.setClearColor(0xb76f52, 0);
        this.viewport.replaceChildren(canvas);

        this.scene = new THREE.Scene();
        const fogDensity = this.quality.name === "LOW" ? 0.0018 : this.quality.name === "MEDIUM" ? 0.00125 : 0.0009;
        this.scene.fog = new THREE.FogExp2(0xa55f45, fogDensity);
        this.camera = new THREE.PerspectiveCamera(this.mobileFov(), 1, 0.035, 850);
        this.camera.rotation.order = "YXZ";

        const sun = new THREE.DirectionalLight(0xffd5af, 3.2);
        sun.position.set(-70, 95, 45);
        this.scene.add(sun);
        const hemi = new THREE.HemisphereLight(0xe2a27a, 0x401b15, 0.40);
        this.scene.add(hemi);
        const fill = new THREE.DirectionalLight(0x8b6a65, 0.12);
        fill.position.set(40, 18, -55);
        this.scene.add(fill);

        this.moveForward = new THREE.Vector3();
        this.moveRight = new THREE.Vector3();
        this.moveUp = new THREE.Vector3(0, 1, 0);
        this.moveIntent = new THREE.Vector3();

        this.provider = new MolaTileProvider();
        this.provider.maxCache = this.quality.name === "HIGH" ? 112 : this.quality.name === "MEDIUM" ? 84 : 52;
        this.imagery = new MarsImageryProvider(this.quality);
        this.terrain = new TerrainManager(THREE, this.scene, this.provider, this.imagery, this.mars.surface, this.quality);
        this.hudQuality.textContent = this.quality.name;
        this.hudData.textContent = this.imagery.sourceLabel;
        this.resize();
        if (generation !== this.resourceGeneration) {
          this.renderer.dispose();
          this.renderer.domElement?.remove();
          this.renderer = null;
          this.terrain?.dispose();
          this.terrain = null;
          this.provider?.clear();
          this.provider = null;
          this.imagery?.clear();
          this.imagery = null;
          throw new Error("Mars exploration preparation cancelled.");
        }
        this.prepared = true;
      })();
      this.preparingPromise = promise;
      try {
        await promise;
      } finally {
        if (this.preparingPromise === promise) this.preparingPromise = null;
      }
    }

    addLookDelta(dx, dy, source = "mouse") {
      const sensitivity = source === "touch" ? 0.0034 : source === "locked" ? 0.00175 : 0.0022;
      this.lookYawTarget -= dx * sensitivity;
      this.lookPitchTarget = clamp(this.lookPitchTarget - dy * sensitivity, -1.40, 1.20);
    }

    syncLookTargets() {
      this.lookYawTarget = this.yaw;
      this.lookPitchTarget = this.pitch;
    }

    updateLook(delta) {
      const response = 1 - Math.exp(-delta * 27);
      this.yaw += (this.lookYawTarget - this.yaw) * response;
      this.pitch += (this.lookPitchTarget - this.pitch) * response;
      this.pitch = clamp(this.pitch, -1.40, 1.20);
    }

    mobileFov() {
      return window.innerWidth <= 760 ? 70 : 66;
    }

    setLoading(progress, status) {
      const percent = clamp(progress, 0, 1);
      this.loadingProgress.style.transform = `scaleX(${percent})`;
      this.loadingStatus.textContent = status;
    }

    showError(error) {
      console.warn("Mars Full Exploration:", error);
      this.stopLoop();
      this.input.unbind();
      this.state = STATES.ERROR;
      this.loading.hidden = true;
      this.errorPanel.hidden = false;
      this.errorMessage.textContent = /MOLA|tile|terrain/i.test(error.message)
        ? "Data elevasi MOLA tidak dapat dimuat. Mode orbit Mars tetap aman. Periksa koneksi internet atau host tile MOLA secara lokal."
        : error.message;
      this.root.classList.add("is-error");
      this.root.classList.remove("is-preparing", "is-active", "is-surface-visible");
      this.entryButton.disabled = false;
      document.getElementById("announcement").textContent = "Eksplorasi permukaan Mars belum dapat dimuat. Panorama Mars tetap tersedia.";
    }

    failBackToOrbit() {
      this.transitionToken += 1;
      this.state = STATES.IDLE;
      this.stopLoop();
      this.input.unbind();
      this.root.className = "mars-full-exploration";
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.errorPanel.hidden = true;
      const pendingPreparation = this.preparingPromise;
      this.disposeSurface();
      this.entryButton.disabled = Boolean(pendingPreparation);
      if (pendingPreparation) {
        pendingPreparation.then(() => {}, () => {}).finally(() => {
          if (this.state === STATES.IDLE) this.entryButton.disabled = false;
        });
      }
      this.mars.setFullExplorationTransition?.(0, this.currentLandmark);
      this.mars.caption.inert = false;
      document.getElementById("mission").classList.remove("is-mars-full");
      if (!this.entryButton.disabled) this.entryButton.focus({ preventScroll: true });
    }

    async runEntryTransition(token) {
      this.state = STATES.ENTERING;
      this.root.classList.remove("is-preparing");
      this.root.classList.add("is-entering");
      this.loading.hidden = true;
      this.input.bind();
      this.startLoop();
      const reduced = this.mars.motion.matches;
      const duration = reduced ? 400 : 4700;
      const start = performance.now();
      const startAltitude = Math.max(46, this.cameraAltitude);
      const targetAltitude = 2.8;

      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken || this.state !== STATES.ENTERING) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smootherstep(raw);
          this.mars.setFullExplorationTransition?.(eased, this.currentLandmark);
          this.root.style.setProperty("--surface-opacity", String(smoothstep((raw - 0.48) / 0.40)));
          this.root.style.setProperty("--entry-progress", String(eased));
          this.cameraAltitude = lerp(startAltitude, targetAltitude, smoothstep((raw - 0.46) / 0.54));
          const ground = this.terrain.getHeightAtWorld(this.camera.position.x, this.camera.position.z);
          if (ground !== null) {
            this.lastGround = ground;
            this.camera.position.y = ground + this.cameraAltitude;
          }
          if (raw < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });

      if (token !== this.transitionToken || this.state !== STATES.ENTERING) return;
      this.state = STATES.EXPLORING;
      this.root.classList.remove("is-entering");
      this.root.classList.add("is-active", "is-surface-visible");
      this.root.style.setProperty("--surface-opacity", "1");
      this.root.style.setProperty("--entry-progress", "1");
      this.velocity.x = this.velocity.y = this.velocity.z = 0;
      this.showTutorial();
      this.showLandmarkInfo(this.currentLandmark);
      document.getElementById("announcement").textContent = `Eksplorasi penuh Mars aktif di ${this.currentLandmark.name}. Gunakan WASD atau kontrol layar untuk bergerak.`;
    }

    setCameraAtLandmark(landmark, { altitude = 2.8 } = {}) {
      this.currentLandmark = landmark;
      this.yaw = landmark.heading || 0;
      this.pitch = -0.28;
      this.syncLookTargets();
      this.camera.position.x = 0;
      this.camera.position.z = 0;
      const ground = this.terrain.getHeightAtWorld(0, 0) ?? 0;
      this.lastGround = ground;
      this.cameraAltitude = altitude;
      this.camera.position.y = ground + altitude;
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      this.updateHUD();
    }

    startLoop() {
      if (!this.active || document.hidden || this.frame) return;
      this.previous = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }

    stopLoop() {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }

    tick(now) {
      this.frame = null;
      if (!this.active || document.hidden || !this.prepared) return;
      const delta = Math.min((now - this.previous) / 1000, 0.1);
      this.previous = now;
      this.elapsed += delta;
      this.statsClock += delta;
      this.statsFrames += 1;

      if (this.state === STATES.EXPLORING) this.updateLook(delta);
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      if (this.state === STATES.EXPLORING) this.updateMovement(delta);
      this.renderer.render(this.scene, this.camera);
      this.updateHUD();
      this.adaptResolution();
      this.frame = requestAnimationFrame(this.tick);
    }

    updateMovement(delta) {
      const axes = this.input.movementAxes();
      const ground = this.terrain.getHeightAtWorld(this.camera.position.x, this.camera.position.z);
      if (ground !== null) this.lastGround = ground;
      const clearance = Math.max(0, this.camera.position.y - this.lastGround);
      const baseSpeed = clearance < 0.25 ? 0.14
        : clearance < 1 ? lerp(0.14, 0.82, (clearance - 0.25) / 0.75)
          : clearance < 8 ? lerp(0.82, 4.2, (clearance - 1) / 7)
            : clearance < 40 ? lerp(4.2, 14.5, (clearance - 8) / 32)
              : 24;
      const boost = this.input.boost() ? 3 : 1;
      const precision = this.input.precision() ? 0.28 : 1;
      const targetSpeed = baseSpeed * boost * precision;

      let forward = axes.forward;
      let strafe = axes.strafe;
      const horizontalMagnitude = Math.hypot(forward, strafe);
      if (horizontalMagnitude > 1) {
        forward /= horizontalMagnitude;
        strafe /= horizontalMagnitude;
      }

      // Ask Three.js for the actual camera direction. The previous hand-written
      // sin/cos formula had the X/Z signs opposite to the camera's positive yaw,
      // so W/A/S/D could slide across the world in a direction that did not match
      // where the user was looking. This keeps movement truly camera-relative.
      this.camera.getWorldDirection(this.moveForward);
      this.moveRight.crossVectors(this.moveForward, this.camera.up).normalize();
      this.moveIntent.set(0, 0, 0);
      this.moveIntent.addScaledVector(this.moveForward, forward);
      this.moveIntent.addScaledVector(this.moveRight, strafe);

      if (horizontalMagnitude > 1) this.moveIntent.normalize();
      const targetX = this.moveIntent.x * targetSpeed;
      const targetZ = this.moveIntent.z * targetSpeed;
      const verticalSpeed = Math.max(0.22, Math.min(8, targetSpeed * 0.58));
      const headroom = Math.max(0, MAX_EXPLORATION_ALTITUDE_KM - clearance);
      const ascentFactor = smoothstep(headroom / 1.6);
      const rawTargetY = this.moveIntent.y * targetSpeed + axes.vertical * verticalSpeed;
      const targetY = rawTargetY > 0 ? rawTargetY * ascentFactor : rawTargetY;
      const moving = horizontalMagnitude > 0 || axes.vertical !== 0;
      const responseRate = moving ? 11.5 : 15.5;
      const response = 1 - Math.exp(-delta * responseRate);
      this.velocity.x += (targetX - this.velocity.x) * response;
      this.velocity.z += (targetZ - this.velocity.z) * response;
      this.velocity.y += (targetY - this.velocity.y) * response;

      const nextX = this.camera.position.x + this.velocity.x * delta;
      const nextZ = this.camera.position.z + this.velocity.z * delta;
      const nextGeo = this.terrain.geoFromWorld(nextX, nextZ);
      if (nextGeo.latitude > MIN_DATA_LAT && nextGeo.latitude < MAX_DATA_LAT) {
        this.camera.position.x = nextX;
        this.camera.position.z = nextZ;
      }
      this.camera.position.y += this.velocity.y * delta;

      const newGround = this.terrain.getHeightAtWorld(this.camera.position.x, this.camera.position.z);
      if (newGround !== null) this.lastGround = newGround;
      const safeClearance = clearance < 2 ? 0.11 : 0.16;
      const minimumY = this.lastGround + safeClearance;
      if (this.camera.position.y < minimumY) {
        const correction = 1 - Math.exp(-delta * 17);
        this.camera.position.y = lerp(this.camera.position.y, minimumY + 0.025, correction);
        if (this.camera.position.y < minimumY) this.camera.position.y = minimumY;
        if (this.velocity.y < 0) this.velocity.y *= 0.12;
      }
      const maximumY = this.lastGround + MAX_EXPLORATION_ALTITUDE_KM;
      if (this.camera.position.y >= maximumY) {
        this.camera.position.y = maximumY;
        if (this.velocity.y > 0) this.velocity.y = 0;
      }

      this.speed = Math.hypot(this.velocity.x, this.velocity.y, this.velocity.z);
      this.streamClock += delta;
      if (this.streamClock > 0.36) {
        this.streamClock = 0;
        const geo = this.terrain.geoFromWorld(this.camera.position.x, this.camera.position.z);
        const altitude = clamp(this.camera.position.y - this.lastGround, 0, MAX_EXPLORATION_ALTITUDE_KM);
        this.terrain.maybeStream(geo.latitude, geo.signedLongitude, altitude);
        const lookAheadSeconds = clamp(1.4 + this.speed * 0.08, 1.4, 4.5);
        const aheadGeo = this.terrain.geoFromWorld(
          this.camera.position.x + this.velocity.x * lookAheadSeconds,
          this.camera.position.z + this.velocity.z * lookAheadSeconds
        );
        this.terrain.prefetchAhead(aheadGeo.latitude, aheadGeo.signedLongitude, altitude);
      }
    }

    adaptResolution() {
      if (this.statsClock < 2.5 || !this.renderer) return;
      const fps = this.statsFrames / this.statsClock;
      this.statsFrames = 0;
      this.statsClock = 0;
      this.idealDpr = this.calculateIdealDpr();

      if (fps < 38) {
        this.lowFpsWindows += 1;
        this.highFpsWindows = 0;
      } else if (fps > 56) {
        this.highFpsWindows += 1;
        this.lowFpsWindows = Math.max(0, this.lowFpsWindows - 1);
      } else {
        this.lowFpsWindows = Math.max(0, this.lowFpsWindows - 1);
        this.highFpsWindows = 0;
      }

      if (this.lowFpsWindows >= 2 && this.currentDpr > this.quality.minDpr) {
        this.currentDpr = Math.max(this.quality.minDpr, this.currentDpr - 0.12);
        this.renderer.setPixelRatio(this.currentDpr);
        this.resize(false);
        this.lowFpsWindows = 0;
      } else if (this.highFpsWindows >= 3 && this.currentDpr + 0.04 < this.idealDpr) {
        this.currentDpr = Math.min(this.idealDpr, this.currentDpr + 0.10);
        this.renderer.setPixelRatio(this.currentDpr);
        this.resize(false);
        this.highFpsWindows = 0;
      }
    }

    updateHUD() {
      if (!this.prepared || !this.camera) return;
      const geo = this.terrain.geoFromWorld(this.camera.position.x, this.camera.position.z);
      const ground = this.terrain.getHeightAtWorld(this.camera.position.x, this.camera.position.z);
      if (ground !== null) this.lastGround = ground;
      const altitude = Math.max(0, this.camera.position.y - this.lastGround);
      this.cameraAltitude = altitude;
      this.hudCoordinates.textContent = formatCoordinate(geo.latitude, geo.longitudeEast);
      const ceilingActive = this.state === STATES.EXPLORING || this.state === STATES.TRAVELLING;
      const displayAltitude = ceilingActive ? Math.min(altitude, MAX_EXPLORATION_ALTITUDE_KM) : altitude;
      this.hudAltitude.textContent = formatAltitude(displayAltitude);
      this.hudAltitudeLimit.hidden = !ceilingActive || altitude < ALTITUDE_LIMIT_WARNING_KM;
      this.hudAltitudeLimit.textContent = altitude >= MAX_EXPLORATION_ALTITUDE_KM - 0.02 ? "BATAS KETINGGIAN" : "MENDEKATI BATAS 30 KM";
      this.hudSpeed.textContent = formatSpeed(this.speed);
      this.hudLocation.textContent = this.nearestLocation(geo.latitude, geo.signedLongitude);
    }

    nearestLocation(latitude, signedLongitude) {
      let best = null;
      let bestDistance = Infinity;
      for (const landmark of LANDMARKS) {
        const landmarkLon = wrapLongitude(landmark.longitudeEast > 180 ? landmark.longitudeEast - 360 : landmark.longitudeEast);
        const dLat = (latitude - landmark.latitude) * KM_PER_DEG_LAT;
        const dLon = shortestLongitudeDelta(landmarkLon, signedLongitude) * KM_PER_DEG_LAT * Math.cos(latitude * DEG);
        const distance = Math.hypot(dLat, dLon);
        if (distance < bestDistance) { best = landmark; bestDistance = distance; }
      }
      return best && bestDistance < 180 ? best.name : "Permukaan Mars";
    }

    async travelToLandmark(landmark) {
      if (this.state !== STATES.EXPLORING || !landmark || landmark.id === this.currentLandmark?.id) return;
      this.state = STATES.TRAVELLING;
      this.input.clear();
      const token = ++this.transitionToken;
      this.travelLabel.textContent = `NAVIGASI · ${landmark.name.toUpperCase()}`;
      this.travelVeil.classList.add("is-visible");
      this.infoCard.classList.remove("is-visible");
      document.getElementById("announcement").textContent = `Terbang menuju ${landmark.name}.`;

      try {
        const cruiseAltitude = Math.min(MAX_EXPLORATION_ALTITUDE_KM - 2, Math.max(this.cameraAltitude, 24));
        await this.animateCameraAltitude(cruiseAltitude, 1350, token);
        if (token !== this.transitionToken || this.state !== STATES.TRAVELLING) return;
        this.travelVeil.classList.add("is-covered");
        await this.wait(360);
        if (token !== this.transitionToken) return;

        this.terrain.clearMeshes();
        this.terrain.setOrigin(landmark.latitude, landmark.longitudeEast);
        this.currentLandmark = landmark;
        this.yaw = landmark.heading || 0;
        this.pitch = -0.34;
        this.syncLookTargets();
        await this.terrain.ensureAround(landmark.latitude, wrapLongitude(landmark.longitudeEast > 180 ? landmark.longitudeEast - 360 : landmark.longitudeEast), { requiredRadius: 1, textureAltitude: 3.2 });
        if (token !== this.transitionToken) return;
        const ground = this.terrain.getHeightAtWorld(0, 0) ?? 0;
        this.lastGround = ground;
        this.camera.position.set(0, ground + cruiseAltitude, 0);
        this.travelVeil.classList.remove("is-covered");
        await this.animateCameraAltitude(3.2, 1850, token);
        if (token !== this.transitionToken) return;
        this.state = STATES.EXPLORING;
        this.travelVeil.classList.remove("is-visible");
        this.showLandmarkInfo(landmark);
        document.getElementById("announcement").textContent = `Tiba di ${landmark.name}. Eksplorasi bebas dilanjutkan.`;
      } catch (error) {
        console.warn("Mars landmark travel failed", error);
        this.state = STATES.EXPLORING;
        this.travelVeil.classList.remove("is-visible", "is-covered");
      }
    }

    animateCameraAltitude(targetAltitude, duration, token) {
      const ceilingApplies = this.state === STATES.EXPLORING || this.state === STATES.TRAVELLING;
      if (ceilingApplies) targetAltitude = Math.min(targetAltitude, MAX_EXPLORATION_ALTITUDE_KM);
      const startAltitude = this.cameraAltitude;
      const start = performance.now();
      return new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken) return resolve();
          const raw = clamp((now - start) / (this.mars.motion.matches ? 120 : duration), 0, 1);
          const eased = smootherstep(raw);
          const ground = this.terrain.getHeightAtWorld(this.camera.position.x, this.camera.position.z) ?? this.lastGround;
          this.lastGround = ground;
          this.cameraAltitude = lerp(startAltitude, targetAltitude, eased);
          this.camera.position.y = ground + this.cameraAltitude;
          if (raw < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
    }

    showLandmarkInfo(landmark) {
      window.clearTimeout(this.infoTimeout);
      this.infoName.textContent = landmark.name;
      this.infoType.textContent = landmark.type;
      this.infoCoords.textContent = formatCoordinate(landmark.latitude, landmark.longitudeEast);
      this.infoSource.href = landmark.source;
      this.infoCard.classList.add("is-visible");
      this.infoTimeout = window.setTimeout(() => this.infoCard.classList.remove("is-visible"), 8500);
    }

    showTutorial() {
      let seen = false;
      try { seen = sessionStorage.getItem("antara-mars-full-tutorial") === "1"; } catch {}
      if (seen) return;
      this.tutorial.classList.add("is-visible");
      window.clearTimeout(this.tutorialTimeout);
      this.tutorialTimeout = window.setTimeout(() => this.dismissTutorial(), 9000);
    }

    dismissTutorial(persist = false) {
      if (!this.tutorial.classList.contains("is-visible")) return;
      this.tutorial.classList.remove("is-visible");
      window.clearTimeout(this.tutorialTimeout);
      if (persist) {
        try { sessionStorage.setItem("antara-mars-full-tutorial", "1"); } catch {}
      }
    }

    async exit() {
      if (!this.active || this.state === STATES.EXITING) return;
      if (this.state === STATES.ERROR || this.state === STATES.PREPARING) {
        this.failBackToOrbit();
        return;
      }
      this.state = STATES.EXITING;
      const token = ++this.transitionToken;
      this.input.clear();
      this.locationMenu.classList.remove("is-open");
      this.locationButton.setAttribute("aria-expanded", "false");
      this.tutorial.classList.remove("is-visible");
      this.infoCard.classList.remove("is-visible");
      this.travelVeil.classList.remove("is-visible", "is-covered");
      this.root.classList.add("is-exiting");
      document.getElementById("announcement").textContent = "Meninggalkan permukaan Mars dan kembali ke panorama orbit.";

      if (this.prepared && this.camera) {
        try { await this.animateCameraAltitude(Math.max(this.cameraAltitude, 52), 1650, token); }
        catch {}
      }
      if (token !== this.transitionToken) return;

      const reduced = this.mars.motion.matches;
      const duration = reduced ? 260 : 3200;
      const start = performance.now();
      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smootherstep(raw);
          this.root.style.setProperty("--surface-opacity", String(1 - smoothstep(raw / 0.62)));
          this.mars.setFullExplorationTransition?.(1 - eased, this.currentLandmark);
          if (raw < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      if (token !== this.transitionToken) return;
      this.finishExit();
    }

    finishExit() {
      if (document.fullscreenElement === this.root) document.exitFullscreen().catch(() => {});
      this.state = STATES.IDLE;
      this.stopLoop();
      this.input.unbind();
      this.root.className = "mars-full-exploration";
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.style.removeProperty("--surface-opacity");
      this.root.style.removeProperty("--entry-progress");
      this.entryButton.disabled = false;
      this.mars.setFullExplorationTransition?.(0, this.currentLandmark);
      this.mars.caption.inert = false;
      document.getElementById("mission").classList.remove("is-mars-full");
      document.getElementById("announcement").textContent = "Kembali ke panorama Mars.";
      this.entryButton.focus({ preventScroll: true });
    }

    onMarsStop() {
      if (this.active) {
        this.transitionToken += 1;
        this.state = STATES.IDLE;
        this.stopLoop();
        this.input.unbind();
        this.root.hidden = true;
        this.root.inert = true;
        this.root.setAttribute("aria-hidden", "true");
        this.root.className = "mars-full-exploration";
        this.entryButton.disabled = false;
        document.getElementById("mission").classList.remove("is-mars-full");
      }
      this.disposeSurface();
      if (document.fullscreenElement === this.root) document.exitFullscreen().catch(() => {});
    }

    disposeSurface() {
      this.resourceGeneration += 1;
      this.stopLoop();
      this.input.unbind();
      if (this.terrain) {
        this.terrain.dispose();
        this.terrain = null;
      }
      this.provider?.clear();
      this.provider = null;
      this.imagery?.clear();
      this.imagery = null;
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.domElement?.remove();
        this.renderer = null;
      }
      this.scene = null;
      this.camera = null;
      this.prepared = false;
    }

    async toggleFullscreen() {
      if (!document.fullscreenElement) {
        try { await this.root.requestFullscreen(); } catch {}
      } else if (document.fullscreenElement === this.root) {
        try { await document.exitFullscreen(); } catch {}
      }
      this.updateFullscreenLabel();
    }

    updateFullscreenLabel() {
      const active = document.fullscreenElement === this.root;
      this.fullscreenButton.setAttribute("aria-pressed", String(active));
      this.fullscreenButton.querySelector("span").textContent = active ? "Keluar layar penuh" : "Layar penuh";
      if (this.prepared) this.resize();
    }

    resize(recalculateDpr = true) {
      if (!this.prepared || !this.renderer || !this.camera) return;
      const width = Math.max(1, this.viewport.clientWidth);
      const height = Math.max(1, this.viewport.clientHeight);
      if (recalculateDpr) {
        this.idealDpr = this.calculateIdealDpr();
        if (!Number.isFinite(this.currentDpr)) this.currentDpr = this.idealDpr;
        if (this.currentDpr > this.idealDpr) this.currentDpr = this.idealDpr;
        this.renderer.setPixelRatio(this.currentDpr);
      }
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.fov = this.mobileFov();
      this.camera.updateProjectionMatrix();
    }

    wait(ms) {
      return new Promise(resolve => window.setTimeout(resolve, ms));
    }
  };
})();
