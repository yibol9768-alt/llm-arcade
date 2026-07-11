import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/* ============================================================
   行星数据
   - visualSize / realSize : 视觉尺寸 / 真实相对尺寸(地球=0.3 基准)
   - dist : 视觉轨道半径
   - orbit : 相对公转速度(地球=1)
   - rot : 自转速度(弧度/秒,含方向;负值=逆向)
   - ecc : 离心率(仅用于视觉椭圆)
   - incl : 轨道倾角(度)
   - tilt : 自转轴倾角(度)
   ============================================================ */
const SUN = {
  key:'sun', name:'太阳', en:'Sun', type:'G2V 主序恒星',
  color:0xffcb6b, size:6,
  stats:[
    ['直径','1,392,700 km'],
    ['质量','占太阳系 99.86%'],
    ['表面温度','约 5,500 °C'],
    ['核心温度','约 1,500 万 °C'],
  ],
  fact:'太阳系的中心恒星，通过氢核聚变释放光与热，是地球一切生命的能量来源。其引力维系着九大行星的运行轨道。'
};

const PLANETS = [
  { key:'mercury', name:'水星', en:'Mercury', type:'类地行星 · 岩质',
    color:0x9a8b7a, visualSize:0.55, realSize:0.115, dist:12, orbit:4.15, rot:0.012, ecc:0.21, incl:7.0, tilt:0.03,
    stats:[['距日','0.39 AU'],['直径','4,879 km'],['公转','88 天'],['自转','59 天'],['卫星','0']],
    fact:'最靠近太阳的行星，几乎没有大气，昼夜温差从 -170 °C 到 430 °C。表面布满陨石坑，一天比一年还长。'
  },
  { key:'venus', name:'金星', en:'Venus', type:'类地行星 · 岩质',
    color:0xe6c07a, visualSize:0.92, realSize:0.285, dist:17, orbit:1.62, rot:-0.006, ecc:0.007, incl:3.4, tilt:177,
    stats:[['距日','0.72 AU'],['直径','12,104 km'],['公转','225 天'],['自转','243 天 (逆向)'],['卫星','0']],
    fact:'被浓密二氧化碳云层笼罩，温室效应使表面温度高达 462 °C，是太阳系最热的行星。自转方向与公转相反。'
  },
  { key:'earth', name:'地球', en:'Earth', type:'类地行星 · 宜居',
    color:0x4f8fe0, visualSize:1.0, realSize:0.30, dist:23, orbit:1.0, rot:0.55, ecc:0.017, incl:0.0, tilt:23.4,
    moon:{ size:0.27, dist:2.2, speed:0.9, color:0xcfcfcf },
    stats:[['距日','1.00 AU'],['直径','12,742 km'],['公转','365.25 天'],['自转','24 小时'],['卫星','1 (月球)']],
    fact:'已知唯一存在液态水与生命的行星。表面 71% 被海洋覆盖，大气富含氮氧，自转轴 23.4° 倾角造就四季。'
  },
  { key:'mars', name:'火星', en:'Mars', type:'类地行星 · 岩质',
    color:0xc1502e, visualSize:0.72, realSize:0.16, dist:30, orbit:0.53, rot:0.53, ecc:0.093, incl:1.85, tilt:25.2,
    stats:[['距日','1.52 AU'],['直径','6,779 km'],['公转','687 天'],['自转','24.6 小时'],['卫星','2']],
    fact:'表面氧化铁使其呈红色，拥有太阳系最高山(奥林帕斯山,21 km)和最大峡谷。人类深空探测的主要目标。'
  },
  { key:'jupiter', name:'木星', en:'Jupiter', type:'气态巨行星',
    color:0xd8a878, visualSize:3.2, realSize:3.36, dist:48, orbit:0.0843, rot:1.2, ecc:0.048, incl:1.31, tilt:3.1,
    bands:true, spot:true,
    stats:[['距日','5.20 AU'],['直径','139,820 km'],['公转','11.86 年'],['自转','9.9 小时'],['卫星','95+']],
    fact:'太阳系最大行星，质量为其余行星总和的 2.5 倍。大红斑是一场持续数百年的巨型反气旋风暴，可容纳两个地球。'
  },
  { key:'saturn', name:'土星', en:'Saturn', type:'气态巨行星 · 环系',
    color:0xe3c98a, visualSize:2.8, realSize:2.82, dist:66, orbit:0.0339, rot:1.1, ecc:0.054, incl:2.49, tilt:26.7,
    bands:true, ring:{ inner:1.35, outer:2.3, color:0xd9c9a0 },
    stats:[['距日','9.58 AU'],['直径','116,460 km'],['公转','29.46 年'],['自转','10.7 小时'],['卫星','146+']],
    fact:'以壮丽冰岩环系闻名，环宽约 28 万公里却仅厚 10 米。密度低于水，理论上可漂浮于水面。'
  },
  { key:'uranus', name:'天王星', en:'Uranus', type:'冰巨行星',
    color:0x9fdde0, visualSize:1.8, realSize:1.20, dist:84, orbit:0.0119, rot:-0.7, ecc:0.046, incl:0.77, tilt:97.8,
    ring:{ inner:1.5, outer:1.9, color:0x9fcfdf, faint:true },
    stats:[['距日','19.2 AU'],['直径','50,724 km'],['公转','84 年'],['自转','17.2 小时 (侧躺)'],['卫星','27']],
    fact:'自转轴几乎平躺在轨道平面上(倾角 97.8°)，仿佛侧滚着公转。甲烷大气吸收红光使其呈青蓝色。'
  },
  { key:'neptune', name:'海王星', en:'Neptune', type:'冰巨行星',
    color:0x3b6fe0, visualSize:1.7, realSize:1.17, dist:100, orbit:0.00606, rot:0.72, ecc:0.011, incl:1.77, tilt:28.3,
    stats:[['距日','30.05 AU'],['直径','49,244 km'],['公转','165 年'],['自转','16.1 小时'],['卫星','14']],
    fact:'最遥远的巨行星，风速可达 2,100 km/h，是太阳系最猛烈的风。由数学计算预言后才被观测发现。'
  },
  { key:'pluto', name:'冥王星', en:'Pluto', type:'矮行星 · 柯伊伯带',
    color:0xb89a7e, visualSize:0.34, realSize:0.057, dist:120, orbit:0.00403, rot:0.28, ecc:0.249, incl:17.16, tilt:122.5,
    stats:[['距日','39.5 AU'],['直径','2,376 km'],['公转','248 年'],['自转','6.4 天'],['卫星','5 (含 Charon)']],
    fact:'2006 年被重新归类为矮行星。轨道高度倾斜且偏心，有时比海王星更近太阳。表面有冰原与氮冰川。'
  },
];

