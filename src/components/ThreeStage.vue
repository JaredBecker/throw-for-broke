<template>
  <div ref="mountEl" class="three-stage" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import * as THREE from "three";

const mountEl = ref<HTMLDivElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let raf = 0;

function getSize() {
  const el = mountEl.value!;
  return { w: el.clientWidth || 1, h: el.clientHeight || 1 };
}

function resize() {
  if (!renderer || !camera || !mountEl.value) return;

  const { w, h } = getSize();
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

onMounted(() => {
  if (!mountEl.value) return;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  mountEl.value.appendChild(renderer.domElement);

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Basic lights (so materials look nice)
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(3, 5, 6);
  scene.add(dir);

  // Temporary visual so you know it’s working (we’ll replace with dartboard)
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1 })
  );
  scene.add(cube);

  // Start
  resize();
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();

  const tick = () => {
    raf = requestAnimationFrame(tick);

    const dt = clock.getDelta();
    cube.rotation.y += dt * 0.7;
    cube.rotation.x += dt * 0.4;

    renderer!.render(scene!, camera!);
  };

  tick();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  if (raf) cancelAnimationFrame(raf);

  // Dispose renderer + remove canvas
  if (renderer) {
    renderer.dispose();
    renderer.domElement.remove();
  }

  renderer = null;
  scene = null;
  camera = null;
});
</script>

<style scoped>
.three-stage {
  width: 100%;
  height: 100%;
}
</style>
