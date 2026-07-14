(function () {
  'use strict';

  // ---------- 基础场景搭建 ----------
  var container = document.getElementById('scene-container');
  var scene = new THREE.Scene();

  var BASE_FOV = 50;
  var camera = new THREE.PerspectiveCamera(
    BASE_FOV,
    container.clientWidth / container.clientHeight,
    0.1,
    2000
  );

  // 默认视角方向（俯仰角固定）；窄屏（手机竖屏）时同时放宽视场角并拉远相机，
  // 避免系统两侧/远端的行星被裁切出可视范围
  var DEFAULT_DIR = new THREE.Vector3(0, 42, 96).normalize();
  var BASE_DIST = 104.8; // 对应参考宽高比(16:9)下的相机距离
  var REFERENCE_ASPECT = 16 / 9;
  var DEFAULT_CAM_POS = new THREE.Vector3();

  function computeFov() {
    var aspect = container.clientWidth / container.clientHeight;
    if (aspect >= 1) return BASE_FOV;
    return Math.min(68, BASE_FOV + (1 - aspect) * 24);
  }

  function computeDefaultCamPos() {
    var aspect = container.clientWidth / container.clientHeight;
    var scaleFactor = 1;
    if (aspect < REFERENCE_ASPECT) {
      scaleFactor = Math.min(1.3, REFERENCE_ASPECT / Math.max(aspect, 0.3));
    }
    return DEFAULT_DIR.clone().multiplyScalar(BASE_DIST * scaleFactor);
  }
  camera.fov = computeFov();
  camera.updateProjectionMatrix();
  DEFAULT_CAM_POS.copy(computeDefaultCamPos());
  camera.position.copy(DEFAULT_CAM_POS);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // ---------- 控制器：限制缩放边界，防止失控缩放 / 飞出场景 ----------
  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 9;
  controls.maxDistance = 170;
  controls.target.set(0, 0, 0);
  controls.update();

  // ---------- 光照 ----------
  var ambient = new THREE.AmbientLight(0x445066, 0.55);
  scene.add(ambient);

  var sunLight = new THREE.PointLight(0xfff4d6, 2.1, 0, 0);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // ---------- 星空背景 ----------
  (function buildStarfield() {
    var starCount = 2200;
    var positions = new Float32Array(starCount * 3);
    for (var i = 0; i < starCount; i++) {
      var radius = 260 + Math.random() * 420;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.9,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85
    });
    var stars = new THREE.Points(geo, mat);
    scene.add(stars);
  })();

  // ---------- 太阳 ----------
  var sunGeo = new THREE.SphereGeometry(SUN_DATA.radius, 48, 48);
  var sunMat = new THREE.MeshBasicMaterial({ color: SUN_DATA.color });
  var sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.userData.isSun = true;
  sunMesh.userData.data = SUN_DATA;
  scene.add(sunMesh);

  // 太阳光晕（简单叠加半透明球体模拟辉光）
  var glowGeo = new THREE.SphereGeometry(SUN_DATA.radius * 1.35, 32, 32);
  var glowMat = new THREE.MeshBasicMaterial({
    color: 0xffcc33,
    transparent: true,
    opacity: 0.18,
    side: THREE.BackSide
  });
  var glowMesh = new THREE.Mesh(glowGeo, glowMat);
  sunMesh.add(glowMesh);

  // ---------- 行星、轨道、标签 ----------
  var planetObjects = []; // { data, mesh, group, angle, labelEl, orbitLine }
  var labelLayer = document.getElementById('label-layer');

  function makeOrbitLine(radiusVal) {
    var segments = 128;
    var points = [];
    for (var i = 0; i <= segments; i++) {
      var t = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(t) * radiusVal, 0, Math.sin(t) * radiusVal));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({
      color: 0x6f88b3,
      transparent: true,
      opacity: 0.38
    });
    return new THREE.LineLoop(geo, mat);
  }

  function makeRing(innerR, outerR, color, opacity) {
    var geo = new THREE.RingGeometry(innerR, outerR, 64);
    // RingGeometry 默认 UV 不适合径向渐变纹理，这里用简单半透明材质即可
    var mat = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: opacity,
      depthWrite: false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2 - 0.35; // 轻微倾斜，增强立体感
    return mesh;
  }

  PLANETS_DATA.forEach(function (data) {
    var orbitLine = makeOrbitLine(data.orbitRadius);
    scene.add(orbitLine);

    var group = new THREE.Group(); // 用于承载行星自身位置，便于自转与卫星挂载
    scene.add(group);

    var geo = new THREE.SphereGeometry(data.radius, 32, 32);
    var mat = new THREE.MeshStandardMaterial({
      color: data.color,
      emissive: data.emissive || 0x000000,
      emissiveIntensity: 0.5,
      roughness: 0.85,
      metalness: 0.05
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = data.tilt || 0;
    mesh.userData.data = data;
    group.add(mesh);

    if (data.hasRing) {
      var ring = makeRing(
        data.radius * 1.5,
        data.radius * (data.key === 'saturn' ? 2.5 : 1.9),
        data.ringColor || 0xd8c9a3,
        data.key === 'saturn' ? 0.85 : 0.35
      );
      ring.rotation.z = data.tilt || 0;
      group.add(ring);
    }

    if (data.hasMoon) {
      var moonGeo = new THREE.SphereGeometry(data.radius * 0.27, 16, 16);
      var moonMat = new THREE.MeshStandardMaterial({ color: 0xbfbfbf, roughness: 0.9 });
      var moonMesh = new THREE.Mesh(moonGeo, moonMat);
      var moonPivot = new THREE.Group();
      moonMesh.position.set(data.radius * 2.6, 0, 0);
      moonPivot.add(moonMesh);
      group.add(moonPivot);
      group.userData.moonPivot = moonPivot;
    }

    // 中文名称标签（HTML 叠加层，随 3D 位置投影更新）
    var labelEl = document.createElement('div');
    labelEl.className = 'planet-label';
    labelEl.textContent = data.name;
    labelLayer.appendChild(labelEl);

    var angle = Math.random() * Math.PI * 2;

    planetObjects.push({
      data: data,
      mesh: mesh,
      group: group,
      angle: angle,
      labelEl: labelEl,
      moonAngle: Math.random() * Math.PI * 2
    });
  });

  // 太阳标签
  var sunLabelEl = document.createElement('div');
  sunLabelEl.className = 'planet-label sun-label';
  sunLabelEl.textContent = SUN_DATA.name;
  labelLayer.appendChild(sunLabelEl);

  // ---------- 交互状态 ----------
  var state = {
    paused: false,
    timeScale: 1,
    selected: null, // planetObjects 中的一项，或 { mesh: sunMesh, data: SUN_DATA, group: null }
    focusing: false,
    focusStart: 0,
    focusDuration: 900,
    focusFromTarget: new THREE.Vector3(),
    focusFromCamPos: new THREE.Vector3(),
    focusDesiredDistance: 20
  };

  var clock = new THREE.Clock();

  // ---------- UI 元素 ----------
  var infoPanel = document.getElementById('info-panel');
  var infoTitle = document.getElementById('info-title');
  var infoSubtitle = document.getElementById('info-subtitle');
  var infoFacts = document.getElementById('info-facts');
  var infoClose = document.getElementById('info-close');
  var btnPause = document.getElementById('btn-pause');
  var btnReset = document.getElementById('btn-reset');
  var speedSlider = document.getElementById('speed-slider');
  var speedLabel = document.getElementById('speed-label');
  var guideHint = document.getElementById('guide-hint');

  function showInfo(name, subtitle, facts) {
    infoTitle.textContent = name;
    infoSubtitle.textContent = subtitle;
    infoFacts.innerHTML = '';
    facts.forEach(function (f) {
      var li = document.createElement('li');
      li.textContent = f;
      infoFacts.appendChild(li);
    });
    infoPanel.classList.add('visible');
    guideHint.classList.add('hidden');
  }

  function hideInfo() {
    infoPanel.classList.remove('visible');
  }

  function clearSelectionVisual() {
    planetObjects.forEach(function (p) {
      p.labelEl.classList.remove('selected');
    });
    sunLabelEl.classList.remove('selected');
  }

  function focusOn(target) {
    // target: planetObjects 中一项 或 { mesh: sunMesh, data: SUN_DATA }
    state.selected = target;
    clearSelectionVisual();
    if (target.labelEl) target.labelEl.classList.add('selected');
    else sunLabelEl.classList.add('selected');

    var subtitle;
    if (target.mesh === sunMesh) subtitle = '恒星 · ' + target.data.enName;
    else if (target.data.isDwarf) subtitle = '矮行星 · ' + target.data.enName;
    else subtitle = '行星 · ' + target.data.enName;
    showInfo(target.data.name, subtitle, target.data.facts);

    // 计算合适聚焦距离（保证不小于控制器 minDistance，避免被强制夹回）
    var r = target.data.radius;
    var desired = Math.max(9.8, Math.min(38, r * 7 + 5));
    state.focusDesiredDistance = desired;

    state.focusing = true;
    state.lockedTargetPrev = null; // 切换聚焦目标时重置跟随基准，避免相机瞬间跳变
    state.focusStart = clock.getElapsedTime();
    state.focusFromTarget.copy(controls.target);
    state.focusFromCamPos.copy(camera.position);
  }

  function deselect() {
    state.selected = null;
    state.focusing = false;
    clearSelectionVisual();
    hideInfo();
    guideHint.classList.remove('hidden');
  }

  function resetView() {
    state.selected = null;
    state.focusing = false;
    clearSelectionVisual();
    hideInfo();
    guideHint.classList.remove('hidden');

    // 平滑回到默认视角
    state.viewReset = {
      active: true,
      start: clock.getElapsedTime(),
      duration: 900,
      fromCamPos: camera.position.clone(),
      fromTarget: controls.target.clone()
    };
  }

  // ---------- 拾取（点击 / 触摸） ----------
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var pointerDownPos = null;

  function getPointerPos(evt) {
    var rect = renderer.domElement.getBoundingClientRect();
    var clientX = evt.clientX !== undefined ? evt.clientX : (evt.changedTouches && evt.changedTouches[0].clientX);
    var clientY = evt.clientY !== undefined ? evt.clientY : (evt.changedTouches && evt.changedTouches[0].clientY);
    return {
      x: ((clientX - rect.left) / rect.width) * 2 - 1,
      y: -((clientY - rect.top) / rect.height) * 2 + 1,
      clientX: clientX,
      clientY: clientY
    };
  }

  function onPointerDown(evt) {
    var p = getPointerPos(evt);
    pointerDownPos = { x: p.clientX, y: p.clientY };
  }

  function onPointerUp(evt) {
    if (!pointerDownPos) return;
    var p = getPointerPos(evt);
    var dx = p.clientX - pointerDownPos.x;
    var dy = p.clientY - pointerDownPos.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    pointerDownPos = null;
    if (dist > 6) return; // 视为拖拽，不触发点击拾取

    pointer.x = p.x;
    pointer.y = p.y;
    raycaster.setFromCamera(pointer, camera);

    var meshes = [sunMesh];
    planetObjects.forEach(function (po) { meshes.push(po.mesh); });
    var intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      var hit = intersects[0].object;
      if (hit === sunMesh) {
        focusOn({ mesh: sunMesh, data: SUN_DATA, labelEl: null });
      } else {
        var found = planetObjects.filter(function (po) { return po.mesh === hit; })[0];
        if (found) focusOn(found);
      }
    }
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown, { passive: true });
  renderer.domElement.addEventListener('pointerup', onPointerUp, { passive: true });

  // ---------- UI 事件 ----------
  btnPause.addEventListener('click', function () {
    state.paused = !state.paused;
    btnPause.textContent = state.paused ? '继续' : '暂停';
    btnPause.classList.toggle('active', state.paused);
  });

  btnReset.addEventListener('click', function () {
    resetView();
  });

  speedSlider.addEventListener('input', function () {
    var v = parseFloat(speedSlider.value);
    state.timeScale = v;
    speedLabel.textContent = 'x' + v.toFixed(1);
  });

  infoClose.addEventListener('click', function () {
    deselect();
  });

  // ---------- 动画循环 ----------
  var tmpV1 = new THREE.Vector3();
  var tmpV2 = new THREE.Vector3();

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function updatePlanets(delta) {
    var dt = state.paused ? 0 : delta * state.timeScale;
    planetObjects.forEach(function (p) {
      p.angle += p.data.speed * 0.06 * dt;
      var x = Math.cos(p.angle) * p.data.orbitRadius;
      var z = Math.sin(p.angle) * p.data.orbitRadius;
      p.group.position.set(x, 0, z);
      p.mesh.rotation.y += p.data.rotSpeed * dt * 0.6;

      if (p.group.userData.moonPivot) {
        p.moonAngle += dt * 1.8;
        p.group.userData.moonPivot.rotation.y = p.moonAngle;
      }
    });
    sunMesh.rotation.y += 0.02 * dt;
  }

  function updateFocus() {
    if (state.focusing && state.selected) {
      var now = clock.getElapsedTime();
      var t = (now - state.focusStart) / (state.focusDuration / 1000);
      var liveTarget = state.selected.group ? state.selected.group.position : sunMesh.position;

      if (t >= 1) {
        state.focusing = false;
      } else {
        var e = easeInOutCubic(Math.min(1, Math.max(0, t)));
        tmpV1.lerpVectors(state.focusFromTarget, liveTarget, e);
        controls.target.copy(tmpV1);

        // 相机沿“当前方向”插值到期望距离，保持用户视角方向感
        var dir = tmpV2.copy(state.focusFromCamPos).sub(state.focusFromTarget);
        if (dir.lengthSq() < 0.0001) dir.set(0, 0.4, 1);
        dir.normalize();
        var fromDist = state.focusFromCamPos.distanceTo(state.focusFromTarget);
        var curDist = fromDist + (state.focusDesiredDistance - fromDist) * e;
        camera.position.copy(tmpV1).addScaledVector(dir, curDist);
      }
    } else if (state.selected) {
      // 聚焦锁定：目标与相机一起平移相同增量，从而保持用户已调整好的观察角度和距离，
      // 同时确保被跟踪的行星（尤其是高速公转时）始终不会移出视野
      var lt2 = state.selected.group ? state.selected.group.position : sunMesh.position;
      if (state.lockedTargetPrev) {
        tmpV2.copy(lt2).sub(state.lockedTargetPrev);
        camera.position.add(tmpV2);
      } else {
        state.lockedTargetPrev = new THREE.Vector3();
      }
      controls.target.copy(lt2);
      state.lockedTargetPrev.copy(lt2);
    } else {
      state.lockedTargetPrev = null;
    }

    if (state.viewReset && state.viewReset.active) {
      var vr = state.viewReset;
      var now2 = clock.getElapsedTime();
      var t2 = (now2 - vr.start) / (vr.duration / 1000);
      if (t2 >= 1) {
        camera.position.copy(DEFAULT_CAM_POS);
        controls.target.set(0, 0, 0);
        vr.active = false;
      } else {
        var e2 = easeInOutCubic(Math.min(1, Math.max(0, t2)));
        camera.position.lerpVectors(vr.fromCamPos, DEFAULT_CAM_POS, e2);
        controls.target.lerpVectors(vr.fromTarget, new THREE.Vector3(0, 0, 0), e2);
      }
    }
  }

  // 标签清单：用于屏幕空间防重叠排布（避免行星标签与太阳/其他行星标签互相遮挡文字）
  var allLabelEntries = [{ el: sunLabelEl, worldPos: sunMesh.position, radius: SUN_DATA.radius }];
  planetObjects.forEach(function (p) {
    allLabelEntries.push({ el: p.labelEl, worldPos: p.group.position, radius: p.data.radius });
  });
  // 缓存每个标签的像素尺寸（内容固定不变，测量一次即可）
  allLabelEntries.forEach(function (entry) {
    entry.w = entry.el.offsetWidth || 40;
    entry.h = entry.el.offsetHeight || 20;
  });

  var labelTmp = new THREE.Vector3();
  var labelScratch = [];

  function updateLabels() {
    var halfW = container.clientWidth / 2;
    var halfH = container.clientHeight / 2;
    labelScratch.length = 0;

    allLabelEntries.forEach(function (entry) {
      labelTmp.copy(entry.worldPos);
      labelTmp.y += entry.radius + 0.9;
      labelTmp.project(camera);

      if (labelTmp.z > 1 || labelTmp.z < -1) {
        entry.el.style.display = 'none';
        return;
      }
      var x = labelTmp.x * halfW + halfW;
      var y = -labelTmp.y * halfH + halfH;
      if (x < -80 || x > container.clientWidth + 80 || y < -40 || y > container.clientHeight + 40) {
        entry.el.style.display = 'none';
        return;
      }
      entry.el.style.display = 'block';
      labelScratch.push({ entry: entry, x: x, y: y, dist: labelTmp.z });
    });

    // 按离相机远近排序：近的（更重要/更大概率是当前关注对象）优先保持原位，远的让位上移
    labelScratch.sort(function (a, b) { return a.dist - b.dist; });

    var placedRects = [];
    labelScratch.forEach(function (item) {
      var w = item.entry.w;
      var h = item.entry.h;
      var gap = 3;
      var y = item.y;
      var attempts = 0;
      while (attempts < 10) {
        var left = item.x - w / 2;
        var right = item.x + w / 2;
        var top = y - h;
        var bottom = y;
        var overlaps = false;
        for (var i = 0; i < placedRects.length; i++) {
          var r = placedRects[i];
          if (left < r.right + gap && right > r.left - gap && top < r.bottom + gap && bottom > r.top - gap) {
            overlaps = true;
            break;
          }
        }
        if (!overlaps) break;
        y -= h + gap; // 向上让位
        attempts++;
      }
      placedRects.push({ left: item.x - w / 2, right: item.x + w / 2, top: y - h, bottom: y });
      item.entry.el.style.transform = 'translate(-50%, -100%) translate(' + item.x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    var delta = Math.min(clock.getDelta(), 0.05);
    updatePlanets(delta);
    updateFocus();
    controls.update();
    updateLabels();
    renderer.render(scene, camera);
  }
  animate();

  // ---------- 响应式 ----------
  function onResize() {
    var w = container.clientWidth;
    var h = container.clientHeight;
    camera.aspect = w / h;
    camera.fov = computeFov();
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    DEFAULT_CAM_POS.copy(computeDefaultCamPos());
  }
  window.addEventListener('resize', onResize);

  // ---------- 加载提示消失 ----------
  var loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.classList.add('hidden');
    setTimeout(function () { loadingEl.parentNode && loadingEl.parentNode.removeChild(loadingEl); }, 500);
  }
})();
