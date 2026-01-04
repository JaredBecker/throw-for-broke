export type AimPhase = "aimAngle" | "aimRadius" | "locked";

export type Ring =
  | "MISS"
  | "BULL_INNER"
  | "BULL_OUTER"
  | "SINGLE"
  | "DOUBLE"
  | "TRIPLE";

export const COLORS = {
  // Board
  BOARD_BASE: 0x141015,
  RIM: 0x1b1b1b,
  NUMBER_RING: 0x09090c,

  // Segments
  PIE_BLACK: 0x0d0d0d,
  PIE_WHITE: 0xfae4b9,
  RING_RED: 0xe72e2b,
  RING_GREEN: 0x0d9537,

  // Wires / UI
  WIRE: 0xb7bcc0,
  CROSSHAIR: 0xffffff,
  MARKER: 0xffffff,
} as const;

export type Palette = typeof COLORS;

export type HitResult = {
  ring: Ring;
  segmentIndex: number; // 0..19 (0 = 20 at top)
  number: number; // 20,1,18,...
  multiplier: 0 | 1 | 2 | 3;
  total: number; // number * multiplier (bulls use 25/50)
  label: string; // e.g. "T20", "D5", "25", "50", "MISS"
};

// Dartboard order clockwise from top (20)
export const BOARD_NUMBERS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
] as const;

export type RunPhase = "aiming" | "round-complete" | "run-over";
