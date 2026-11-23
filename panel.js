const host = document.querySelector("#panel-scene");
const lightweight = matchMedia(
  "(max-width: 700px), (prefers-reduced-motion: reduce)",
);
let dispose;
let generation = 0;
async function selectRenderer() {
  const revision = ++generation;
  dispose?.();
  dispose = null;
  if (!host || lightweight.matches || navigator.connection?.saveData) return;
  try {
    const THREE = await import("./vendor/three.module.min.js");
    if (revision === generation) dispose = build(THREE);
  } catch {
    // The CSS illustration stays visible when WebGL is unavailable.
  }
}
lightweight.addEventListener("change", selectRenderer);
selectRenderer();

function panelGlass(T) {
  const c = document.createElement("canvas");
  c.width = 768;
  c.height = 1280;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#9facb3";
  ctx.fillRect(0, 0, c.width, c.height);
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 6; col++) {
      const x = col * 128 + 1,
        y = row * 128 + 1;
      const tint = Math.round(5 * Math.sin(row * 2 + col * 3));
      const crystal = ctx.createLinearGradient(x, y, x + 126, y + 126);
      crystal.addColorStop(0, "rgb(" + [35 + tint, 53 + tint, 72 + tint] + ")");
      crystal.addColorStop(1, "rgb(" + [17 + tint, 34 + tint, 52 + tint] + ")");
      ctx.fillStyle = crystal;
      ctx.beginPath();
      ctx.roundRect(x, y, 126, 126, 5);
      ctx.fill();
      ctx.fillStyle = "#b6d0dc55";
      for (let i = 3; i < 125; i += 4) ctx.fillRect(x + 4, y + i, 118, 1);
      ctx.fillStyle = "#cadbe183";
      for (let i = 20; i < 124; i += 42) ctx.fillRect(x + i, y + 2, 1.5, 122);
    }
  }
  const sky = ctx.createLinearGradient(0, c.height, c.width, 0);
  sky.addColorStop(0, "#10263128");
  sky.addColorStop(0.49, "#cee4ed02");
  sky.addColorStop(0.73, "#ccdce735");
  sky.addColorStop(1, "#cee4ed08");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, c.width, c.height);
  const map = new T.CanvasTexture(c);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

function build(T) {
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(29, 1, 0.1, 70);
  scene.add(new T.HemisphereLight(0xf2fbff, 0x7e8986, 2.3));
  const sunlight = new T.DirectionalLight(0xfff2d4, 2.9);
  sunlight.position.set(-1, 9, 2);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  sunlight.shadow.camera.far = 20;
  sunlight.shadow.normalBias = 0.018;
  scene.add(sunlight);
  const ground = new T.Mesh(
    new T.PlaneGeometry(35, 35),
    new T.ShadowMaterial({ opacity: 0.095 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.005;
  ground.receiveShadow = true;
  scene.add(ground);
  const group = new T.Group();
  scene.add(group);
  const frame = new T.MeshStandardMaterial({
    color: 0xb9c2c7,
    metalness: 0.46,
    roughness: 0.32,
  });
  const trim = new T.MeshStandardMaterial({
    color: 0x26323a,
    metalness: 0.28,
    roughness: 0.5,
  });
  const glassMap = panelGlass(T);
  const glass = new T.MeshPhysicalMaterial({
    map: glassMap,
    roughness: 0.38,
    clearcoat: 0.65,
    clearcoatRoughness: 0.28,
    metalness: 0.12,
  });
  function box(parent, w, h, d, material, x, y, z) {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    mesh.castShadow = true;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  const width = 1.83,
    height = 3.13;
  const tilt = -0.9;
  for (const center of [-0.94, 0.94]) {
    const module = new T.Group();
    group.add(module);
    module.position.set(center, 1.23, 0);
    module.rotation.x = tilt;
    box(module, width, height, 0.08, frame, 0, 0, 0);
    box(module, width - 0.038, height - 0.038, 0.014, trim, 0, 0, 0.043);
    const surface = new T.Mesh(
      new T.PlaneGeometry(width - 0.055, height - 0.055),
      glass,
    );
    surface.position.z = 0.052;
    module.add(surface);
    for (const offset of [-0.59, 0.59]) {
      for (const depth of [-0.93, 0.91]) {
        const supportHeight = 1.23 + depth / Math.tan(tilt) - 0.07;
        box(
          group,
          0.047,
          supportHeight,
          0.065,
          frame,
          center + offset,
          supportHeight / 2,
          depth,
        );
      }
      box(group, 0.09, 0.055, 2.18, trim, center + offset, 0.036, 0);
    }
  }
  host.append(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");
  let raf = 0,
    visible = true;
  const start = performance.now();
  function requestDraw() {
    if (visible && !raf) raf = requestAnimationFrame(draw);
  }
  function draw(now) {
    raf = 0;
    const entry = Math.min(1, (now - start) / 950);
    const eased = 1 - (1 - entry) ** 3;
    const section = host.closest("section") || host;
    const progress = Math.max(
      0,
      Math.min(1, -section.getBoundingClientRect().top / section.offsetHeight),
    );
    group.rotation.y = -0.28 + progress * 0.53 - (1 - eased) * 0.22;
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    const distance =
      Math.max(1, 1.14 / camera.aspect) * (1.05 - 0.12 * progress);
    camera.position.set(
      3.4 * distance,
      (4.2 + progress * 0.7) * distance,
      6.9 * distance,
    );
    camera.lookAt(0, 1.13, 0);
    camera.updateProjectionMatrix();
    sunlight.position.x = -1 + 3 * progress;
    renderer.render(scene, camera);
    host.setAttribute("data-rendered", "");
    if (entry < 1) requestDraw();
  }
  const resize = new ResizeObserver(() => {
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    requestDraw();
  });
  resize.observe(host);
  const viewport = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestDraw();
  });
  viewport.observe(host);
  window.addEventListener("scroll", requestDraw, { passive: true });
  function lostContext(e) {
    e.preventDefault();
    visible = false;
    cancelAnimationFrame(raf);
    host.removeAttribute("data-rendered");
  }
  renderer.domElement.addEventListener("webglcontextlost", lostContext);
  return () => {
    resize.disconnect();
    viewport.disconnect();
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", requestDraw);
    renderer.domElement.removeEventListener("webglcontextlost", lostContext);
    group.traverse((o) => o.geometry?.dispose());
    [
      ground.geometry,
      ground.material,
      sunlight.shadow,
      glassMap,
      glass,
      trim,
      frame,
      renderer,
    ].forEach((o) => o.dispose());
    renderer.domElement.remove();
    host.removeAttribute("data-rendered");
  };
}
