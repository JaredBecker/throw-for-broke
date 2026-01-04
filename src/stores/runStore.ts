import { HitResult, RunPhase } from "@/models";
import { defineStore } from "pinia";

export const useRunStore = defineStore("run", {
  state: () => ({
    round: 1,
    dartsPerRound: 9,
    dartsLeft: 9,
    targetScore: 75,
    throws: [] as HitResult[],
    coins: 0,
    phase: "aiming" as RunPhase,
  }),

  getters: {
    totalScore: (state) => state.throws.reduce((sum, t) => sum + t.total, 0),
    scoreNeeded: (state) =>
      Math.max(
        0,
        state.targetScore - state.throws.reduce((s, t) => s + t.total, 0)
      ),
    scoreOver: (state) =>
      Math.max(
        0,
        state.throws.reduce((s, t) => s + t.total, 0) - state.targetScore
      ),
  },

  actions: {
    submitThrow(hit: HitResult) {
      if (this.phase !== "aiming") return;
      if (this.dartsLeft <= 0) return;

      this.throws.unshift(hit);
      this.dartsLeft--;

      if (this.dartsLeft === 0) {
        const total = this.throws.reduce((s, t) => s + t.total, 0);

        if (total >= this.targetScore) {
          this.coins += total - this.targetScore;
          this.phase = "round-complete";
        } else {
          this.phase = "run-over";
        }
      }
    },

    resolveRound() {
      const total = this.totalScore;

      if (total >= this.targetScore) {
        this.coins += total - this.targetScore;
        this.state = "round-complete";
      } else {
        this.state = "run-over";
      }
    },

    startNextRound() {
      if (this.phase !== "round-complete") return;

      this.round += 1;

      // pick your ramp. this is a decent start:
      this.targetScore = Math.round(this.targetScore * 1.25);

      this.throws = [];
      this.dartsLeft = this.dartsPerRound;
      this.phase = "aiming";
    },

    resetRun() {
      this.round = 1;
      this.targetScore = 75; // set your desired starting target
      this.dartsPerRound = 9;
      this.dartsLeft = this.dartsPerRound;
      this.throws = [];
      this.coins = 0;
      this.phase = "aiming";
    },
  },
});
