import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const BODIES = [
  {
    id: "sun",
    name: "太阳",
    nameEn: "Sun",
    type: "恒星",
    color: 0xffb24a,
    emissive: 0xff8c1a,
    radius: 8,
    orbitRadius: 0,
    orbitSpeed: 0,
    spinSpeed: 0.004,
    tilt: 7.25,
    distanceAU: 0,
    periodDays: 0,
    diameterKm: 1392700,
    desc: "太阳系的中心天体，一颗黄矮星。其引力维系着九大行星的轨道运动，表面温度约 5500°C。",
  },
  {
    id: "mercury",
    name: "水星",
    nameEn: "Mercury",
    type: "类地行星",
    color: 0xb5b5b5,
    radius: 0.55,
    orbitRadius: 14,
    orbitSpeed: 0.047,
    spinSpeed: 0.004,
    tilt: 0.03,
    distanceAU: 0.39,
    periodDays: 88,
    diameterKm: 4879,
    desc: "最靠近太阳的行星，几乎没有大气，昼夜温差极大。表面布满陨石坑，公转周期约 88 天。",
  },
  {
    id: "venus",
    name: "金星",
    nameEn: "Venus",
    type: "类地行星",
    color: 0xe8c47a,
    radius: 0.95,
    orbitRadius: 19,
    orbitSpeed: 0.035,
    spinSpeed: -0.002,
    tilt: 177.4,
    distanceAU: 0.72,
    periodDays: 225,
    diameterKm: 12104,
    desc: "大小与地球相近，但被厚厚的二氧化碳大气笼罩，表面极端炎热。自转方向与多数行星相反。",
  },
  {
    id: "earth",
    name: "地球",
    nameEn: "Earth",
    type: "类地行星",
    color: 0x3a7bd5,
    secondary: 0x2ecc71,
    radius: 1,
    orbitRadius: 26,
    orbitSpeed: 0.029,
    spinSpeed: 0.02,
    tilt: 23.44,
    distanceAU: 1.0,
    periodDays: 365,
    diameterKm: 12742,
    desc: "目前已知唯一存在生命的行星。拥有液态水、适宜大气与磁场，月球是其唯一天然卫星。",
    moons: [{ name: "月球", radius: 0.27, distance: 2.2, speed: 0.08, color: 0xcfcfcf }],
  },
  {
    id: "mars",
    name: "火星",
    nameEn: "Mars",
    type: "类地行星",
    color: 0xc1440e,
    radius: 0.7,
    orbitRadius: 34,
    orbitSpeed: 0.024,
    spinSpeed: 0.018,
    tilt: 25.19,
    distanceAU: 1.52,
    periodDays: 687,
    diameterKm: 6779,
    desc: "红色沙漠行星，拥有太阳系最大火山奥林匹斯山。两颗小卫星火卫一、火卫二绕其运行。",
    moons: [
      { name: "火卫一", radius: 0.1, distance: 1.5, speed: 0.12, color: 0x9a8f7a },
      { name: "火卫二", radius: 0.07, distance: 2.0, speed: 0.07, color: 0x8a8070 },
    ],
  },
  {
    id: "jupiter",
    name: "木星",
    nameEn: "Jupiter",
    type: "气态巨行星",
    color: 0xc9a06a,
    secondary: 0xa67c52,
    radius: 3.4,
    orbitRadius: 48,
    orbitSpeed: 0.013,
    spinSpeed: 0.04,
    tilt: 3.13,
    distanceAU: 5.2,
    periodDays: 4333,
    diameterKm: 139820,
    desc: "太阳系最大行星，著名大红斑是持续数百年的巨型风暴。其强引力捕获了数十颗卫星。",
    moons: [
      { name: "木卫一", radius: 0.2, distance: 4.5, speed: 0.1, color: 0xf0d080 },
      { name: "木卫二", radius: 0.18, distance: 5.4, speed: 0.07, color: 0xd8e8f0 },
      { name: "木卫三", radius: 0.24, distance: 6.4, speed: 0.05, color: 0xb0a090 },
      { name: "木卫四", radius: 0.2, distance: 7.4, speed: 0.035, color: 0x8a7060 },
    ],
  },
  {
    id: "saturn",
    name: "土星",
    nameEn: "Saturn",
    type: "气态巨行星",
    color: 0xe6d3a3,
    secondary: 0xd4b87a,
    radius: 2.9,
    orbitRadius: 62,
    orbitSpeed: 0.0097,
    spinSpeed: 0.038,
    tilt: 26.73,
    distanceAU: 9.58,
    periodDays: 10759,
    diameterKm: 116460,
    hasRings: true,
    desc: "以壮丽的光环系统闻名。密度低于水，理论上可漂浮于足够大的水体上。",
  },
  {
    id: "uranus",
    name: "天王星",
    nameEn: "Uranus",
    type: "冰巨星",
    color: 0x7fd3e0,
    radius: 1.7,
    orbitRadius: 74,
    orbitSpeed: 0.0068,
    spinSpeed: 0.03,
    tilt: 97.77,
    distanceAU: 19.22,
    periodDays: 30687,
    diameterKm: 50724,
    hasRings: true,
    ringColor: 0xa8d8e8,
    desc: "侧躺着自转的冰巨星，轴倾角接近 98°。大气以氢、氦和甲烷为主，呈现淡青色。",
  },
  {
    id: "neptune",
    name: "海王星",
    nameEn: "Neptune",
    type: "冰巨星",
    color: 0x4166f5,
    radius: 1.65,
    orbitRadius: 86,
    orbitSpeed: 0.0054,
    spinSpeed: 0.032,
    tilt: 28.32,
    distanceAU: 30.05,
    periodDays: 60190,
    diameterKm: 49244,
    desc: "太阳系最外侧的大行星，拥有极强的风速。海卫一是其最大的卫星，轨道逆向运行。",
    moons: [{ name: "海卫一", radius: 0.22, distance: 3.2, speed: -0.04, color: 0xd0c8b8 }],
  },
  {
    id: "pluto",
    name: "冥王星",
    nameEn: "Pluto",
    type: "矮行星",
    color: 0xd8c2a8,
    secondary: 0xc4a888,
    radius: 0.4,
    orbitRadius: 98,
    orbitSpeed: 0.0036,
    spinSpeed: 0.01,
    tilt: 122.53,
    distanceAU: 39.5,
    periodDays: 90560,
    diameterKm: 2376,
    eccentricity: 0.25,
    inclination: 17,
    desc: "传统九大行星成员，2006 年被归类为矮行星。轨道偏心率与倾角较大，新视野号曾近距离探测。",
    moons: [{ name: "卡戎", radius: 0.2, distance: 1.3, speed: 0.06, color: 0xb0a090 }],
  },
];