/* ============================================================
   噪声 (Perlin-like 2D)
   ============================================================ */
function makeNoise(seed){
  const perm = new Uint8Array(512);
  let s = seed || 1;
  const rand = ()=>{ s = (s*16807) % 2147483647; return s/2147483647; };
  const p = new Uint8Array(256); for(let i=0;i<256;i++) p[i]=i;
  for(let i=255;i>0;i--){ const j=Math.floor(rand()*(i+1)); const t=p[i]; p[i]=p[j]; p[j]=t; }
  for(let i=0;i<512;i++) perm[i]=p[i&255];
  const fade = t=>t*t*t*(t*(t*6-15)+10);
  const lerp = (a,b,t)=>a+t*(b-a);
  const grad = (h,x,y)=>{ const u=(h&1)?x:-x; const v=(h&2)?y:-y; return u+v; };
  return (x,y)=>{
    const X=Math.floor(x)&255, Y=Math.floor(y)&255;
    x-=Math.floor(x); y-=Math.floor(y);
    const u=fade(x), v=fade(y);
    const aa=perm[perm[X]+Y], ab=perm[perm[X]+Y+1], ba=perm[perm[X+1]+Y], bb=perm[perm[X+1]+Y+1];
    return lerp(lerp(grad(aa,x,y), grad(ba,x-1,y), u), lerp(grad(ab,x,y-1), grad(bb,x-1,y-1), u), v);
  };
}

/* ============================================================
   程序化纹理生成
   ============================================================ */
function texCanvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
function toTexture(canvas){ const t=new THREE.CanvasTexture(canvas); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t; }

