import { AimPhase, BOARD_NUMBERS, COLORS, HitResult, Ring } from "@/models";
import { useRunStore } from "@/stores/runStore";
import * as THREE from "three";

export class DartScene {
  // Board “game units”
  static readonly BOARD_RADIUS = 1;
  static readonly BOARD_THICKNESS = 0.12;

  // Ring radii (game units; BOARD_RADIUS is the double outer edge)
  static readonly R_BULL_INNER = 0.035;
  static readonly R_BULL_OUTER = 0.075;

  // Triple ring (thinner than before)
  static readonly R_TRIPLE_INNER = 0.57;
  static readonly R_TRIPLE_OUTER = 0.64; // thickness 0.05 (~25% thinner than 0.07)

  // Double ring (about half previous thickness)
  static readonly R_DOUBLE_INNER = 0.93;
  static readonly R_DOUBLE_OUTER = 1.0; // thickness 0.07 (half-ish of 0.15)

  // Numbers area (out of bounds)
  static readonly R_NUM_INNER = 1.03;
  static readonly R_NUM_OUTER = 1.22;

  private boardGroup!: THREE.Group;

  private phase: AimPhase = "aimAngle";

  private theta = Math.PI / 2; // start at top (12 o'clock)
  private lockedTheta = this.theta;

  private r = 0;
  private lockedR = 0;

  private angleSpeed = 1.8; // radians/sec (we can scale difficulty later)
  private radiusSpeed = 1.2; // units/sec
  private radiusDir: 1 | -1 = 1;

  // ---- Aim tuning (difficulty knobs) ----
  // Speed ramping: speed increases the longer the player waits in each phase.
  // Units:
  //  - angle speeds are radians/second
  //  - radius speeds are board-units/second (board radius is ~1.0 in your scene)
  private angleSpeedMax = 6.0;
  private angleSpeedRamp = 0.9; // +rad/sec each second spent aiming angle

  private radiusSpeedMax = 4.0;
  private radiusSpeedRamp = 0.9; // +units/sec each second spent aiming radius

  // Allow the radius selector to go past the double ring so you can MISS.
  // (BOARD_RADIUS is effectively the double outer edge in this scene)
  private radiusMax = DartScene.BOARD_RADIUS * 1.18;

  // Jitter (adds a little “hand shake” / instability to aiming)
  private jitterThetaAmp = THREE.MathUtils.degToRad(4.0); // degrees -> radians
  private jitterThetaFreq = 7.5; // Hz-ish
  private jitterRAmp = DartScene.BOARD_RADIUS * 0.045;
  private jitterRFreq = 9.0;

  // JITTER PRESETS
  /**
  1) Rookie Hands (hard, but fair)
    Use this as your default “start of run” if you want people to still hit singles.
    jitterThetaAmp: 2.5°
    jitterThetaFreq: 6.5
    jitterRAmp: 0.030 * BOARD_RADIUS
    jitterRFreq: 8.0

  2) Shaky Tavern (roguelike spicy)
    This is where bull/triples start feeling like gambling.
    jitterThetaAmp: 4.0°
    jitterThetaFreq: 7.5
    jitterRAmp: 0.045 * BOARD_RADIUS
    jitterRFreq: 9.0

  3) Dumpster Fire (intentionally brutal start)
    Only use this if your early-game is meant to be hilarious/punishing.
    jitterThetaAmp: 6.5°
    jitterThetaFreq: 8.5
    jitterRAmp: 0.065 * BOARD_RADIUS
    jitterRFreq: 10.0
   */

  private aimAngleTime = 0;
  private aimRadiusTime = 0;
  private t = 0;
  private jitterSeedA = Math.random() * 1000;
  private jitterSeedB = Math.random() * 1000;

  private lockTimer = 0;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private isReady = false;

  // Objects
  private board!: THREE.Mesh;
  private crosshair: THREE.Mesh | null = null;
  private marker: THREE.Mesh | null = null;

  // Small z offsets to avoid z-fighting
  private readonly zCrosshair = 0.08;
  private readonly zMarker = 0.07;

  private runStore = useRunStore();

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;

