/* ==========================================================================
   ELYON AI — three-scene.js
   Fondo 3D cinematográfico: una inteligencia artificial "viva".

   Capas de la escena (de dentro hacia fuera):
     1. Núcleo central de energía — icosaedro luminoso que late.
     2. Anillos holográficos orbitando el núcleo en distintos ejes.
     3. Red neuronal — nodos en profundidad conectados por aristas,
        con señales de activación viajando por ellas.
     4. Cubos digitales flotando lentamente (flujo de datos).
     5. Campo de partículas de fondo para dar profundidad.

   Interacción:
     • El cursor desplaza la cámara (parallax suave con inercia).
     • El scroll recorre el universo: la cámara viaja hacia el núcleo
       y luego lo sobrepasa, revelando las capas exteriores.

   Rendimiento:
     • Calidad adaptativa por dispositivo (nodos, pixel ratio, niebla).
     • Bloom real (post-procesado) SOLO en desktop potente; en el resto
       se simula con materiales aditivos — nunca cuelga un móvil.
     • Se pausa cuando la pestaña no es visible. Limpieza de GPU al salir.

   Robustez:
     • Si WebGL falla o THREE no carga, <body> recibe `no-webgl` y el CSS
       muestra un degradado estático premium. La web sigue 100% funcional.
   ========================================================================== */