// 通用：基于像素绘制
function fillNoise(ctx,w,h,fn){
  const img = ctx.createImageData(w,h);
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const c = fn(x,y,w,h);
      const i=(y*w+x)*4;
      img.data[i]=c[0]; img.data[i+1]=c[1]; img.data[i+2]=c[2]; img.data[i+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;

// 岩质行星纹理
function rockyTexture({base, light, dark, seed=1, polar=false, craters=0}){
  const w=512,h=256; const c=texCanvas(w,h); const ctx=c.getContext('2d');
  const n = makeNoise(seed);
  const n2 = makeNoise(seed*7+3);
  fillNoise(ctx,w,h,(x,y)=>{
    const u=x/w*8, v=y/h*4;
    let val = n(u,v)*0.5 + n(u*2,v*2)*0.25 + n(u*4,v*4)*0.125; // -1..1 ish
    val = val*0.5+0.5;
    const r = mix(dark[0],light[0],clamp(val,0,1));
    const g = mix(dark[1],light[1],clamp(val,0,1));
    const b = mix(dark[2],light[2],clamp(val,0,1));
    let R=mix(base[0],r,0.8), G=mix(base[1],g,0.8), B=mix(base[2],b,0.8);
    if(polar){
      const lat = Math.abs(y/h-0.5)*2; // 0 中间 ..1 极
      const polarAmt = clamp((lat-0.78)/0.22,0,1);
      // 极冠起伏
      const edge = n2(x/w*6, y/h*3)*0.5+0.5;
      const cap = clamp((lat-0.72 - edge*0.06)/0.20, 0, 1);
      R = mix(R, 245, cap*0.95); G = mix(G, 248, cap*0.95); B = mix(B, 255, cap*0.95);
      void polarAmt;
    }
    return [R,G,B];
  });
  // 陨石坑
  if(craters>0){
    let s=seed*13+5;
    const rnd=()=>{s=(s*16807)%2147483647; return s/2147483647;};
    for(let i=0;i<craters;i++){
      const cx=rnd()*w, cy=rnd()*h, rr=2+rnd()*8;
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,rr);
      g.addColorStop(0,'rgba(20,15,10,0.45)');
      g.addColorStop(0.6,'rgba(20,15,10,0.15)');
      g.addColorStop(0.85,'rgba(255,240,220,0.25)');
      g.addColorStop(1,'rgba(255,240,220,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,rr,0,Math.PI*2); ctx.fill();
    }
  }
  return toTexture(c);
}

// 气态巨行星条带纹理
function gasTexture({bands, seed=2, spot=false, spotColor=[180,60,40]}){
  const w=512,h=256; const c=texCanvas(w,h); const ctx=c.getContext('2d');
  const n = makeNoise(seed);
  const n2 = makeNoise(seed*5+1);
  fillNoise(ctx,w,h,(x,y)=>{
    const lat = y/h; // 0..1
    const wobble = (n(x/w*3, lat*10)*0.5+0.5 - 0.5) * 0.06;
    const t = clamp(lat + wobble, 0, 1);
    // 在 bands 中按位置插值
    let col = bands[0].slice();
    for(let i=1;i<bands.length;i++){
      const edge = i/(bands.length-1);
      if(t<=edge){
        const a = bands[i-1], b=bands[i];
        const lt = (t-(i-1)/(bands.length-1))/(edge-(i-1)/(bands.length-1));
        col=[mix(a[0],b[0],lt),mix(a[1],b[1],lt),mix(a[2],b[2],lt)];
        break;
      }
      col = bands[i].slice();
    }
    // 细湍流
    const turb = (n2(x/w*18, lat*22)*0.5+0.5)-0.5;
    const k = 0.10;
    let R=clamp(col[0]+turb*255*k,0,255), G=clamp(col[1]+turb*255*k,0,255), B=clamp(col[2]+turb*255*k,0,255);
    // 大红斑
    if(spot){
      const sx=0.62, sy=0.62, rw=0.10, rh=0.055;
      const dx=(x/w-sx)/rw, dy=(y/h-sy)/rh;
      const d = dx*dx+dy*dy;
      if(d<1){
        const a = Math.pow(1-d, 0.7);
        R=mix(R, spotColor[0], a*0.85);
        G=mix(G, spotColor[1], a*0.85);
        B=mix(B, spotColor[2], a*0.85);
      }
    }
    return [R,G,B];
  });
  return toTexture(c);
}

// 地球纹理
function earthTexture(seed=7){
  const w=512,h=256; const c=texCanvas(w,h); const ctx=c.getContext('2d');
  const n = makeNoise(seed);
  const n2 = makeNoise(seed*3+9);
  fillNoise(ctx,w,h,(x,y)=>{
    const u=x/w*6, v=y/h*3;
    let val = n(u,v)*0.6 + n(u*2,v*2)*0.3 + n(u*4,v*4)*0.1;
    val = val*0.5+0.55;
    const lat = Math.abs(y/h-0.5)*2;
    // 海洋
    let R=18,G=52,B=110;
    if(val>0.62){
      // 陆地
      const green = clamp(val-0.62,0,0.25)/0.25;
      R=mix(90,170,green); G=mix(120,90,green); B=mix(60,55,green);
      // 沙漠
      if(n2(u*1.5,v*1.5)>0.35){ R=mix(R,200,0.4); G=mix(G,170,0.4); B=mix(B,110,0.4); }
    } else {
      // 深浅海
      const deep = clamp(0.62-val,0,0.4)/0.4;
      R=mix(40,12,deep); G=mix(80,30,deep); B=mix(150,70,deep);
    }
    // 极冠
    const cap = clamp((lat-0.82)/0.18,0,1);
    const edge = n2(x/w*5, y/h*3)*0.5+0.5;
    const capE = clamp((lat-0.78 - edge*0.05)/0.18,0,1);
    R=mix(R,245,capE); G=mix(G,248,capE); B=mix(B,255,capE);
    void cap;
    return [R,G,B];
  });
  return toTexture(c);
}

// 太阳纹理
function sunTexture(seed=11){
  const w=512,h=256; const c=texCanvas(w,h); const ctx=c.getContext('2d');
  const n = makeNoise(seed);
  const n2 = makeNoise(seed*2+3);
  fillNoise(ctx,w,h,(x,y)=>{
    const u=x/w*12, v=y/h*6;
    let val = n(u,v)*0.5+n(u*2,v*2)*0.25+n(u*4,v*4)*0.125;
    val = val*0.5+0.5;
    const hot = clamp(val,0,1);
    const R = mix(255,255,hot);
    const G = mix(140,235,hot);
    const B = mix(40,150,hot);
    const gran = (n2(x/w*40,y/h*40)*0.5+0.5);
    return [clamp(R*gran*0.9+30,0,255), clamp(G*gran*0.9+20,0,255), clamp(B*gran*0.85+10,0,255)];
  });
  return toTexture(c);
}

// 光晕贴图
function glowTexture(){
  const c=texCanvas(256,256); const ctx=c.getContext('2d');
  const g=ctx.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,'rgba(255,240,200,1)');
  g.addColorStop(0.2,'rgba(255,200,120,0.75)');
  g.addColorStop(0.5,'rgba(255,140,60,0.28)');
  g.addColorStop(1,'rgba(255,90,30,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,256,256);
  return toTexture(c);
}

// 环纹理
function ringTexture({inner,outer,color,faint}){
  const c=texCanvas(512,64); const ctx=c.getContext('2d');
  const base = new THREE.Color(color);
  const n = makeNoise(123);
  const img=ctx.createImageData(512,64);
  for(let x=0;x<512;x++){
    const t=x/512; // 0 内 ..1 外
    const r0 = inner, r1=outer;
    // 多条环带 + 缝隙
    let band = 0.6 + 0.4*(n(t*30,0)*0.5+0.5);
    // 卡西尼缝
    if(t>0.55 && t<0.60) band*=0.15;
    if(t>0.78 && t<0.81) band*=0.35;
    if(faint) band*=0.5;
    const a = band* (0.85 + 0.3*(n(t*60,1)*0.5+0.5));
    for(let y=0;y<64;y++){
      const i=(y*512+x)*4;
      img.data[i]=base.r*255; img.data[i+1]=base.g*255; img.data[i+2]=base.b*255;
      img.data[i+3]=clamp(a*255,0,255);
    }
  }
  ctx.putImageData(img,0,0);
  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  // 仅用水平方向，按半径映射：通过 repeat + offset 配合自定义 UV
  return tex;
}

/* ============================================================
   三维场景
   ============================================================ */
const sceneEl = document.getElementById('scene');
const labelsEl = document.getElementById('labels');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04050b);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 5000);
const DEFAULT_CAM_POS = new THREE.Vector3(0, 70, 150);
camera.position.copy(DEFAULT_CAM_POS);

