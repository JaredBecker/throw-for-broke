import { defineStore } from "pinia";

export type AimPhase = "aimAngle" | "aimRadius" | "throwing";

export const useRunStore = defineStore("run", {
  state: () => ({
    phase: "aimAngle" as AimPhase,
    throwsLeft: 3,
    round: 1,
    targetScore: 101,
    scoreThisRound: 0,
    lockedTheta: null as number | null,
    lockedR: null as number | null,
  }),
  actions: {
    resetRun() {
      this.phase = "aimAngle";
      this.throwsLeft = 3;
      this.round = 1;
      this.targetScore = 101;
      this.scoreThisRound = 0;
      this.lockedTheta = null;
      this.lockedR = null;
    },
    setPhase(phase: AimPhase) {
      this.phase = phase;
    },
    lockAngle(theta: number) {
      this.lockedTheta = theta;
      this.phase = "aimRadius";
    },
    lockRadius(r: number) {
      this.lockedR = r;
      this.phase = "throwing";
    },
  },
});