const canvas = document.getElementById("scene");
const loading = document.getElementById("loading");
const bodyName = document.getElementById("body-name");
const bodyType = document.getElementById("body-type");
const bodyStats = document.getElementById("body-stats");
const bodyDesc = document.getElementById("body-desc");
const planetNav = document.getElementById("planet-nav");
const speedInput = document.getElementById("speed");
const speedVal = document.getElementById("speed-val");
const toggleOrbits = document.getElementById("toggle-orbits");
const toggleLabels = document.getElementById("toggle-labels");
const togglePause = document.getElementById("toggle-pause");
const btnReset = document.getElementById("btn-reset");
const btnFollow = document.getElementById("btn-follow");

let speedFactor = Number(speedInput.value);
let paused = false;
let followMode = false;
let focusedId = "sun";

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
scene.fog = new THREE.FogExp2(0x03060f, 0.0018);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 55, 120);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 8;
controls.maxDistance = 320;
controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0x334466, 0.55));
const sunLight = new THREE.PointLight(0xfff0d0, 2.8, 400, 0.6);
scene.add(sunLight);
const rimLight = new THREE.DirectionalLight(0x6a90ff, 0.25);
rimLight.position.set(-40, 60, -20);
scene.add(rimLight);

function createStarfield(count = 3500) {
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
    const tint = Math.random();
    colors[i * 3] = c;
    colors[i * 3 + 1] = tint > 0.85 ? c * 0.85 : c;
    colors[i * 3 + 2] = tint > 0.7 ? c : c * (0.9 + Math.random() * 0.1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.9,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}
scene.add(createStarfield());

function makePlanetTexture(base, secondary, options = {}) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const baseHex = `#${base.toString(16).padStart(6, "0")}`;
  const secHex = secondary
    ? `#${secondary.toString(16).padStart(6, "0")}`
    : baseHex;

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, shade(baseHex, 1.15));
  grad.addColorStop(0.5, baseHex);
  grad.addColorStop(1, shade(baseHex, 0.75));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  if (options.bands) {
    for (let i = 0; i < 18; i++) {
      const y = (i / 18) * size;
      const h = size / 18;
      ctx.fillStyle = i % 2 === 0 ? secHex : shade(baseHex, 0.85 + (i % 3) * 0.08);
      ctx.globalAlpha = 0.45;
      ctx.fillRect(0, y, size, h);
    }
    ctx.globalAlpha = 1;
  }

  if (options.earth) {
    ctx.fillStyle = "#1f6fd1";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#2f9e5f";
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const w = 20 + Math.random() * 50;
      const h = 10 + Math.random() * 30;
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * size, Math.random() * size, 8 + Math.random() * 18, 4 + Math.random() * 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (options.craters) {
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 2 + Math.random() * 8;
      ctx.fillStyle = `rgba(0,0,0,${0.12 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.1})`;
      ctx.stroke();
    }
  }

  if (options.spots) {
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = shade(secHex, 0.7 + Math.random() * 0.4);
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.ellipse(Math.random() * size, Math.random() * size, 10 + Math.random() * 30, 4 + Math.random() * 10, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  let r = Math.min(255, Math.round(((n >> 16) & 255) * factor));
  let g = Math.min(255, Math.round(((n >> 8) & 255) * factor));
  let b = Math.min(255, Math.round((n & 255) * factor));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function createLabel(text) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  const fontSize = 48;
  ctx.font = `600 ${fontSize}px "Avenir Next", "PingFang SC", sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + 48;
  c.width = w;
  c.height = 72;
  ctx.font = `600 ${fontSize}px "Avenir Next", "PingFang SC", sans-serif`;
  ctx.fillStyle = "rgba(8,14,28,0.55)";
  roundRect(ctx, 8, 10, w - 16, 52, 16);
  ctx.fill();
  ctx.fillStyle = "#e8f0ff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, 36);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(w / 48, 1.5, 1);
  sprite.center.set(0.5, 0);
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

function createOrbitLine(radius, eccentricity = 0, inclinationDeg = 0, color = 0x4a6a9a) {
  const points = [];
  const segments = 180;
  const a = radius;
  const e = eccentricity;
  const b = a * Math.sqrt(1 - e * e);
  const focus = a * e;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(t) * a - focus, 0, Math.sin(t) * b));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
  });
  const line = new THREE.Line(geo, mat);
  line.rotation.x = THREE.MathUtils.degToRad(inclinationDeg);
  return line;
}

function createRings(inner, outer, color) {
  const geo = new THREE.RingGeometry(inner, outer, 96);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const angle = Math.atan2(y, x);
    const radius = Math.sqrt(x * x + y * y);
    uv.setXY(i, (radius - inner) / (outer - inner), (angle / Math.PI) * 0.5 + 0.5);
  }
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 16;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  const hex = `#${color.toString(16).padStart(6, "0")}`;
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.12, hex);
  g.addColorStop(0.35, "rgba(255,255,255,0.15)");
  g.addColorStop(0.55, hex);
  g.addColorStop(0.78, "rgba(0,0,0,0.35)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 16);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

const system = new THREE.Group();
scene.add(system);

const bodyMap = new Map();
const orbitLines = [];
const labels = [];
const pickables = [];

function buildBody(data) {
  const group = new THREE.Group();
  group.userData.id = data.id;

  const orbitPivot = new THREE.Group();
  orbitPivot.rotation.x = THREE.MathUtils.degToRad(data.inclination || 0);

  const carrier = new THREE.Group();
  const a = data.orbitRadius;
  const e = data.eccentricity || 0;
  const focus = a * e;
  carrier.position.x = a > 0 ? a - focus : 0;

  let mesh;
  if (data.id === "sun") {
    const geo = new THREE.SphereGeometry(data.radius, 64, 64);
    const mat = new THREE.MeshBasicMaterial({ color: data.color });
    mesh = new THREE.Mesh(geo, mat);
    const glowGeo = new THREE.SphereGeometry(data.radius * 1.35, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    mesh.add(new THREE.Mesh(glowGeo, glowMat));
    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(data.radius * 1.8, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.07,
        side: THREE.BackSide,
      })
    );
    mesh.add(corona);
  } else {
    let texOpts = {};
    if (data.id === "earth") texOpts = { earth: true };
    else if (["jupiter", "saturn"].includes(data.id)) texOpts = { bands: true };
    else if (["mercury", "mars", "pluto"].includes(data.id)) texOpts = { craters: true };
    else texOpts = { spots: true };

    const tex = makePlanetTexture(data.color, data.secondary, texOpts);
    const geo = new THREE.SphereGeometry(data.radius, 48, 48);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.72,
      metalness: 0.05,
    });
    mesh = new THREE.Mesh(geo, mat);
  }

  mesh.rotation.z = THREE.MathUtils.degToRad(data.tilt || 0);
  mesh.userData.bodyId = data.id;
  pickables.push(mesh);

  const spinNode = new THREE.Group();
  spinNode.add(mesh);

  if (data.hasRings) {
    const ring = createRings(
      data.radius * 1.35,
      data.radius * 2.35,
      data.ringColor || 0xd8c9a0
    );
    spinNode.add(ring);
  }

  if (data.moons) {
    data.moons.forEach((m) => {
      const moonPivot = new THREE.Group();
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(m.radius, 16, 16),
        new THREE.MeshStandardMaterial({ color: m.color, roughness: 0.9 })
      );
      moon.position.x = m.distance;
      moonPivot.add(moon);
      moonPivot.userData.moonSpeed = m.speed;
      spinNode.add(moonPivot);
      moonPivot.userData.isMoonPivot = true;
    });
  }

  const label = createLabel(data.name);
  label.position.y = data.radius + 1.4;
  spinNode.add(label);
  labels.push(label);

  carrier.add(spinNode);
  orbitPivot.add(carrier);
  group.add(orbitPivot);

  if (data.orbitRadius > 0) {
    const orbit = createOrbitLine(
      data.orbitRadius,
      data.eccentricity || 0,
      data.inclination || 0,
      data.id === "pluto" ? 0x8a6a4a : 0x4a6a9a
    );
    system.add(orbit);
    orbitLines.push(orbit);
  }

  system.add(group);

  const record = {
    data,
    group,
    orbitPivot,
    carrier,
    spinNode,
    mesh,
    label,
    angle: Math.random() * Math.PI * 2,
  };
  bodyMap.set(data.id, record);
  return record;
}