(function () {
  'use strict';

  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  if (typeof THREE === 'undefined') {
    document.body.classList.add('no-webgl');
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    document.body.classList.add('no-webgl');
    return;
  }
  if (!renderer) {
    document.body.classList.add('no-webgl');
    return;
  }

  /* ============================================================
     Detección de gama del dispositivo
     ============================================================ */
  const isMobile = window.innerWidth < 768 || isCoarsePointer;

  // "Desktop potente": no móvil, buena densidad de CPU lógica y memoria.
  // navigator.deviceMemory y hardwareConcurrency no están en todos los
  // navegadores; cuando faltan, somos conservadores (no asumimos potencia).
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const isHighEnd = !isMobile && cores >= 8 && memory >= 8 && window.innerWidth >= 1280;

  const quality = {
    nodeCount: isMobile ? 55 : (isHighEnd ? 190 : 130),
    particleCount: isMobile ? 400 : (isHighEnd ? 1400 : 800),
    cubeCount: isMobile ? 6 : (isHighEnd ? 18 : 12),
    pixelRatio: Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2),
    fogEnabled: !isMobile,
    connectionDistance: isMobile ? 5.2 : 6.2,
    signalCount: isMobile ? 4 : (isHighEnd ? 12 : 8),
    ringCount: isMobile ? 2 : 3,
    postprocessing: isHighEnd,
  };

  renderer.setPixelRatio(quality.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  if (quality.postprocessing) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
  }

  const scene = new THREE.Scene();
  if (quality.fogEnabled) {
    scene.fog = new THREE.FogExp2(0x050505, 0.038);
  }

  const camera = new THREE.PerspectiveCamera(
    58, window.innerWidth / window.innerHeight, 0.1, 120
  );
  camera.position.set(0, 0, 14);

  // Grupo raíz: todo cuelga de aquí para poder aplicar deriva global.
  const world = new THREE.Group();
  scene.add(world);

  /* ============================================================
     Paleta compartida (coherente con las variables CSS del sitio)
     ============================================================ */
  const COLORS = {
    violet: new THREE.Color(0x7C5CFF),
    glow: new THREE.Color(0x8B5CF6),
    cyan: new THREE.Color(0x00D4FF),
    magenta: new THREE.Color(0xB94DFF),
    white: new THREE.Color(0xE8E4FF),
  };

  /* ============================================================
     Textura de glow radial reutilizable (para puntos y sprites)
     ============================================================ */
  function makeGlowTexture(inner, outer) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, inner);
    g.addColorStop(0.4, outer);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  const glowTex = makeGlowTexture('rgba(255,255,255,1)', 'rgba(160,140,255,0.55)');
  const coreGlowTex = makeGlowTexture('rgba(200,225,255,1)', 'rgba(124,92,255,0.5)');

  /* ============================================================
     1. NÚCLEO CENTRAL DE ENERGÍA
     Icosaedro wireframe + icosaedro sólido translúcido interior +
     sprite de glow envolvente. Late lentamente.
     ============================================================ */
  const coreGroup = new THREE.Group();
  world.add(coreGroup);

  const coreWireGeo = new THREE.IcosahedronGeometry(2.1, 1);
  const coreWireMat = new THREE.MeshBasicMaterial({
    color: COLORS.violet,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const coreWire = new THREE.Mesh(coreWireGeo, coreWireMat);
  coreGroup.add(coreWire);

  const coreInnerGeo = new THREE.IcosahedronGeometry(1.5, 2);
  const coreInnerMat = new THREE.MeshBasicMaterial({
    color: COLORS.cyan,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const coreInner = new THREE.Mesh(coreInnerGeo, coreInnerMat);
  coreGroup.add(coreInner);

  const coreGlowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: coreGlowTex,
    color: COLORS.glow,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  coreGlowSprite.scale.set(11, 11, 1);
  coreGroup.add(coreGlowSprite);

  /* ============================================================
     2. ANILLOS HOLOGRÁFICOS
     Toros finos en distintos ejes, girando lento alrededor del núcleo.
     ============================================================ */
  const rings = [];
  const ringConfigs = [
    { radius: 3.4, tube: 0.02, color: COLORS.cyan, tilt: [Math.PI / 2.2, 0, 0], speed: 0.12 },
    { radius: 4.2, tube: 0.016, color: COLORS.violet, tilt: [Math.PI / 1.7, Math.PI / 5, 0], speed: -0.09 },
    { radius: 5.1, tube: 0.014, color: COLORS.magenta, tilt: [Math.PI / 3, 0, Math.PI / 4], speed: 0.07 },
  ];
  for (let i = 0; i < quality.ringCount; i++) {
    const cfg = ringConfigs[i];
    const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 8, 120);
    const mat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.set(cfg.tilt[0], cfg.tilt[1], cfg.tilt[2]);
    ring.userData.speed = cfg.speed;
    coreGroup.add(ring);
    rings.push(ring);
  }

  /* ============================================================
     3. RED NEURONAL — nodos + aristas + señales
     Nodos en distribución gaussiana (densos al centro), rodeando el
     núcleo pero sin invadirlo.
     ============================================================ */
  const NODE_COUNT = quality.nodeCount;
  const bounds = { x: 15, y: 9, z: 8 };
  const nodePositions = [];
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  let guard = 0;
  while (nodePositions.length < NODE_COUNT && guard < NODE_COUNT * 12) {
    guard++;
    const v = new THREE.Vector3(gauss() * bounds.x, gauss() * bounds.y, (Math.random() - 0.5) * bounds.z * 2);
    if (v.length() < 3.0) continue; // no colocar nodos dentro del núcleo
    nodePositions.push(v);
  }

  const nodeGeometry = new THREE.BufferGeometry().setFromPoints(nodePositions);
  const nodeSizes = new Float32Array(nodePositions.length);
  for (let i = 0; i < nodePositions.length; i++) nodeSizes[i] = 0.06 + Math.random() * 0.1;
  nodeGeometry.setAttribute('size', new THREE.BufferAttribute(nodeSizes, 1));

  const nodeMaterial = new THREE.PointsMaterial({
    size: 0.38,
    map: glowTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0xC9BCFF,
    opacity: 1.0,
    sizeAttenuation: true,
  });
  const nodePoints = new THREE.Points(nodeGeometry, nodeMaterial);
  world.add(nodePoints);

  // Aristas entre vecinos cercanos (máx 3 por nodo: red legible)
  const edgePairs = [];
  const maxDist = quality.connectionDistance;
  for (let i = 0; i < nodePositions.length; i++) {
    let conn = 0;
    for (let j = i + 1; j < nodePositions.length; j++) {
      if (conn >= 3) break;
      if (nodePositions[i].distanceTo(nodePositions[j]) < maxDist) {
        edgePairs.push([i, j]);
        conn++;
      }
    }
  }
  const edgePositions = new Float32Array(edgePairs.length * 6);
  edgePairs.forEach(([i, j], idx) => {
    const a = nodePositions[i], b = nodePositions[j];
    edgePositions.set([a.x, a.y, a.z, b.x, b.y, b.z], idx * 6);
  });
  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x8A7AFF,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  world.add(edgeLines);

  // Señales viajando por las aristas
  const SIGNAL_COUNT = Math.min(quality.signalCount, edgePairs.length);
  const signalGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const signals = [];
  for (let s = 0; s < SIGNAL_COUNT; s++) {
    const mat = new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.95 });
    const mesh = new THREE.Mesh(signalGeo, mat);
    const e = Math.floor(Math.random() * edgePairs.length);
    signals.push({ mesh, from: nodePositions[edgePairs[e][0]], to: nodePositions[edgePairs[e][1]], progress: Math.random(), speed: 0.12 + Math.random() * 0.2 });
    world.add(mesh);
  }
  function respawnSignal(sig) {
    const e = Math.floor(Math.random() * edgePairs.length);
    sig.from = nodePositions[edgePairs[e][0]];
    sig.to = nodePositions[edgePairs[e][1]];
    sig.progress = 0;
    sig.speed = 0.12 + Math.random() * 0.2;
  }

  /* ============================================================
     4. CUBOS DIGITALES — flujo de datos flotante
     ============================================================ */
  const cubes = [];
  const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  for (let i = 0; i < quality.cubeCount; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? COLORS.cyan : COLORS.violet,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cube = new THREE.Mesh(cubeGeo, mat);
    cube.position.set((Math.random() - 0.5) * 26, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 12);
    cube.userData = {
      rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3),
      floatPhase: Math.random() * Math.PI * 2,
      floatAmp: 0.4 + Math.random() * 0.6,
      baseY: 0,
    };
    cube.userData.baseY = cube.position.y;
    world.add(cube);
    cubes.push(cube);
  }

  /* ============================================================
     5. CAMPO DE PARTÍCULAS DE FONDO — profundidad
     ============================================================ */
  const particleGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(quality.particleCount * 3);
  for (let i = 0; i < quality.particleCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 60;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 6;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const particleMat = new THREE.PointsMaterial({
    size: 0.1,
    map: glowTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0x99AAFF,
    opacity: 0.7,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  /* ============================================================
     POST-PROCESADO (Bloom) — solo desktop potente y si los plugins
     UMD están disponibles. Si no, render directo (con glow aditivo,
     que ya de por sí da un look luminoso).
     ============================================================ */
  let composer = null;
  function trySetupPostprocessing() {
    if (!quality.postprocessing) return false;
    const hasComposer = typeof THREE.EffectComposer === 'function'
      && typeof THREE.RenderPass === 'function'
      && typeof THREE.UnrealBloomPass === 'function';
    if (!hasComposer) return false;
    try {
      composer = new THREE.EffectComposer(renderer);
      composer.addPass(new THREE.RenderPass(scene, camera));
      const bloom = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.1,  // strength — más resplandor
        0.6,  // radius
        0.72  // threshold — captura más elementos luminosos
      );
      composer.addPass(bloom);
      composer.setPixelRatio(quality.pixelRatio);
      composer.setSize(window.innerWidth, window.innerHeight);
      return true;
    } catch (e) {
      composer = null;
      return false;
    }
  }
  trySetupPostprocessing();

  /* ============================================================
     Interacción: cursor (parallax) + scroll (recorrido de cámara)
     ============================================================ */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollProgress = 0;

  if (!isCoarsePointer) {
    window.addEventListener('mousemove', (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });
  }

  let scrollTicking = false;
  function updateScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? window.scrollY / max : 0;
    scrollTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollTicking) { requestAnimationFrame(updateScroll); scrollTicking = true; }
  }, { passive: true });

  /* ============================================================
     Visibilidad: pausa cuando la pestaña no se ve
     ============================================================ */
  let isRunning = true;
  const clock = new THREE.Clock();
  document.addEventListener('visibilitychange', () => {
    isRunning = document.visibilityState === 'visible';
    if (isRunning) clock.getDelta();
  });

  /* ============================================================
     Resize
     ============================================================ */
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (composer) composer.setSize(w, h);
  }
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  /* ============================================================
     Loop
     ============================================================ */
  function animate() {
    requestAnimationFrame(animate);
    if (!isRunning) return;

    const delta = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    // Parallax de cursor con inercia
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;

    if (!prefersReducedMotion) {
      // Recorrido de cámara por scroll: viaja hacia el núcleo (z baja)
      // y desciende ligeramente, "atravesando" el universo.
      const targetZ = 14 - scrollProgress * 9;
      camera.position.x += (pointer.x * 2.2 - camera.position.x) * 0.05;
      camera.position.y += ((pointer.y * 1.3 - scrollProgress * 3) - camera.position.y) * 0.05;
      camera.position.z += (targetZ - camera.position.z) * 0.05;
      camera.lookAt(0, -scrollProgress * 1.5, 0);

      // Deriva global lenta de la red
      world.rotation.y = Math.sin(t * 0.04) * 0.08 + scrollProgress * 0.4;
      world.rotation.x = Math.cos(t * 0.03) * 0.04;
    }

    // Núcleo: latido + rotación
    const beat = 1 + Math.sin(t * 1.2) * 0.05;
    coreWire.scale.setScalar(beat);
    coreInner.scale.setScalar(1 + Math.sin(t * 1.2 + 0.5) * 0.08);
    coreWire.rotation.y += delta * 0.15;
    coreWire.rotation.x += delta * 0.08;
    coreInner.rotation.y -= delta * 0.1;
    coreGlowSprite.material.opacity = 0.75 + Math.sin(t * 1.2) * 0.15;

    // Anillos girando
    rings.forEach((ring) => { ring.rotation.z += delta * ring.userData.speed; });

    // Nodos: pulso de tamaño con fase por índice
    const sizes = nodeGeometry.attributes.size;
    for (let i = 0; i < sizes.array.length; i++) {
      sizes.array[i] = nodeSizes[i] * (1 + 0.35 * Math.sin(t * 1.4 + i * 0.7));
    }
    sizes.needsUpdate = true;

    // Señales
    if (!prefersReducedMotion) {
      signals.forEach((sig) => {
        sig.progress += delta * sig.speed;
        if (sig.progress >= 1) respawnSignal(sig);
        sig.mesh.position.lerpVectors(sig.from, sig.to, sig.progress);
        const pulse = Math.sin(sig.progress * Math.PI);
        sig.mesh.material.opacity = 0.5 + pulse * 0.5;
        sig.mesh.scale.setScalar(0.7 + pulse * 0.7);
      });

      // Cubos: rotación + flotación
      cubes.forEach((cube) => {
        cube.rotation.x += delta * cube.userData.rotSpeed.x;
        cube.rotation.y += delta * cube.userData.rotSpeed.y;
        cube.rotation.z += delta * cube.userData.rotSpeed.z;
        cube.position.y = cube.userData.baseY + Math.sin(t * 0.5 + cube.userData.floatPhase) * cube.userData.floatAmp;
      });

      // Partículas: deriva vertical muy lenta
      particles.rotation.y = t * 0.01;
    }

    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  resize();
  animate();

  /* ============================================================
     Limpieza de GPU al descargar la página
     ============================================================ */
  window.addEventListener('pagehide', () => {
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    glowTex.dispose();
    coreGlowTex.dispose();
    if (composer) composer.dispose && composer.dispose();
    renderer.dispose();
  });
})();
