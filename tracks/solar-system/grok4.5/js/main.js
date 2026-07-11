import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const PLANETS = [
  {
    id: "sun",
    name: "太阳",
    nameEn: "Sun",
    color: 0xffcc33,
    emissive: 0xff8800,
    radius: 6.5,
    distance: 0,
    period: 0,
    inclination: 0,
    tilt: 7.25,
    isStar: true,
    facts: {
      直径: "139.2 万 km",
      质量: "1.989×10³⁰ kg",
      表面温度: "约 5500 °C",
      类型: "G2V 黄矮星",
    },
    desc: "太阳系的中心天体，以核聚变提供光与热，引力束缚所有行星绕其公转。",
  },
  {
    id: "mercury",
    name: "水星",
    nameEn: "Mercury",
    color: 0xb5b5b5,
    radius: 0.55,
    distance: 12,
    period: 0.24,
    inclination: 7.0,
    tilt: 0.03,
    facts: {
      轨道半径: "0.39 AU",
      公转周期: "88 天",
      直径: "4879 km",
      卫星: "无",
    },
    desc: "最靠近太阳的行星，表面布满陨石坑，昼夜温差极大。",
  },
  {
    id: "venus",
    name: "金星",
    nameEn: "Venus",
    color: 0xe8c07a,
    radius: 0.95,
    distance: 16.5,
    period: 0.62,
    inclination: 3.4,
    tilt: 177.4,
    facts: {
      轨道半径: "0.72 AU",
      公转周期: "225 天",
      直径: "12104 km",
      大气: "厚重 CO₂",
    },
    desc: "夜空中最亮的行星，逆向自转，表面被浓密温室大气笼罩。",
  },
  {
    id: "earth",
    name: "地球",
    nameEn: "Earth",
    color: 0x3a7bd5,
    radius: 1.0,
    distance: 22,
    period: 1.0,
    inclination: 0.0,
    tilt: 23.4,
    hasMoon: true,
    facts: {
      轨道半径: "1.00 AU",
      公转周期: "365.25 天",
      直径: "12742 km",
      卫星: "月球",
    },
    desc: "目前已知唯一孕育生命的行星，拥有液态水与适宜大气。",
  },
  {
    id: "mars",
    name: "火星",
    nameEn: "Mars",
    color: 0xc1440e,
    radius: 0.7,
    distance: 28,
    period: 1.88,
    inclination: 1.9,
    tilt: 25.2,
    facts: {
      轨道半径: "1.52 AU",
      公转周期: "687 天",
      直径: "6779 km",
      卫星: "火卫一、火卫二",
    },
    desc: "红色沙漠星球，有巨大火山与峡谷，是人类探测的重点目标。",
  },
  {
    id: "jupiter",
    name: "木星",
    nameEn: "Jupiter",
    color: 0xd4a574,
    radius: 3.2,
    distance: 40,
    period: 11.86,
    inclination: 1.3,
    tilt: 3.1,
    banded: true,
    facts: {
      轨道半径: "5.20 AU",
      公转周期: "11.9 年",
      直径: "139820 km",
      特征: "大红斑",
    },
    desc: "太阳系最大行星，气态巨行星，拥有强大磁场与众多卫星。",
  },
  {
    id: "saturn",
    name: "土星",
    nameEn: "Saturn",
    color: 0xe6c98a,
    radius: 2.7,
    distance: 54,
    period: 29.46,
    inclination: 2.5,
    tilt: 26.7,
    hasRings: true,
    facts: {
      轨道半径: "9.58 AU",
      公转周期: "29.5 年",
      直径: "116460 km",
      特征: "壮丽光环",
    },
    desc: "以光环闻名的气态巨行星，密度低于水，可“浮”在想象中的巨湖上。",
  },
  {
    id: "uranus",
    name: "天王星",
    nameEn: "Uranus",
    color: 0x7de0e6,
    radius: 1.7,
    distance: 68,
    period: 84.01,
    inclination: 0.8,
    tilt: 97.8,
    facts: {
      轨道半径: "19.2 AU",
      公转周期: "84 年",
      直径: "50724 km",
      特征: "侧躺自转",
    },
    desc: "冰巨星，自转轴几乎躺平，远看呈淡青蓝色。",
  },
  {
    id: "neptune",
    name: "海王星",
    nameEn: "Neptune",
    color: 0x4169e1,
    radius: 1.65,
    distance: 80,
    period: 164.8,
    inclination: 1.8,
    tilt: 28.3,
    facts: {
      轨道半径: "30.1 AU",
      公转周期: "165 年",
      直径: "49244 km",
      特征: "强风",
    },
    desc: "最远的经典行星，深蓝色冰巨星，拥有太阳系最强的行星风暴。",
  },
  {
    id: "pluto",
    name: "冥王星",
    nameEn: "Pluto",
    color: 0xc9b8a0,
    radius: 0.4,
    distance: 92,
    period: 248.0,
    inclination: 17.2,
    tilt: 122.5,
    dwarf: true,
    facts: {
      轨道半径: "39.5 AU",
      公转周期: "248 年",
      直径: "2376 km",
      地位: "矮行星",
    },
    desc: "曾为第九大行星，现为矮行星；轨道倾角较大，与开伦同属柯伊伯带。",
  },
];