const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
sceneEl.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position='absolute';
labelRenderer.domElement.style.top='0';
labelRenderer.domElement.style.pointerEvents='none';
labelsEl.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 6;
controls.maxDistance = 900;
controls.target.set(0,0,0);

/* 光照 */
scene.add(new THREE.AmbientLight(0x556080, 1.15));
const sunLight = new THREE.PointLight(0xfff2d0, 2.4, 0, 0); // decay 0 -> 均匀照亮
scene.add(sunLight);
const hemi = new THREE.HemisphereLight(0x88aaff, 0x080812, 0.35);
scene.add(hemi);

/* 星空背景 */
function buildStars(){
  const N=9000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N*3);
  const col = new Float32Array(N*3);
  const sz = new Float32Array(N);
  for(let i=0;i<N;i++){
    // 球面均匀分布
    const r = 1200 + Math.random()*800;
    const u=Math.random()*2-1, t=Math.random()*Math.PI*2;
    const s=Math.sqrt(1-u*u);
    pos[i*3]=r*s*Math.cos(t);
    pos[i*3+1]=r*u;
    pos[i*3+2]=r*s*Math.sin(t);
    const c = Math.random();
    if(c<0.7){ col[i*3]=1; col[i*3+1]=1; col[i*3+2]=1; }
    else if(c<0.85){ col[i*3]=0.75; col[i*3+1]=0.85; col[i*3+2]=1.0; }
    else { col[i*3]=1.0; col[i*3+1]=0.85; col[i*3+2]=0.7; }
    sz[i] = Math.random()<0.04 ? 2.6 : (Math.random()*1.2+0.4);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color', new THREE.BufferAttribute(col,3));
  geo.setAttribute('size', new THREE.BufferAttribute(sz,1));
  const mat = new THREE.PointsMaterial({ size:1.4, sizeAttenuation:false, vertexColors:true,
    transparent:true, opacity:0.95, depthWrite:false });
  return new THREE.Points(geo, mat);
}
const stars = buildStars();
scene.add(stars);

// 远处星云背景球
function buildNebula(){
  const c = texCanvas(1024,512); const ctx=c.getContext('2d');
  ctx.fillStyle='#04050b'; ctx.fillRect(0,0,1024,512);
  const n = makeNoise(42);
  const img=ctx.getImageData(0,0,1024,512);
  for(let y=0;y<512;y++) for(let x=0;x<1024;x++){
    const v = n(x/1024*6, y/512*3)*0.5+0.5;
    const v2 = n(x/1024*12+10, y/512*6+10)*0.5+0.5;
    const k = Math.pow(v*v2, 2.2);
    const i=(y*1024+x)*4;
    // 紫蓝 + 少量橙
    img.data[i]   = clamp(40*k + 10*k*k,0,255);
    img.data[i+1] = clamp(20*k + 30*k*k,0,255);
    img.data[i+2] = clamp(90*k + 90*k*k,0,255);
  }
  ctx.putImageData(img,0,0);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const geo = new THREE.SphereGeometry(2200, 32, 32);
  const mat = new THREE.MeshBasicMaterial({ map:tex, side:THREE.BackSide, depthWrite:false });
  return new THREE.Mesh(geo, mat);
}
scene.add(buildNebula());

/* 太阳 */
const sunTex = sunTexture(11);
const sunMat = new THREE.MeshBasicMaterial({ map:sunTex, color:0xfff2c0 });
const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(SUN.size, 64, 48), sunMat);
scene.add(sunMesh);
// 光晕 sprite
const glowTex = glowTexture();
const glowMat = new THREE.SpriteMaterial({ map:glowTex, color:0xffd9a0, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false });
const glow = new THREE.Sprite(glowMat); glow.scale.set(SUN.size*4.2, SUN.size*4.2, 1); scene.add(glow);
const glow2 = new THREE.Sprite(glowMat.clone()); glow2.material.color.set(0xffb060); glow2.material.opacity=0.55;
glow2.scale.set(SUN.size*8, SUN.size*8, 1); scene.add(glow2);
sunMesh.userData = { isSun:true, key:'sun', name:SUN.name };

