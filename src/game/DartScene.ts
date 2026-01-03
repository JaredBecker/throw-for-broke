import * as THREE from "three";

type AimPhase = "aimAngle" | "aimRadius" | "locked";

export class DartScene {
  // Board “game units”
  static readonly BOARD_RADIUS = 1.0;
  static readonly BOARD_THICKNESS = 0.12;

  private phase: AimPhase = "aimAngle";

  private theta = Math.PI / 2; // start at top (12 o'clock)
  private lockedTheta = this.theta;

  private r = 0;
  private lockedR = 0;

  private angleSpeed = 1.8; // radians/sec (we can scale difficulty later)
  private radiusSpeed = 1.2; // units/sec
  private radiusDir: 1 | -1 = 1;

  private lockTimer = 0;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Objects
  private board!: THREE.Mesh;
  private crosshair!: THREE.Mesh;
  private marker!: THREE.Mesh;

  // Small z offsets to avoid z-fighting
  private readonly zCrosshair = 0.08;
  private readonly zMarker = 0.07;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;

    this.setup();
  }

  private setup() {
    // Camera points at origin
    this.camera.lookAt(0, 0, 0);

    // Board disk (simple cylinder rotated so it faces camera)
    const geo = new THREE.CylinderGeometry(
      DartScene.BOARD_RADIUS,
      DartScene.BOARD_RADIUS,
      DartScene.BOARD_THICKNESS,
      96
    );

    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0.05,
    });

    this.board = new THREE.Mesh(geo, mat);
    this.board.rotation.x = Math.PI / 2; // axis -> Z, face camera
    this.board.position.set(0, 0, 0);
    this.scene.add(this.board);

    // A subtle rim so it reads as a physical object
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(DartScene.BOARD_RADIUS * 0.98, DartScene.BOARD_RADIUS, 96),
      new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.3 })
    );
    rim.position.z = DartScene.BOARD_THICKNESS / 2 + 0.001;
    this.scene.add(rim);

    // Crosshair (ring)
    this.crosshair = new THREE.Mesh(
      new THREE.RingGeometry(0.03, 0.05, 32),
      new THREE.MeshBasicMaterial({ color: 0xff3b1f, transparent: true, opacity: 0.95 })
    );
    this.scene.add(this.crosshair);

    // Marker dot (shows where the dart would land)
    this.marker = new THREE.Mesh(
      new THREE.CircleGeometry(0.02, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
    );
    this.marker.visible = false;
    this.scene.add(this.marker);

    // Start crosshair position
    this.updateCrosshairPosition();
  }

  /** Call each frame */
  update(dt: number) {
    // Basic “locked” pause then reset so you can keep testing
    if (this.phase === "locked") {
      this.lockTimer -= dt;
      if (this.lockTimer <= 0) this.resetAim();
      return;
    }

    if (this.phase === "aimAngle") {
      // Clockwise rotation: subtract theta
      this.theta -= this.angleSpeed * dt;

      // Keep theta bounded
      if (this.theta < -Math.PI) this.theta += Math.PI * 2;

      // In angle phase, we use a fixed radius near the outside
      this.r = DartScene.BOARD_RADIUS * 0.85;
    }

    if (this.phase === "aimRadius") {
      // Move radius in/out between bull(0) and double(outer edge)
      this.r += this.radiusDir * this.radiusSpeed * dt;

      if (this.r >= DartScene.BOARD_RADIUS) {
        this.r = DartScene.BOARD_RADIUS;
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
    if (this.phase === "aimAngle") {
      this.lockedTheta = this.theta;
      this.phase = "aimRadius";
      return;
    }

    if (this.phase === "aimRadius") {
      this.lockedR = this.r;
      this.phase = "locked";

      const p = this.polarToBoardPoint(this.lockedTheta, this.lockedR);
      this.marker.position.set(p.x, p.y, this.zMarker);
      this.marker.visible = true;

      // Hold marker briefly then reset
      this.lockTimer = 0.6;
    }
  }

  getPhase() {
    return this.phase;
  }

  private resetAim() {
    this.phase = "aimAngle";
    this.marker.visible = false;

    // Start next aim at top again (feel free to randomize later)
    this.theta = Math.PI / 2;
    this.lockedTheta = this.theta;
    this.r = DartScene.BOARD_RADIUS * 0.85;
    this.radiusDir = 1;

    this.updateCrosshairPosition();
  }

  private updateCrosshairPosition() {
    const t = this.phase === "aimRadius" ? this.lockedTheta : this.theta;
    const p = this.polarToBoardPoint(t, this.r);

    this.crosshair.position.set(p.x, p.y, this.zCrosshair);

    // Rotate crosshair slightly for vibe (optional)
    this.crosshair.rotation.z += 0.02;
  }

  private polarToBoardPoint(theta: number, r: number) {
    // Board is in XY plane facing camera.
    // Standard polar is CCW; we already made clockwise by subtracting theta in update.
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    return { x, y };
  }
}
