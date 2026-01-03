<template>
  <div ref="mountEl" class="three-stage" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import * as THREE from "three";
import { DartScene } from "@/game/DartScene";

const mountEl = ref<HTMLDivElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let raf = 0;

let dartScene: DartScene | null = null;

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

function confirm() {
  dartScene?.confirm();
}

defineExpose({ confirm });

onMounted(async () => {
  if (!mountEl.value) return;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  mountEl.value.appendChild(renderer.domElement);

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 3.2);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 1.25);
  dir.position.set(1.8, 2.6, 3.5);
  scene.add(dir);

  // Subtle red under glow for ominous vibe
  const red = new THREE.PointLight(0xff2a18, 0.6, 10);
  red.position.set(-1.5, -1.2, 2.2);
  scene.add(red);

  // Wait for fonts to load to prevent layout shift
  await (document as any).fonts?.ready;

  // Our game scene/controller
  dartScene = new DartScene(scene, camera);

  // Start
  resize();
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();

  const tick = () => {
    raf = requestAnimationFrame(tick);

    const dt = clock.getDelta();
    dartScene?.update(dt);

    renderer!.render(scene!, camera!);
  };

  tick();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  if (raf) cancelAnimationFrame(raf);

  if (renderer) {
    renderer.dispose();
    renderer.domElement.remove();
  }

  renderer = null;
  scene = null;
  camera = null;
  dartScene = null;
});
</script>

<style scoped>
.three-stage {
  width: 100%;
  height: 100%;
}
</style>