// 太阳标签
function makeLabel(text, en, cls){
  const div = document.createElement('div');
  div.className = 'planet-label' + (cls?(' '+cls):'');
  div.innerHTML = `${text}<span class="label-en">${en}</span>`;
  return new CSS2DObject(div);
}
const sunLabel = makeLabel(SUN.name, SUN.en, 'sun');
sunLabel.position.set(0, SUN.size+1.2, 0);
sunMesh.add(sunLabel);

/* 行星构建 */
const planetObjs = []; // 运行时对象
const orbitLines = [];
const trailGroups = [];

function colorRGB(hex){ const c=new THREE.Color(hex); return [c.r*255,c.g*255,c.b*255]; }

function buildPlanet(p){
  const obj = { data:p, theta: Math.random()*Math.PI*2, spin:0, curScale:p.visualSize, targetScale:p.visualSize };

  // 轨道枢轴 (倾角)
  const pivot = new THREE.Object3D();
  pivot.rotation.x = THREE.MathUtils.degToRad(p.incl);
  scene.add(pivot);

  // 行星组 (沿轨道移动)
  const group = new THREE.Object3D();
  pivot.add(group);

  // 倾角组 (自转轴倾角)
  const tiltGroup = new THREE.Object3D();
  tiltGroup.rotation.z = THREE.MathUtils.degToRad(p.tilt>90?p.tilt-180:p.tilt);
  // 侧躺行星(天王星)让倾角体现在自转方向上
  if(p.tilt>90){ tiltGroup.rotation.z = THREE.MathUtils.degToRad(90); }
  group.add(tiltGroup);

  // 行星网格
  let tex;
  if(p.key==='earth'){ tex = earthTexture(7); }
  else if(p.bands){
    const bands = makeBands(p.color);
    tex = gasTexture({ bands, seed: p.key.length*7+p.dist, spot: !!p.spot });
  } else if(p.key==='mercury'){
    tex = rockyTexture({ base:colorRGB(p.color), light:[180,165,145], dark:[55,48,40], seed:3, craters:60 });
  } else if(p.key==='venus'){
    tex = rockyTexture({ base:colorRGB(p.color), light:[245,215,150], dark:[120,80,40], seed:5, craters:0 });
  } else if(p.key==='mars'){
    tex = rockyTexture({ base:colorRGB(p.color), light:[230,130,80], dark:[90,40,25], seed:9, polar:true, craters:30 });
  } else if(p.key==='pluto'){
    tex = rockyTexture({ base:colorRGB(p.color), light:[210,190,170], dark:[80,65,55], seed:13, craters:25 });
  } else {
    tex = rockyTexture({ base:colorRGB(p.color), light:colorRGB(p.color).map(v=>Math.min(255,v+60)), dark:colorRGB(p.color).map(v=>v*0.35), seed:17 });
  }
  const mat = new THREE.MeshStandardMaterial({ map:tex, roughness:0.95, metalness:0.0 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), mat);
  mesh.scale.setScalar(p.visualSize);
  mesh.userData = { isPlanet:true, key:p.key, name:p.name };
  tiltGroup.add(mesh);
  obj.pivot = pivot; obj.group = group; obj.tiltGroup = tiltGroup; obj.mesh = mesh;

  // 轨道线 (椭圆, 在 pivot 局部 xz 平面)
  const orbit = buildOrbitLine(p.dist, p.ecc);
  pivot.add(orbit);
  orbitLines.push(orbit);
  obj.orbit = orbit;

  // 轨迹
  const trail = buildTrail();
  pivot.add(trail.line);
  obj.trail = trail;

  // 环
  if(p.ring){
    const ringTex = ringTexture({ inner:p.ring.inner, outer:p.ring.outer, color:p.ring.color, faint:p.ring.faint });
    const ringGeo = new THREE.RingGeometry(p.ring.inner, p.ring.outer, 96, 1);
    // 修正 UV: 沿半径方向映射
    remapRingUV(ringGeo, p.ring.inner, p.ring.outer);
    const ringMat = new THREE.MeshBasicMaterial({ map:ringTex, side:THREE.DoubleSide, transparent:true, opacity:p.ring.faint?0.55:0.92, depthWrite:false });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI/2; // 平铺在 tiltGroup 的 xz 平面
    tiltGroup.add(ring);
    obj.ring = ring;
  }

  // 卫星 (地球的月球)
  if(p.moon){
    const moonTex = rockyTexture({ base:colorRGB(p.moon.color), light:[220,220,220], dark:[60,60,65], seed:21, craters:40 });
    const moonMat = new THREE.MeshStandardMaterial({ map:moonTex, roughness:1, metalness:0 });
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(1,32,24), moonMat);
    moonMesh.scale.setScalar(p.moon.size);
    const moonPivot = new THREE.Object3D();
    group.add(moonPivot);
    moonMesh.position.set(p.moon.dist, 0, 0);
    moonPivot.add(moonMesh);
    obj.moonPivot = moonPivot; obj.moon = moonMesh; obj.moonData = p.moon;
  }

  // 标签
  const label = makeLabel(p.name, p.en);
  label.position.set(0, 1, 0);
  group.add(label);
  obj.label = label;

  return obj;
}

