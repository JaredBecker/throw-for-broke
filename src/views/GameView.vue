<template>
  <main class="game" @click="onConfirm">
    <ThreeStage ref="stage" class="canvas" />

    <div class="hud">
      <h1>Run</h1>
      <p>Click / Space: lock angle, then lock radius</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import ThreeStage from "@/components/ThreeStage.vue";

const stage = ref<InstanceType<typeof ThreeStage> | null>(null);

const onConfirm = () => {
  stage.value?.confirm();
};

const onKeyDown = (e: KeyboardEvent) => {
  if (e.code !== "Space") return;

  // prevent page scroll
  e.preventDefault();

  // ignore if user is typing in an input later
  const tag = (e.target as HTMLElement | null)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  onConfirm();
};

onMounted(() => window.addEventListener("keydown", onKeyDown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeyDown));
</script>

<style scoped>
.game {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #080a10;
  overflow: hidden;
}

.canvas {
  position: absolute;
  inset: 0;
}

.hud {
  position: absolute;
  top: 16px;
  left: 16px;
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}
</style>