    this.setup();
  }

  private setup() {
    this.boardGroup = new THREE.Group();
    this.scene.add(this.boardGroup);

    // Board disk (faces camera)
    const geo = new THREE.CylinderGeometry(
      DartScene.BOARD_RADIUS,
      DartScene.BOARD_RADIUS,
      DartScene.BOARD_THICKNESS,
      96
    );

    // Grimy “fiber/wood” feel via procedural canvas texture
    const boardTex = this.makeGrimeTexture();
    boardTex.wrapS = THREE.RepeatWrapping;
    boardTex.wrapT = THREE.RepeatWrapping;
    boardTex.repeat.set(2, 2);

    const mat = new THREE.MeshStandardMaterial({
      map: boardTex,
      roughness: 0.95,
      metalness: 0.05,
      color: new THREE.Color(COLORS.BOARD_BASE),
    });

    this.board = new THREE.Mesh(geo, mat);
    this.board.rotation.x = Math.PI / 2;
    this.board.position.set(0, 0, 0);
    this.boardGroup.add(this.board);

    // Front “face” subtle vignette so the board center feels deeper
    const faceMat = new THREE.MeshBasicMaterial({
      map: this.makeVignetteTexture(),
      transparent: true,
      opacity: 0.35, // was 0.95 (way too strong)
      depthTest: true,
      depthWrite: false,
    });

    const face = new THREE.Mesh(
      new THREE.CircleGeometry(DartScene.BOARD_RADIUS, 128),
      faceMat
    );

    // Put it close to the board, but BELOW wedges which sit at +0.004
    face.position.z = DartScene.BOARD_THICKNESS / 2 + 0.0015;
    face.renderOrder = 1;

    this.boardGroup.add(face);

    // Metal rim (darker, meaner)
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(
        DartScene.BOARD_RADIUS * 0.985,
        DartScene.BOARD_RADIUS,
        128
      ),
      new THREE.MeshStandardMaterial({
        roughness: 0.35,
        metalness: 0.55,
        color: new THREE.Color(COLORS.RIM),
      })
    );
    rim.position.z = DartScene.BOARD_THICKNESS / 2 + 0.003;
    this.boardGroup.add(rim);

    // ---------------------------
    // Real dartboard segments
    // ---------------------------
    const SEGMENTS = 20;
    const segSize = (Math.PI * 2) / SEGMENTS;

    // Dartboard order (clockwise from top) - for later when we render numbers/scoring
    const numbers = [...BOARD_NUMBERS];
    void numbers; // silence unused for now

    // Colors (grimy versions)
    const COL_BLACK = COLORS.PIE_BLACK;
    const COL_WHITE = COLORS.PIE_WHITE;
    const COL_RED = COLORS.RING_RED;
    const COL_GREEN = COLORS.RING_GREEN;

    // Single areas: bull outer -> triple inner, and triple outer -> double inner
    const rSingleInner0 = DartScene.R_BULL_OUTER;
    const rSingleInner1 = DartScene.R_TRIPLE_INNER;

    const rSingleOuter0 = DartScene.R_TRIPLE_OUTER;
    const rSingleOuter1 = DartScene.R_DOUBLE_INNER;

    for (let i = 0; i < SEGMENTS; i++) {
      // Start at top (12 o'clock) and go clockwise
      const center = Math.PI / 2 - i * segSize;
      const a0 = center - segSize / 2;
      const a1 = center + segSize / 2;

      // 20 (top) = black pie + red rings, alternating from there
      const pieColor = i % 2 === 0 ? COL_BLACK : COL_WHITE;
      const ringColor = i % 2 === 0 ? COL_RED : COL_GREEN;

      // Inner single
      this.boardGroup.add(
        this.makeWedge(rSingleInner0, rSingleInner1, a0, a1, pieColor)
      );

      // Triple ring
      this.boardGroup.add(
        this.makeWedge(
          DartScene.R_TRIPLE_INNER,
          DartScene.R_TRIPLE_OUTER,
          a0,
          a1,
          ringColor
        )
      );

      // Outer single
      this.boardGroup.add(
        this.makeWedge(rSingleOuter0, rSingleOuter1, a0, a1, pieColor)
      );

      // Double ring
      this.boardGroup.add(
        this.makeWedge(
          DartScene.R_DOUBLE_INNER,
          DartScene.R_DOUBLE_OUTER,
          a0,
          a1,
          ringColor
        )
      );
    }

    // Bulls
    this.boardGroup.add(
      this.makeRing(DartScene.R_BULL_INNER, DartScene.R_BULL_OUTER, COL_GREEN)
    );
    this.boardGroup.add(this.makeDisc(DartScene.R_BULL_INNER, COL_RED));

    // ---------------------------
    // Out-of-bounds numbers area
    // ---------------------------
    const numRing = new THREE.Mesh(
      new THREE.RingGeometry(DartScene.R_NUM_INNER, DartScene.R_NUM_OUTER, 160),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.NUMBER_RING),
        roughness: 0.6,
        metalness: 0.05,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      })
    );
    numRing.position.z = DartScene.BOARD_THICKNESS / 2 + 0.003;
    this.boardGroup.add(numRing);

    // ---------------------------
    // Board outer numbers
    // ---------------------------
    const rNum = (DartScene.R_NUM_INNER + DartScene.R_NUM_OUTER) / 2;
    const zNum = DartScene.BOARD_THICKNESS / 2 + 0.02;

    for (let i = 0; i < numbers.length; i++) {
      const center = Math.PI / 2 - i * segSize; // same angle logic as wedges
      const n = numbers[i];

      const spr = this.makeNumberSprite(n);
      spr.position.set(Math.cos(center) * rNum, Math.sin(center) * rNum, zNum);

      this.boardGroup.add(spr);
    }

    // ---------------------------
    // Wires (rings + spider)
    // ---------------------------

    // Circular wire rings
    this.boardGroup.add(this.makeWireRing(DartScene.R_DOUBLE_INNER));
    this.boardGroup.add(this.makeWireRing(DartScene.R_DOUBLE_OUTER * 0.995));
    this.boardGroup.add(this.makeWireRing(DartScene.R_TRIPLE_INNER));
    this.boardGroup.add(this.makeWireRing(DartScene.R_TRIPLE_OUTER));
    this.boardGroup.add(this.makeWireRing(DartScene.R_BULL_OUTER));
    this.boardGroup.add(this.makeWireRing(DartScene.R_BULL_INNER));

    // Radial spider wires (segment boundaries) – split like a real board
    for (let i = 0; i < SEGMENTS; i++) {
      const boundary = Math.PI / 2 - i * segSize - segSize / 2;

      // inner single
      this.boardGroup.add(
        this.makeRadialWireLine(
          boundary,
          DartScene.R_BULL_OUTER,
          DartScene.R_TRIPLE_INNER
        )
      );

      // triple band (so we see the divider inside the triples)
      this.boardGroup.add(
        this.makeRadialWireLine(
          boundary,
          DartScene.R_TRIPLE_INNER,
          DartScene.R_TRIPLE_OUTER
        )
      );

      // outer single + double
      this.boardGroup.add(
        this.makeRadialWireLine(
          boundary,
          DartScene.R_TRIPLE_OUTER,
          DartScene.R_DOUBLE_OUTER
        )
      );
    }

    // ---------------------------
    // Crosshair + Marker
    // ---------------------------
    const crossMat = new THREE.MeshBasicMaterial({
      color: COLORS.CROSSHAIR,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
    });

    this.crosshair = new THREE.Mesh(
      new THREE.RingGeometry(0.067, 0.076, 32),
      crossMat
    );
    this.crosshair.renderOrder = 999;
    this.boardGroup.add(this.crosshair);

    const markerMat = new THREE.MeshBasicMaterial({
      color: COLORS.MARKER,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
    });

    this.marker = new THREE.Mesh(
      new THREE.CircleGeometry(0.015, 24),
      markerMat
    );
    this.marker.renderOrder = 998;
    this.marker.visible = false;
    this.boardGroup.add(this.marker);

    // Place crosshair immediately once created
    this.updateCrosshairPosition();

    this.isReady = true;
  }

  /** Call each frame */
  update(dt: number) {
    this.t += dt;
    // Basic “locked” pause then reset so you can keep testing
    if (this.phase === "locked") {
      this.lockTimer -= dt;
      if (this.lockTimer <= 0) this.resetAim();
      return;
    }

    if (this.phase === "aimAngle") {
      // Clockwise rotation: subtract theta
      this.aimAngleTime += dt;
      this.aimRadiusTime = 0;

      const angleSpeedNow = Math.min(
        this.angleSpeedMax,
        this.angleSpeed + this.angleSpeedRamp * this.aimAngleTime
      );
      this.theta -= angleSpeedNow * dt;

      // Keep theta bounded
      if (this.theta < -Math.PI) this.theta += Math.PI * 2;

      // In angle phase, we use a fixed radius near the outside
      this.r = DartScene.BOARD_RADIUS * 0.85;
    }

    if (this.phase === "aimRadius") {
      // Move radius in/out between bull(0) and double(outer edge)
      this.aimRadiusTime += dt;
      this.aimAngleTime = 0;

      const radiusSpeedNow = Math.min(
        this.radiusSpeedMax,
        this.radiusSpeed + this.radiusSpeedRamp * this.aimRadiusTime
      );
      this.r += this.radiusDir * radiusSpeedNow * dt;

      if (this.r >= this.radiusMax) {
        this.r = this.radiusMax;
        this.radiusDir = -1;
      } else if (this.r <= 0) {
        this.r = 0;
        this.radiusDir = 1;
      }
    }

    this.updateCrosshairPosition();
  }

  /** One click / space: lock angle, then lock radius */
  confirm() {
    if (!this.isReady) return;

    if (this.phase === "aimAngle") {
      this.lockedTheta = this.theta + this.getThetaJitter();
      this.aimAngleTime = 0;
      this.phase = "aimRadius";
      return;
    }

    if (this.phase === "aimRadius") {
      this.lockedR = THREE.MathUtils.clamp(
        this.getRWithJitter(this.r),
        0,
        this.radiusMax
      );
      this.aimRadiusTime = 0;
      this.phase = "locked";

      const p = this.polarToBoardPoint(this.lockedTheta, this.lockedR);
      this.marker.position.set(p.x, p.y, this.zMarker);
      this.marker.visible = true;

      const hit = this.scoreFromPolar(this.lockedTheta, this.lockedR);
      this.runStore.submitThrow(hit);

      console.log("[HIT]", hit.label, "=", hit.total, hit);

      this.lockTimer = 1.5;
    }
  }

  getPhase() {
    return this.phase;
  }

  private resetAim() {
    this.phase = "aimAngle";
    if (this.marker) this.marker.visible = false;

    // Start next aim at top again (feel free to randomize later)
    this.theta = Math.PI / 2;
    this.lockedTheta = this.theta;

    this.r = DartScene.BOARD_RADIUS * 0.85;
    this.radiusDir = 1;

    this.aimAngleTime = 0;
    this.aimRadiusTime = 0;

    this.updateCrosshairPosition();
  }

  private updateCrosshairPosition() {
    if (!this.crosshair) return;

    const baseTheta =
      this.phase === "aimRadius" ? this.lockedTheta : this.theta;
    const theta = baseTheta + this.getThetaJitter();
    const r = this.getRWithJitter(this.r);
    const p = this.polarToBoardPoint(theta, r);

    this.crosshair.position.set(p.x, p.y, this.zCrosshair);

    // Rotate crosshair slightly for vibe (optional)
    this.crosshair.rotation.z += 0.02;
  }

  private getThetaJitter() {
    // Smooth-ish jitter using sin waves (no per-frame randomness/flicker)
    return (
      Math.sin(this.t * this.jitterThetaFreq + this.jitterSeedA) *
      this.jitterThetaAmp
    );
  }

  private getRWithJitter(r: number) {
    const jr =
      Math.sin(this.t * this.jitterRFreq + this.jitterSeedB) * this.jitterRAmp;
    return r + jr;
  }

  private polarToBoardPoint(theta: number, r: number) {
    // Board is in XY plane facing camera.
    // Standard polar is CCW; we already made clockwise by subtracting theta in update.
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    return { x, y };
  }

  private wrapAngle0To2Pi(a: number) {
    const twoPi = Math.PI * 2;
    a = a % twoPi;
    return a < 0 ? a + twoPi : a;
  }

  /**
   * Convert theta -> segment index (0..19)
   * Matches your board build: center = PI/2 - i*segSize (i=0 is 20 at top)
   */
  private segmentIndexFromTheta(theta: number) {
    const segSize = (Math.PI * 2) / 20;

    // delta is how far clockwise from top (PI/2) we are
    const delta = this.wrapAngle0To2Pi(Math.PI / 2 - theta);

    // add half-segment so boundary angles round to nearest segment
    const i = Math.floor((delta + segSize / 2) / segSize) % 20;
    return i;
  }

  private scoreFromPolar(theta: number, r: number): HitResult {
    // Miss if outside board (beyond double outer)
    if (r > DartScene.R_DOUBLE_OUTER) {
      return {
        ring: "MISS",
        segmentIndex: -1,
        number: 0,
        multiplier: 0,
        total: 0,
        label: "MISS",
      };
    }

    // Bulls
    if (r <= DartScene.R_BULL_INNER) {
      return {
        ring: "BULL_INNER",
        segmentIndex: -1,
        number: 50,
        multiplier: 1,
        total: 50,
        label: "50",
      };
    }

    if (r <= DartScene.R_BULL_OUTER) {
      return {
        ring: "BULL_OUTER",
        segmentIndex: -1,
        number: 25,
        multiplier: 1,
        total: 25,
        label: "25",
      };
    }

    const segIndex = this.segmentIndexFromTheta(theta);
    const num = BOARD_NUMBERS[segIndex];

    // Ring / multiplier
    let ring: Ring = "SINGLE";
    let mult: 0 | 1 | 2 | 3 = 1;

    if (r >= DartScene.R_DOUBLE_INNER && r <= DartScene.R_DOUBLE_OUTER) {
      ring = "DOUBLE";
      mult = 2;
    } else if (r >= DartScene.R_TRIPLE_INNER && r <= DartScene.R_TRIPLE_OUTER) {
      ring = "TRIPLE";
      mult = 3;
    } else {
      ring = "SINGLE";
      mult = 1;
    }

    const total = num * mult;
    const prefix = ring === "DOUBLE" ? "D" : ring === "TRIPLE" ? "T" : "";
    const label = `${prefix}${num}`;

    return {
      ring,
      segmentIndex: segIndex,
      number: num,
      multiplier: mult,
      total,
      label,
    };
  }

  private makeRing(inner: number, outer: number, color: number) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 128),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.9,
        metalness: 0.05,
        transparent: true,
        opacity: 0.92,
      })
    );
    mesh.position.z = DartScene.BOARD_THICKNESS / 2 + 0.004;
    return mesh;
  }

  private makeDisc(r: number, color: number) {
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(r, 64),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.9,
        metalness: 0.02,
      })
    );
    mesh.position.z = DartScene.BOARD_THICKNESS / 2 + 0.004;
    return mesh;
  }

  private makeWireRing(r: number) {
    const segments = 220;
    const pts: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(t) * r,
          Math.sin(t) * r,
          DartScene.BOARD_THICKNESS / 2 + 0.012
        )
      );
    }

    const geo = new THREE.BufferGeometry().setFromPoints(pts);

    const mat = new THREE.LineBasicMaterial({
      color: COLORS.WIRE,
      transparent: true, // OK for lines
      opacity: 0.75, // don't overpower wedges
      toneMapped: false,
    });

    const line = new THREE.Line(geo, mat);
    line.renderOrder = 90;
    return line;
  }

  private makeWedge(
    inner: number,
    outer: number,
    a0: number,
    a1: number,
    color: number
  ) {
    const thetaStart = a0;
    const thetaLength = a1 - a0;

    const geo = new THREE.RingGeometry(
      inner,
      outer,
      64, // thetaSegments (smooth arc)
      1, // phiSegments
      thetaStart,
      thetaLength
    );

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.92,
      metalness: 0.02,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.98,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = DartScene.BOARD_THICKNESS / 2 + 0.004;
    return mesh;
  }

  private makeRadialWireLine(a: number, r0: number, r1: number) {
    const x0 = Math.cos(a) * r0;
    const y0 = Math.sin(a) * r0;
    const x1 = Math.cos(a) * r1;
    const y1 = Math.sin(a) * r1;

    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x0, y0, DartScene.BOARD_THICKNESS / 2 + 0.012),
      new THREE.Vector3(x1, y1, DartScene.BOARD_THICKNESS / 2 + 0.012),
    ]);

    const mat = new THREE.LineBasicMaterial({
      color: COLORS.WIRE, // steel, not white
      transparent: true, // OK for lines
      opacity: 0.75, // don't overpower wedges
      toneMapped: false,
    });

    const line = new THREE.Line(geo, mat);
    line.renderOrder = 100;
    line.frustumCulled = false;

    return line;
  }

  private makeGrimeTexture() {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;

    // Base
    ctx.fillStyle = "#0b0a0d";
    ctx.fillRect(0, 0, size, size);

    // Fiber streaks
    for (let i = 0; i < 1400; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const w = 10 + Math.random() * 40;
      const a = 0.02 + Math.random() * 0.06;
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + (Math.random() - 0.5) * 6);
      ctx.stroke();
    }

    // Dark grime blobs
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 10 + Math.random() * 45;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(0,0,0,0.0)");
      g.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle blood tint
    const blood = ctx.createRadialGradient(
      size * 0.35,
      size * 0.3,
      0,
      size * 0.35,
      size * 0.3,
      size * 0.8
    );
    blood.addColorStop(0, "rgba(255,30,10,0.10)");
    blood.addColorStop(1, "rgba(255,30,10,0)");
    ctx.fillStyle = blood;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  private makeNumberSprite(value: number) {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, size, size);

    // White number with dark outline
    ctx.font = "bold 160px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.lineWidth = 18;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.strokeText(String(value), size / 2, size / 2);

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillText(String(value), size / 2, size / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      toneMapped: false,
      depthTest: true,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(mat);

    // Tweak this for size
    sprite.scale.set(0.16, 0.16, 1);

    return sprite;
  }

  private makeVignetteTexture() {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;

    ctx.clearRect(0, 0, size, size);

    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.15,
      size / 2,
      size / 2,
      size * 0.55
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // Tiny specks
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const a = Math.random() * 0.06;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(x, y, 1, 1);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }
}