function makeBands(baseHex){
  const c = new THREE.Color(baseHex);
  const r=c.r*255, g=c.g*255, b=c.b*255;
  const vary=(amt,a)=>[clamp(r+amt*a,0,255),clamp(g+amt*a,0,255),clamp(b+amt*a,0,255)];
  return [
    vary(-50,-30), vary(-30,-20), vary(-10,-10), vary(20,15), vary(-20,-10),
    vary(30,25), vary(0,0), vary(-25,-15), vary(15,10), vary(-40,-25), vary(-15,-10)
  ];
}

function buildOrbitLine(a, e){
  const segs=180;
  const b = a*Math.sqrt(1-e*e);
  const cx = -a*e; // 焦点在原点(太阳),椭圆中心偏移
  const pts=[];
  for(let i=0;i<=segs;i++){
    const t=i/segs*Math.PI*2;
    pts.push(new THREE.Vector3(cx + a*Math.cos(t), 0, b*Math.sin(t)));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color:0x3f5f8f, transparent:true, opacity:0.45 });
  return new THREE.Line(geo, mat);
}

function buildTrail(){
  const MAX=160;
  const pos = new Float32Array(MAX*3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setDrawRange(0,0);
  const mat = new THREE.LineBasicMaterial({ color:0x8ab4ff, transparent:true, opacity:0.6 });
  const line = new THREE.Line(geo, mat);
  line.visible=false;
  return { line, MAX, head:0, count:0, pos };
}

function remapRingUV(geo, inner, outer){
  // 将每个顶点的 UV.v 设为 (radius-inner)/(outer-inner)，u 设为角度
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v3 = new THREE.Vector3();
  for(let i=0;i<pos.count;i++){
    v3.fromBufferAttribute(pos,i);
    const r = Math.sqrt(v3.x*v3.x + v3.y*v3.y);
    const ang = Math.atan2(v3.y, v3.x);
    uv.setXY(i, (ang/(Math.PI*2))+0.5, (r-inner)/(outer-inner));
  }
  uv.needsUpdate=true;
}

PLANETS.forEach(p=>{ const o=buildPlanet(p); planetObjs.push(o); });

/* ============================================================
   交互: 点击聚焦
   ============================================================ */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickables = [sunMesh, ...planetObjs.map(o=>o.mesh)];

let focused = null;       // 当前聚焦的 obj (或 sun 对象)
let following = false;    // 聚焦后是否进入跟随
let tweening = false;     // 是否正在过渡
let tweenGoal = { camPos:new THREE.Vector3(), target:new THREE.Vector3() };

const infoPanel = document.getElementById('info-panel');
const infoZh = document.getElementById('info-name-zh');
const infoEn = document.getElementById('info-name-en');
const infoType = document.getElementById('info-type');
const infoStats = document.getElementById('info-stats');
const infoFact = document.getElementById('info-fact');
const infoSwatch = document.getElementById('info-swatch');
const infoFocus = document.getElementById('info-focus');
const infoClose = document.getElementById('info-close');

function showInfoFor(key){
  let body;
  if(key==='sun'){ body = SUN; infoSwatch.style.background='radial-gradient(circle at 35% 30%, #fff2c0, #ff9b3d 70%)';
    infoSwatch.style.boxShadow='0 0 22px rgba(255,170,80,0.7)'; }
  else {
    const p = PLANETS.find(x=>x.key===key);
    body = p;
    const col = new THREE.Color(p.color);
    infoSwatch.style.background=`radial-gradient(circle at 35% 30%, rgb(${col.r*255+60|0},${col.g*255+60|0},${col.b*255+60|0}), rgb(${col.r*255|0},${col.g*255|0},${col.b*255|0}) 75%)`;
    infoSwatch.style.boxShadow=`0 0 18px rgba(${col.r*255|0},${col.g*255|0},${col.b*255|0},0.55)`;
  }
  infoZh.textContent = body.name;
  infoEn.textContent = body.en;
  infoType.textContent = body.type;
  infoStats.innerHTML = body.stats.map(([k,v])=>`<div class="stat"><div class="stat-k">${k}</div><div class="stat-v">${v}</div></div>`).join('');
  infoFact.textContent = body.fact;
  infoPanel.classList.remove('hidden');
  // 高亮导航
  document.querySelectorAll('.pnav-btn').forEach(b=>b.classList.toggle('active', b.dataset.key===key));
}

function clearFocus(){
  focused=null; following=false; tweening=false;
  infoPanel.classList.add('hidden');
  document.querySelectorAll('.pnav-btn').forEach(b=>b.classList.remove('active'));
  infoFocus.classList.remove('following');
  infoFocus.textContent='聚焦跟随';
}

function focusOn(key, instant=false){
  let target, worldPos, radius;
  if(key==='sun'){
    target={ isSun:true };
    worldPos = new THREE.Vector3(0,0,0);
    radius = SUN.size;
  } else {
    const o = planetObjs.find(x=>x.data.key===key);
    if(!o) return;
    target = o;
    worldPos = new THREE.Vector3(); o.group.getWorldPosition(worldPos);
    radius = o.curScale;
  }
  focused = target;
  following = false;
  tweening = true;
  // 计算相机目标位置: 从当前相机方向看向目标，距离按半径缩放
  const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
  if(dir.lengthSq()<1e-4) dir.set(0,0.3,1).normalize();
  const dist = Math.max(radius*6, 8);
  tweenGoal.camPos.copy(worldPos).add(dir.multiplyScalar(dist));
  tweenGoal.camPos.y = Math.max(tweenGoal.camPos.y, worldPos.y + radius*1.5);
  tweenGoal.target.copy(worldPos);
  if(instant){ camera.position.copy(tweenGoal.camPos); controls.target.copy(tweenGoal.target); tweening=false; following=true; }
  showInfoFor(key);
  infoFocus.textContent='聚焦跟随';
  infoFocus.classList.remove('following');
}

infoClose.addEventListener('click', clearFocus);
infoFocus.addEventListener('click', ()=>{
  if(!focused) return;
  following = !following;
  infoFocus.classList.toggle('following', following);
  infoFocus.textContent = following ? '取消跟随' : '聚焦跟随';
});

// 拖拽与点击区分
let downX=0, downY=0, downTime=0, dragged=false;
renderer.domElement.addEventListener('pointerdown', e=>{
  downX=e.clientX; downY=e.clientY; downTime=performance.now(); dragged=false;
});
renderer.domElement.addEventListener('pointermove', e=>{
  if(Math.abs(e.clientX-downX)>4 || Math.abs(e.clientY-downY)>4) dragged=true;
});
renderer.domElement.addEventListener('pointerup', e=>{
  if(dragged) return;
  if(performance.now()-downTime>400) return;
  pointer.x = (e.clientX/window.innerWidth)*2-1;
  pointer.y = -(e.clientY/window.innerHeight)*2+1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickables, false);
  if(hits.length){
    const m = hits[0].object;
    if(m.userData.isSun) focusOn('sun');
    else if(m.userData.isPlanet) focusOn(m.userData.key);
  }
});

