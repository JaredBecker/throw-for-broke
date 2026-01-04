<template>
  <main class="game" @click="onConfirm">
    <ThreeStage ref="stage" class="canvas" />

    <!-- LEFT HUD PANEL -->
    <aside
      class="w-[320px] h-full p-4 flex flex-col gap-4 bg-black/40 backdrop-blur-md border-r border-white/10 text-white select-none"
    >
      <!-- ROUND INFO -->
      <div class="mt-2 font-title">
        <div
          class="text-[40px] font-title leading-none text-nowrap text-center"
        >
          Round {{ round }}
        </div>
        <div class="text-center mt-2 opacity-80">
          Target:
          <span class="font-title">
            {{ targetScore }}
          </span>
        </div>
      </div>

      <!-- DARTS LEFT -->
      <div class="mt-4">
        <div class="text-lgs uppercase opacity-70 mb-2 font-title text-center">
          Darts Left | {{ dartsLeft }} / {{ maxDarts }}
        </div>
        <div class="flex gap-1 justify-center">
          <span
            v-for="i in maxDarts"
            :key="i"
            class="w-3 h-6 rounded-sm"
            :class="i <= dartsLeft ? 'bg-white' : 'bg-white/20'"
          />
        </div>
      </div>

      <!-- THROW HISTORY -->
      <div class="mt-4 flex-1 overflow-hidden">
        <div class="text-xl text-center uppercase opacity-70 mb-2 font-title">
          Throws
        </div>

        <ul class="flex flex-col gap-1 text-2xl">
          <li
            v-for="(throwItem, index) in uiThrows"
            :key="index"
            class="flex justify-between items-center p-2 rounded bg-white/5"
            :class="throwItem.highlight"
          >
            <div>
              <span class="font-title"> {{ throwCount - index }}. </span>
              <span class="font-title">{{ throwItem.label }}</span>
            </div>
            <span class="font-title">
              {{ throwItem.value }}
            </span>
          </li>

          <li v-if="uiThrows.length === 0" class="text-xs opacity-50 italic">
            No throws yet
          </li>
        </ul>
      </div>

      <!-- NEEDED / OVER -->
      <div class="mt-2 text-2xl text-center font-title leading-none">
        <div v-if="totalScore < targetScore">
          Needed
          <br />
          <span class="font-title text-red-400">
            + {{ targetScore - totalScore }} coins
          </span>
        </div>

        <div v-else>
          Over Target
          <br />
          <span class="font-title text-green-400">
            + {{ totalScore - targetScore }} coins
          </span>
        </div>
      </div>

      <!-- TOTAL -->
      <div class="mt-4">
        <div class="text-2xl text-center uppercase opacity-70 font-title">
          Total
        </div>
        <div class="text-4xl text-center font-title leading-none">
          {{ totalScore }}
        </div>
      </div>
    </aside>

    <!-- OVERLAY -->
    <div
      v-if="isOverlayOpen"
      class="absolute inset-0 z-50 flex items-center justify-center"
      @click.stop
    >
      <!-- backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <!-- card -->
      <div
        class="relative w-130 max-w-[90vw] rounded-3xl border border-white/10 bg-black/70 p-6 text-white shadow-2xl"
        @click.stop
      >
        <div class="font-title text-4xl leading-none">
          {{ phase === "round-complete" ? "Round Complete" : "Run Over" }}
        </div>

        <div class="mt-2 font-body opacity-80">
          {{
            phase === "round-complete"
              ? "You hit the target."
              : "You didn't reach the target."
          }}
        </div>

        <div class="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            class="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 font-body"
            @click.stop="onRestart"
          >
            Restart
          </button>

          <button
            v-if="phase === 'round-complete'"
            type="button"
            class="px-4 py-2 rounded-2xl bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 font-body"
            @click.stop="onNextRound"
          >
            Next Round
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import ThreeStage from "@/components/ThreeStage.vue";
import { useRunStore } from "@/stores/runStore";

const run = useRunStore();

const round = computed(() => run.round);
const targetScore = computed(() => run.targetScore);
const maxDarts = computed(() => run.dartsPerRound);
const dartsLeft = computed(() => run.dartsLeft);
const totalScore = computed(() => run.totalScore);

const throwCount = computed(() => run.throws.length);

const uiThrows = computed(() =>
  run.throws.map((t) => ({
    label: t.label,
    value: t.total,
    highlight:
      t.multiplier === 3
        ? "text-red-400"
        : t.multiplier === 2
        ? "text-green-400"
        : t.ring === "BULL_INNER" || t.ring === "BULL_OUTER"
        ? "text-yellow-400"
        : t.ring === "MISS"
        ? "opacity-50"
        : "",
  }))
);

const phase = computed(() => run.phase);

const isOverlayOpen = computed(
  () => phase.value === "round-complete" || phase.value === "run-over"
);

const coinsEarnedThisRound = computed(() =>
  Math.max(0, totalScore.value - targetScore.value)
);

const onNextRound = () => {
  run.startNextRound();
};

const onRestart = () => {
  // If you already have reset, use it. Otherwise add it to the store (see below)
  run.resetRun();
};

const stage = ref<InstanceType<typeof ThreeStage> | null>(null);

const onConfirm = () => {
  if (isOverlayOpen.value) return;

  stage.value?.confirm();
};

const onKeyDown = (e: KeyboardEvent) => {
  if (isOverlayOpen.value) return;

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