const canvas = document.getElementById("scene");
const statusText = document.getElementById("status-text");
const tooltip = document.getElementById("tooltip");
const speedInput = document.getElementById("speed");
const timeScaleInput = document.getElementById("time-scale");
const speedVal = document.getElementById("speed-val");
const timeVal = document.getElementById("time-val");
const planetListEl = document.getElementById("planet-list");
const legendEl = document.getElementById("legend");
const infoEmpty = document.getElementById("info-empty");
const infoCard = document.getElementById("info-card");
const infoName = document.getElementById("info-name");
const infoNameEn = document.getElementById("info-name-en");
const infoSwatch = document.getElementById("info-swatch");
const infoStats = document.getElementById("info-stats");
const infoDesc = document.getElementById("info-desc");

const state = {
  paused: false,
  showLabels: true,
  showOrbits: true,
  speed: 8,
  timeScale: 1,
  selectedId: null,
  focusId: null,
  clock: new THREE.Clock(),
  bodies: new Map(),
  labels: [],
  orbits: [],
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(),
  focusOffset: new THREE.Vector3(0, 8, 18),
};

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03050c);
scene.fog = new THREE.FogExp2(0x03050c, 0.0018);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, 55, 120);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 8;
controls.maxDistance = 420;
controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0x334466, 0.55));
const sunLight = new THREE.PointLight(0xfff0c8, 2.8, 500, 1.2);
scene.add(sunLight);
const rimLight = new THREE.DirectionalLight(0x6688aa, 0.25);
rimLight.position.set(-40, 60, -20);
scene.add(rimLight);

function createStarfield(count = 4500) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 180 + Math.random() * 700;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    const c = 0.7 + Math.random() * 0.3;
    colors[i * 3] = c;
    colors[i * 3 + 1] = c * (0.9 + Math.random() * 0.1);
    colors[i * 3 + 2] = c;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.1,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

scene.add(createStarfield());

function createOrbitLine(radius, inclinationDeg, color) {
  const pts = [];
  const segs = 180;
  const inc = THREE.MathUtils.degToRad(inclinationDeg);
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    const y = Math.sin(a) * Math.sin(inc) * radius * 0.18;
    pts.push(new THREE.Vector3(x, y, z));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.28,
  });
  const line = new THREE.Line(geo, mat);
  line.userData.isOrbit = true;
  return line;
}