/* ============================================================
   导航按钮
   ============================================================ */
const nav = document.getElementById('planet-nav');
function navItem(key,name,color){
  const b=document.createElement('button');
  b.className='pnav-btn'; b.dataset.key=key;
  const dot=document.createElement('span'); dot.className='pnav-dot';
  const c=new THREE.Color(color);
  dot.style.color=`rgb(${c.r*255|0},${c.g*255|0},${c.b*255|0})`;
  dot.style.background=`rgb(${c.r*255|0},${c.g*255|0},${c.b*255|0})`;
  b.appendChild(dot); b.append(name);
  b.addEventListener('click', ()=>focusOn(key));
  return b;
}
nav.appendChild(navItem('sun',SUN.name,SUN.color));
PLANETS.forEach(p=>nav.appendChild(navItem(p.key,p.name,p.color)));

/* ============================================================
   控件
   ============================================================ */
let timeScale = 1.0;  // 倍率
let paused = false;
let showOrbits = true;
let showLabels = true;
let realSize = false;
let showTrails = false;

const speedSlider = document.getElementById('speed');
const speedVal = document.getElementById('speed-val');
function updateSpeed(){
  // 0..500 -> 0..5x (100 = 1x)
  timeScale = (parseFloat(speedSlider.value)/100);
  speedVal.textContent = timeScale.toFixed(1)+'×';
}
speedSlider.addEventListener('input', updateSpeed);
updateSpeed();

const btnPause = document.getElementById('btn-pause');
const pauseLabel = document.getElementById('pause-label');
btnPause.addEventListener('click', ()=>{
  paused = !paused;
  pauseLabel.textContent = paused ? '继续' : '暂停';
  btnPause.firstChild.textContent = paused ? '▶ ' : '⏸ ';
});

const btnReset = document.getElementById('btn-reset');
btnReset.addEventListener('click', ()=>{
  clearFocus();
  tweening = true;
  tweenGoal.camPos.copy(DEFAULT_CAM_POS);
  tweenGoal.target.set(0,0,0);
  // 重置时间
  elapsed = 0;
  planetObjs.forEach(o=>{
    o.theta = Math.random()*Math.PI*2; o.spin=0;
    o.trail.head=0; o.trail.count=0; o.trail.line.geometry.setDrawRange(0,0);
  });
});

document.getElementById('t-orbits').addEventListener('change', e=>{
  showOrbits = e.target.checked;
  orbitLines.forEach(l=>l.visible=showOrbits);
});
document.getElementById('t-labels').addEventListener('change', e=>{
  showLabels = e.target.checked;
  sunLabel.element.style.display = showLabels?'':'none';
  planetObjs.forEach(o=> o.label.element.style.display = showLabels?'':'none');
});
document.getElementById('t-real').addEventListener('change', e=>{
  realSize = e.target.checked;
  planetObjs.forEach(o=> o.targetScale = realSize ? o.data.realSize : o.data.visualSize);
  // 太阳保持不变
});
document.getElementById('t-trails').addEventListener('change', e=>{
  showTrails = e.target.checked;
  planetObjs.forEach(o=>{
    o.trail.line.visible = showTrails;
    if(!showTrails){ o.trail.head=0; o.trail.count=0; o.trail.line.geometry.setDrawRange(0,0); }
  });
});

