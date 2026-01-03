<template>
  <main class="game">
    <ThreeStage class="canvas" />

    <div class="hud">
      <h1>Run</h1>
      <p>Next: dartboard + crosshair timing mechanic</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import ThreeStage from "@/components/ThreeStage.vue";
</script>

<style scoped>
.game {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #080a10;
  overflow: hidden;
}

/* Three canvas fills the screen */
.canvas {
  position: absolute;
  inset: 0;
}

/* Simple HUD overlay */
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
