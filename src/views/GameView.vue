<template>
  <main class="game" @click="onConfirm">
    <ThreeStage ref="stage" class="canvas" />

    <!-- LEFT HUD PANEL -->
    <aside
      class="w-[320px] h-full p-4 flex flex-col gap-4 bg-black/40 backdrop-blur-md border-r border-white/10 text-white select-none font-body"
    >
      <!-- RUN HEADER -->
      <div class="text-xs uppercase tracking-widest opacity-70 font-title">
        Run
      </div>
      <div class="text-sm italic opacity-80">
        Click / Space: lock angle → lock radius
      </div>

      <!-- ROUND INFO -->
      <div class="mt-2">
        <div class="text-2xl font-title leading-none">Round {{ round }}</div>
        <div class="text-sm opacity-80">
          Target:
          <span class="font-title">
            {{ targetScore }}
          </span>
        </div>
      </div>

      <!-- DARTS LEFT -->
      <div class="mt-4">
        <div class="text-xs uppercase opacity-70 mb-1 font-title">
          Darts Left
        </div>

        <div class="flex gap-1">
          <span
            v-for="i in maxDarts"
            :key="i"
            class="w-3 h-6 rounded-sm"
            :class="i <= dartsLeft ? 'bg-white' : 'bg-white/20'"
          />
        </div>

        <div class="text-sm opacity-80 mt-1">
          {{ dartsLeft }} / {{ maxDarts }}
        </div>
      </div>

      <!-- THROW HISTORY -->
      <div class="mt-4 flex-1 overflow-hidden">
        <div class="text-xs uppercase opacity-70 mb-2 font-title">Throws</div>

        <ul class="flex flex-col gap-1 text-sm">
          <li
            v-for="(throwItem, index) in throws"
            :key="index"
            class="flex justify-between items-center px-2 py-1 rounded bg-white/5"
            :class="throwItem.highlight"
          >
            <span>
              {{ throws.length - index }}.
              {{ throwItem.label }}
            </span>
            <span class="font-title">
              {{ throwItem.value }}
            </span>
          </li>

          <li v-if="throws.length === 0" class="text-xs opacity-50 italic">
            No throws yet
          </li>
        </ul>
      </div>

      <!-- TOTAL -->
      <div class="mt-4">
        <div class="text-xs uppercase opacity-70 font-title">Total</div>
        <div class="text-4xl font-title leading-none">
          {{ totalScore }}
        </div>
      </div>

      <!-- NEEDED / OVER -->
      <div class="mt-2 text-sm">
        <div v-if="totalScore < targetScore">
          Needed
          <span class="font-title text-red-400">
            + {{ targetScore - totalScore }}
          </span>
        </div>

        <div v-else>
          Over Target
          <span class="font-title text-green-400">
            + {{ totalScore - targetScore }} coins
          </span>
        </div>
      </div>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import ThreeStage from "@/components/ThreeStage.vue";

const round = ref(3);
const targetScore = ref(120);

const maxDarts = 9;
const dartsLeft = ref(6);

const throws = ref([
  { label: "20 x 3", value: 60, highlight: "text-red-400" },
  { label: "19", value: 19, highlight: "" },
  { label: "MISS", value: 0, highlight: "opacity-50" },
]);

const totalScore = ref(throws.value.reduce((a, b) => a + b.value, 0));

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