function createPlanetTexture(baseColor, options = {}) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const col = new THREE.Color(baseColor);

  if (options.isStar) {
    const g = ctx.createRadialGradient(size * 0.35, size * 0.35, 10, size / 2, size / 2, size / 2);
    g.addColorStop(0, "#fff8d0");
    g.addColorStop(0.35, "#ffd24a");
    g.addColorStop(0.75, "#ff8a1a");
    g.addColorStop(1, "#cc4400");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  } else if (options.banded) {
    for (let y = 0; y < size; y++) {
      const t = y / size;
      const shade = 0.75 + Math.sin(t * Math.PI * 10) * 0.12 + Math.sin(t * 40) * 0.04;
      ctx.fillStyle = `rgb(${Math.floor(col.r * 255 * shade)},${Math.floor(col.g * 255 * shade * 0.92)},${Math.floor(col.b * 255 * shade * 0.75)})`;
      ctx.fillRect(0, y, size, 1);
    }
    ctx.fillStyle = "rgba(180,60,40,0.55)";
    ctx.beginPath();
    ctx.ellipse(size * 0.62, size * 0.55, 28, 16, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (options.id === "earth") {
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, "#1b4f9c");
    g.addColorStop(0.4, "#2f8f4e");
    g.addColorStop(0.7, "#c2b280");
    g.addColorStop(1, "#1a5fad");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, 4 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const g = ctx.createRadialGradient(size * 0.35, size * 0.3, 8, size / 2, size / 2, size / 2);
    g.addColorStop(0, `rgb(${Math.min(255, col.r * 255 + 40)},${Math.min(255, col.g * 255 + 30)},${Math.min(255, col.b * 255 + 20)})`);
    g.addColorStop(1, `rgb(${col.r * 180},${col.g * 180},${col.b * 180})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, 1 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createLabel(text) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  const pad = 10;
  ctx.font = "600 28px 'Noto Sans SC', sans-serif";
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = 44;
  c.width = w;
  c.height = h;
  ctx.font = "600 28px 'Noto Sans SC', sans-serif";
  ctx.fillStyle = "rgba(5,10,20,0.55)";
  roundRect(ctx, 0, 0, w, h, 12);
  ctx.fill();
  ctx.fillStyle = "#e8f0ff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2 + 1);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  const scale = 0.045;
  sprite.scale.set(w * scale, h * scale, 1);
  sprite.userData.isLabel = true;
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function createBody(data) {
  const group = new THREE.Group();
  group.userData = { ...data, angle: Math.random() * Math.PI * 2 };

  const tex = createPlanetTexture(data.color, data);
  let mat;
  if (data.isStar) {
    mat = new THREE.MeshBasicMaterial({ map: tex });
  } else {
    mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.72,
      metalness: 0.08,
      emissive: new THREE.Color(data.color).multiplyScalar(0.04),
    });
  }

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.radius, 48, 48), mat);
  mesh.userData.planetId = data.id;
  mesh.castShadow = false;
  group.add(mesh);

  if (data.isStar) {
    const glowGeo = new THREE.SphereGeometry(data.radius * 1.35, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));

    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(data.radius * 1.8, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffcc66,
        transparent: true,
        opacity: 0.07,
        side: THREE.BackSide,
      })
    );
    group.add(corona);

    const spriteMat = new THREE.SpriteMaterial({
      map: createSoftGlowTexture(),
      color: 0xffb24a,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(28, 28, 1);
    group.add(sprite);
  }

  if (data.hasRings) {
    const ringGeo = new THREE.RingGeometry(data.radius * 1.35, data.radius * 2.35, 96);
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y);
      uv.setXY(i, (r - data.radius * 1.35) / (data.radius), 0.5);
    }
    const ringMat = new THREE.MeshBasicMaterial({
      map: createRingTexture(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.15;
    mesh.add(ring);
  }

  if (data.hasMoon) {
    const moonPivot = new THREE.Group();
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 })
    );
    moon.position.set(2.1, 0.15, 0);
    moon.userData.planetId = "moon";
    moonPivot.add(moon);
    moonPivot.userData.spin = 0;
    group.add(moonPivot);
    group.userData.moonPivot = moonPivot;
  }

  mesh.rotation.z = THREE.MathUtils.degToRad(data.tilt || 0) * 0.15;

  const label = createLabel(data.name);
  label.position.y = data.radius + 1.4;
  group.add(label);
  state.labels.push(label);

  if (!data.isStar) {
    const orbit = createOrbitLine(data.distance, data.inclination, data.color);
    scene.add(orbit);
    state.orbits.push(orbit);
  }

  scene.add(group);
  state.bodies.set(data.id, { group, mesh, data });
  return group;
}

function createSoftGlowTexture() {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,230,160,1)");
  g.addColorStop(0.35, "rgba(255,170,60,0.45)");
  g.addColorStop(1, "rgba(255,120,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

function createRingTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = 8;
  const ctx = c.getContext("2d");
  for (let x = 0; x < size; x++) {
    const t = x / size;
    const a = 0.15 + Math.abs(Math.sin(t * Math.PI * 18)) * 0.55;
    const shade = 180 + Math.sin(t * 40) * 40;
    ctx.fillStyle = `rgba(${shade},${shade - 20},${shade - 50},${a})`;
    ctx.fillRect(x, 0, 1, 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  return tex;
}

PLANETS.forEach(createBody);

function buildUI() {
  planetListEl.innerHTML = "";
  legendEl.innerHTML = "";
  PLANETS.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "planet-item";
    btn.dataset.id = p.id;
    btn.innerHTML = `
      <span class="planet-dot" style="background:${hex(p.color)};color:${hex(p.color)}"></span>
      <span><strong>${p.name}</strong><small>${p.nameEn}${p.dwarf ? " · 矮行星" : ""}</small></span>
    `;
    btn.addEventListener("click", () => selectPlanet(p.id, true));
    planetListEl.appendChild(btn);

    const chip = document.createElement("button");
    chip.className = "legend-chip";
    chip.innerHTML = `<span style="background:${hex(p.color)}"></span>${p.name}`;
    chip.addEventListener("click", () => selectPlanet(p.id, true));
    legendEl.appendChild(chip);
  });
}

function hex(n) {
  return `#${n.toString(16).padStart(6, "0")}`;
}

function selectPlanet(id, focus = false) {
  state.selectedId = id;
  const entry = state.bodies.get(id);
  if (!entry) return;

  document.querySelectorAll(".planet-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === id);
  });

  const d = entry.data;
  infoEmpty.classList.add("hidden");
  infoCard.classList.remove("hidden");
  infoName.textContent = d.name;
  infoNameEn.textContent = d.nameEn.toUpperCase();
  infoSwatch.style.background = hex(d.color);
  infoSwatch.style.color = hex(d.color);
  infoStats.innerHTML = Object.entries(d.facts)
    .map(
      ([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`
    )
    .join("");
  infoDesc.textContent = d.desc;

  if (focus) {
    state.focusId = id;
  }
}

function getWorldPosition(id) {
  const entry = state.bodies.get(id);
  if (!entry) return new THREE.Vector3();
  const pos = new THREE.Vector3();
  entry.mesh.getWorldPosition(pos);
  return pos;
}

function updateBodies(dt) {
  const simSpeed = state.paused ? 0 : state.speed * state.timeScale;

  state.bodies.forEach(({ group, mesh, data }) => {
    mesh.rotation.y += dt * (data.isStar ? 0.15 : 0.6);

    if (data.isStar) {
      group.position.set(0, 0, 0);
      return;
    }

    if (simSpeed > 0 && data.period > 0) {
      const omega = (Math.PI * 2) / (data.period * 60);
      group.userData.angle += omega * simSpeed * dt;
    }

    const a = group.userData.angle;
    const inc = THREE.MathUtils.degToRad(data.inclination);
    const x = Math.cos(a) * data.distance;
    const z = Math.sin(a) * data.distance;
    const y = Math.sin(a) * Math.sin(inc) * data.distance * 0.18;
    group.position.set(x, y, z);

    if (group.userData.moonPivot) {
      group.userData.moonPivot.rotation.y += dt * 1.8 * (state.paused ? 0 : 1);
    }
  });
}

function updateFocus(dt) {
  if (!state.focusId) return;
  const target = getWorldPosition(state.focusId);
  const entry = state.bodies.get(state.focusId);
  const r = entry ? entry.data.radius : 1;
  const desiredCam = target
    .clone()
    .add(new THREE.Vector3(r * 4 + 6, r * 2.5 + 4, r * 5 + 10));
  camera.position.lerp(desiredCam, 1 - Math.pow(0.001, dt));
  controls.target.lerp(target, 1 - Math.pow(0.001, dt));
}

function onPointerMove(event) {
  const rect = canvas.getBoundingClientRect();
  state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  state.raycaster.setFromCamera(state.pointer, camera);
  const meshes = [...state.bodies.values()].map((b) => b.mesh);
  const hits = state.raycaster.intersectObjects(meshes, false);
  if (hits.length) {
    const id = hits[0].object.userData.planetId;
    const data = PLANETS.find((p) => p.id === id);
    if (data) {
      tooltip.textContent = `${data.name} · ${data.nameEn}`;
      tooltip.classList.remove("hidden");
      tooltip.style.left = `${event.clientX}px`;
      tooltip.style.top = `${event.clientY}px`;
      canvas.style.cursor = "pointer";
      return;
    }
  }
  tooltip.classList.add("hidden");
  canvas.style.cursor = "grab";
}

function onClick(event) {
  const rect = canvas.getBoundingClientRect();
  state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  state.raycaster.setFromCamera(state.pointer, camera);
  const meshes = [...state.bodies.values()].map((b) => b.mesh);
  const hits = state.raycaster.intersectObjects(meshes, false);
  if (hits.length) {
    const id = hits[0].object.userData.planetId;
    if (id && id !== "moon") selectPlanet(id, false);
  }
}

function setLabelsVisible(v) {
  state.showLabels = v;
  state.labels.forEach((l) => {
    l.visible = v;
  });
}

function setOrbitsVisible(v) {
  state.showOrbits = v;
  state.orbits.forEach((o) => {
    o.visible = v;
  });
}

function resetView() {
  state.focusId = null;
  camera.position.set(0, 55, 120);
  controls.target.set(0, 0, 0);
  controls.update();
}

document.getElementById("btn-pause").addEventListener("click", (e) => {
  state.paused = !state.paused;
  e.currentTarget.textContent = state.paused ? "▶" : "❚❚";
  e.currentTarget.classList.toggle("active", state.paused);
  statusText.textContent = state.paused ? "已暂停" : "运行中";
});

document.getElementById("btn-reset").addEventListener("click", resetView);

document.getElementById("btn-labels").addEventListener("click", (e) => {
  setLabelsVisible(!state.showLabels);
  e.currentTarget.classList.toggle("active", state.showLabels);
});

document.getElementById("btn-orbits").addEventListener("click", (e) => {
  setOrbitsVisible(!state.showOrbits);
  e.currentTarget.classList.toggle("active", state.showOrbits);
});

document.getElementById("btn-focus").addEventListener("click", () => {
  if (state.selectedId) state.focusId = state.selectedId;
});

speedInput.addEventListener("input", () => {
  state.speed = Number(speedInput.value);
  speedVal.textContent = `${state.speed}×`;
});

timeScaleInput.addEventListener("input", () => {
  state.timeScale = Number(timeScaleInput.value);
  timeVal.textContent = state.timeScale.toFixed(1);
});

canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("click", onClick);
canvas.addEventListener("pointerleave", () => tooltip.classList.add("hidden"));

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    document.getElementById("btn-pause").click();
  } else if (e.key === "r" || e.key === "R") {
    resetView();
  } else if (e.key >= "1" && e.key <= "9") {
    const idx = Number(e.key);
    if (PLANETS[idx]) selectPlanet(PLANETS[idx].id, true);
  } else if (e.key === "0") {
    selectPlanet("sun", true);
  }
});

buildUI();
statusText.textContent = "运行中 · 拖拽旋转 · 滚轮缩放";

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(state.clock.getDelta(), 0.05);
  updateBodies(dt);
  updateFocus(dt);
  controls.update();

  state.labels.forEach((label) => {
    label.material.opacity = state.showLabels ? 0.95 : 0;
  });

  renderer.render(scene, camera);
}

animate();

selectPlanet("earth", false);
statusText.textContent = "运行中 · 九大行星 + 冥王星";
