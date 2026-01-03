<template>
  <main class="page">
    <div class="content">
      <img class="logo" :src="logoUrl" alt="Throw for Broke logo" />

      <p class="tagline">
        A roguelike darts run where the target climbs… and the house wants you
        to miss.
      </p>

      <div class="actions">
        <button class="btn btn--primary" type="button" @click="onStart">
          <span class="btn__label">Start Run</span>
        </button>
        <button class="btn btn--secondary" type="button" @click="onHowTo">
          <span class="btn__label">How to Play</span>
        </button>
        <button class="btn btn--secondary" type="button" @click="onSettings">
          <span class="btn__label">Settings</span>
        </button>
      </div>

      <p class="footer">v0.0.1 • Throw For Broke</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import logoUrl from "@/assets/TFB-logo.png";
import { useRouter } from "vue-router";

const router = useRouter();

const onStart = () => router.push({ name: "game" });

const onHowTo = () => {
  console.log("How to Play");
};

const onSettings = () => {
  console.log("Settings");
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 48px 16px;
  background: #06070c;
  position: relative;
  overflow: hidden;
}

/* Blood haze + cold light */
.page::before {
  content: "";
  position: absolute;
  inset: -20%;
  background: radial-gradient(
      circle at 25% 25%,
      rgba(255, 40, 20, 0.18),
      transparent 40%
    ),
    radial-gradient(circle at 70% 60%, rgba(255, 0, 0, 0.1), transparent 45%),
    radial-gradient(
      circle at 50% 10%,
      rgba(255, 255, 255, 0.05),
      transparent 35%
    );
  filter: blur(24px);
  opacity: 0.9;
  pointer-events: none;
}

/* Vignette + grain */
.page::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
      circle at 50% 45%,
      transparent 35%,
      rgba(0, 0, 0, 0.85) 80%
    ),
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.02) 0px,
      rgba(255, 255, 255, 0.02) 1px,
      transparent 2px,
      transparent 4px
    );
  opacity: 0.55;
  mix-blend-mode: overlay;
  pointer-events: none;
}

.content {
  width: min(960px, 100%);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;

  position: relative;
  padding: 26px 18px;
  border-radius: 18px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.02)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 30, 10, 0.1);
}

/* subtle inner edge */
.content::before {
  content: "";
  position: absolute;
  inset: 8px;
  border-radius: 14px;
  border: 1px solid rgba(255, 70, 50, 0.14);
  pointer-events: none;
  opacity: 0.75;
}

.logo {
  width: min(860px, 100%);
  height: auto;
  user-select: none;

  filter: drop-shadow(0 18px 45px rgba(0, 0, 0, 0.85))
    drop-shadow(0 0 32px rgba(255, 40, 20, 0.25));
  transform: rotate(-0.6deg);
}

.tagline {
  max-width: 560px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 22px;
  line-height: 1.35;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.75);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 6px;
}

.footer {
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

@keyframes breathe {
  0% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.03);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.85;
  }
}

.page::before {
  animation: breathe 6s ease-in-out infinite;
}
</style>