/* ============================================================
   动画循环
   ============================================================ */
let elapsed = 0;
const clock = new THREE.Clock();
const tmpVec = new THREE.Vector3();

function updatePlanet(o, dt){
  const p = o.data;
  if(!paused){
    o.theta += p.orbit * dt * timeScale * 0.5;
    o.spin += p.rot * dt * timeScale;
  }
  // 椭圆位置 (焦点在原点)
  const a = p.dist, e = p.ecc, b = a*Math.sqrt(1-e*e);
  const cx = -a*e;
  const x = cx + a*Math.cos(o.theta);
  const z = b*Math.sin(o.theta);
  o.group.position.set(x, 0, z);

  // 自转
  o.mesh.rotation.y = o.spin;

  // 尺寸过渡
  o.curScale += (o.targetScale - o.curScale) * Math.min(1, dt*4);
  o.mesh.scale.setScalar(Math.max(o.curScale, 0.02));
  if(o.ring){ o.ring.scale.setScalar(Math.max(o.curScale,0.02)); }

  // 标签位置
  o.label.position.set(0, Math.max(o.curScale,0.02)+0.7, 0);

  // 月球
  if(o.moonPivot){
    if(!paused) o.moonPivot.rotation.y += o.moonData.speed * dt * timeScale * 0.8;
  }

  // 轨迹
  if(showTrails && !paused && timeScale>0){
    const t = o.trail;
    // 在 pivot 局部坐标写入 (group.position 即为局部坐标)
    t.pos[t.head*3]=x; t.pos[t.head*3+1]=0; t.pos[t.head*3+2]=z;
    t.head=(t.head+1)%t.MAX;
    if(t.count<t.MAX) t.count++;
    // 重新排列为有序线段: 把环形缓冲拼成顺序
    const arr = t.pos;
    const ordered = new Float32Array(t.count*3);
    const start = (t.head - t.count + t.MAX)%t.MAX;
    for(let i=0;i<t.count;i++){
      const idx=(start+i)%t.MAX;
      ordered[i*3]=arr[idx*3]; ordered[i*3+1]=arr[idx*3+1]; ordered[i*3+2]=arr[idx*3+2];
    }
    t.line.geometry.setAttribute('position', new THREE.BufferAttribute(ordered,3));
    t.line.geometry.setDrawRange(0, t.count);
    t.line.geometry.attributes.position.needsUpdate=true;
  }
}

function updateCameraTween(dt){
  if(!tweening && !following) return;
  if(focused){
    // 获取目标世界坐标
    if(focused.isSun){ tmpVec.set(0,0,0); }
    else { focused.group.getWorldPosition(tmpVec); }
    if(tweening){
      // 同时插值相机位置与 target
      camera.position.lerp(tweenGoal.camPos, Math.min(1, dt*3));
      controls.target.lerp(tweenGoal.target, Math.min(1, dt*3));
      // 更新目标(行星在移动)
      tweenGoal.target.copy(tmpVec);
      if(camera.position.distanceTo(tweenGoal.camPos) < 0.5){
        tweening=false; following=true;
        infoFocus.classList.add('following'); infoFocus.textContent='取消跟随';
      }
    } else if(following){
      // 仅跟随 target，相机位置交给用户
      controls.target.lerp(tmpVec, Math.min(1, dt*6));
    }
  } else {
    // 重置过渡
    camera.position.lerp(tweenGoal.camPos, Math.min(1, dt*2.2));
    controls.target.lerp(tweenGoal.target, Math.min(1, dt*2.2));
    if(camera.position.distanceTo(tweenGoal.camPos) < 0.5){ tweening=false; }
  }
}

function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if(!paused) elapsed += dt*timeScale;

  // 太阳自转 + 光晕脉动
  sunMesh.rotation.y += dt*0.05*timeScale*(paused?0:1);
  const pulse = 1 + Math.sin(elapsed*0.6)*0.04;
  glow.scale.set(SUN.size*4.2*pulse, SUN.size*4.2*pulse, 1);
  glow2.scale.set(SUN.size*8*pulse, SUN.size*8*pulse, 1);

  // 星空缓慢自转
  stars.rotation.y += dt*0.003;

  planetObjs.forEach(o=>updatePlanet(o, dt));
  updateCameraTween(dt);

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

/* ============================================================
   尺寸适配
   ============================================================ */
function onResize(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

/* ============================================================
   启动
   ============================================================ */
function hideLoading(){
  const ld = document.getElementById('loading');
  ld.classList.add('hide');
  setTimeout(()=>ld.remove(), 900);
}

function showError(msg){
  const e = document.getElementById('error');
  e.classList.remove('hidden');
  e.innerHTML = `<div class="err-box"><h3>⚠ 加载失败</h3>${msg}<br><br>请检查网络后刷新页面。若处于受限网络，可能需要代理才能访问 Three.js CDN。</div>`;
}

window.addEventListener('error', (ev)=>{
  if(ev.message && /import|module|three/i.test(ev.message)){
    showError('三维引擎(Three.js)加载失败：' + ev.message);
  }
});

try {
  animate();
  // 短暂延迟以让首帧渲染
  setTimeout(hideLoading, 250);
} catch(err){
  showError(String(err));
}