BODIES.forEach(buildBody);

function formatNum(n) {
  return n.toLocaleString("zh-CN");
}

function showInfo(id) {
  const body = bodyMap.get(id);
  if (!body) return;
  focusedId = id;
  const d = body.data;
  bodyName.textContent = d.name;
  bodyType.textContent = `${d.type} · ${d.nameEn}`;
  bodyDesc.textContent = d.desc;

  const stats = [];
  if (d.id === "sun") {
    stats.push(["直径", `${formatNum(d.diameterKm)} km`]);
    stats.push(["类型", "G2V 黄矮星"]);
    stats.push(["表面", "~5500 °C"]);
    stats.push(["行星数", "9（含冥王星）"]);
  } else {
    stats.push(["日距", `${d.distanceAU} AU`]);
    stats.push(["公转", `${formatNum(d.periodDays)} 天`]);
    stats.push(["直径", `${formatNum(d.diameterKm)} km`]);
    stats.push(["轴倾角", `${d.tilt}°`]);
  }
  bodyStats.innerHTML = stats
    .map(
      ([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`
    )
    .join("");

  [...planetNav.querySelectorAll("button")].forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.id === id);
  });
}

function buildNav() {
  planetNav.innerHTML = "";
  BODIES.forEach((b) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.id = b.id;
    btn.innerHTML = `<span class="swatch" style="background:${`#${b.color.toString(16).padStart(6, "0")}`};color:${`#${b.color.toString(16).padStart(6, "0")}`}"></span><span>${b.name}</span>`;
    btn.addEventListener("click", () => focusBody(b.id, true));
    planetNav.appendChild(btn);
  });
}

const focusOffset = new THREE.Vector3();
const desiredCam = new THREE.Vector3();
const desiredTarget = new THREE.Vector3();
let animatingFocus = false;
let focusT = 0;
const focusFromCam = new THREE.Vector3();
const focusFromTarget = new THREE.Vector3();
const focusToCam = new THREE.Vector3();
const focusToTarget = new THREE.Vector3();

function getWorldPos(obj) {
  const v = new THREE.Vector3();
  obj.getWorldPosition(v);
  return v;
}

function focusBody(id, animate = true) {
  const body = bodyMap.get(id);
  if (!body) return;
  showInfo(id);

  const pos = getWorldPos(body.mesh);
  const dist = Math.max(body.data.radius * 6.5, 12);
  focusOffset.set(dist * 0.55, dist * 0.4, dist);

  if (id === "sun") {
    focusToTarget.set(0, 0, 0);
    focusToCam.set(0, 45, 110);
  } else {
    focusToTarget.copy(pos);
    focusToCam.copy(pos).add(focusOffset);
  }

  if (!animate) {
    camera.position.copy(focusToCam);
    controls.target.copy(focusToTarget);
    controls.update();
    return;
  }

  focusFromCam.copy(camera.position);
  focusFromTarget.copy(controls.target);
  focusT = 0;
  animatingFocus = true;
}

function resetOverview() {
  followMode = false;
  btnFollow.classList.remove("active");
  focusedId = "sun";
  showInfo("sun");
  focusFromCam.copy(camera.position);
  focusFromTarget.copy(controls.target);
  focusToCam.set(0, 55, 120);
  focusToTarget.set(0, 0, 0);
  focusT = 0;
  animatingFocus = true;
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;

canvas.addEventListener("pointerdown", (e) => {
  pointerDown = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", (e) => {
  if (!pointerDown) return;
  const dx = e.clientX - pointerDown.x;
  const dy = e.clientY - pointerDown.y;
  pointerDown = null;
  if (dx * dx + dy * dy > 16) return;

  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  if (hits.length) {
    const id = hits[0].object.userData.bodyId;
    if (id) focusBody(id, true);
  }
});

speedInput.addEventListener("input", () => {
  speedFactor = Number(speedInput.value);
  speedVal.textContent = `${speedFactor}×`;
});

toggleOrbits.addEventListener("change", () => {
  orbitLines.forEach((l) => {
    l.visible = toggleOrbits.checked;
  });
});

toggleLabels.addEventListener("change", () => {
  labels.forEach((l) => {
    l.visible = toggleLabels.checked;
  });
});

togglePause.addEventListener("change", () => {
  paused = togglePause.checked;
});

btnReset.addEventListener("click", resetOverview);

btnFollow.addEventListener("click", () => {
  followMode = !followMode;
  btnFollow.classList.toggle("active", followMode);
  if (followMode && focusedId) focusBody(focusedId, false);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

buildNav();
showInfo("sun");

const clock = new THREE.Clock();

function updateBodies(dt) {
  if (paused) return;
  const factor = speedFactor * dt;

  bodyMap.forEach((body) => {
    const d = body.data;
    if (d.orbitRadius > 0) {
      body.angle += d.orbitSpeed * factor * 12;
      const a = d.orbitRadius;
      const e = d.eccentricity || 0;
      const b = a * Math.sqrt(1 - e * e);
      const focus = a * e;
      body.carrier.position.x = Math.cos(body.angle) * a - focus;
      body.carrier.position.z = Math.sin(body.angle) * b;
    }
    body.spinNode.rotation.y += d.spinSpeed * factor * 20;
    body.spinNode.traverse((obj) => {
      if (obj.userData.isMoonPivot) {
        obj.rotation.y += obj.userData.moonSpeed * factor * 20;
      }
    });
  });
}

function updateFocus(dt) {
  if (animatingFocus) {
    focusT = Math.min(1, focusT + dt * 1.8);
    const k = 1 - Math.pow(1 - focusT, 3);
    camera.position.lerpVectors(focusFromCam, focusToCam, k);
    controls.target.lerpVectors(focusFromTarget, focusToTarget, k);
    if (focusT >= 1) animatingFocus = false;
  } else if (followMode && focusedId && focusedId !== "sun") {
    const body = bodyMap.get(focusedId);
    if (body) {
      const pos = getWorldPos(body.mesh);
      desiredTarget.copy(pos);
      desiredCam.copy(pos).add(focusOffset);
      camera.position.lerp(desiredCam, 1 - Math.exp(-3 * dt));
      controls.target.lerp(desiredTarget, 1 - Math.exp(-3 * dt));
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  updateBodies(dt);
  updateFocus(dt);
  controls.update();
  renderer.render(scene, camera);
}

animate();

requestAnimationFrame(() => {
  loading.classList.add("hide");
});
