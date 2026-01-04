<p align="center">
  <img src="assets/TFB-logo.png" alt="Throw For Broke Logo" width="420" />
</p>

<h1 align="center">🎯 Throw For Broke</h1>
<p align="center"><strong>Better Not Miss</strong></p>

---

## 🧠 About

**Throw For Broke** is a browser-based **roguelike darts game** where every throw is a risk and every miss hurts.

It blends:

- Real dartboard scoring
- A high-tension aiming system
- Roguelike progression and build potential

This is not a darts sim — it’s a **pressure game**.

---

## 🕹️ Core Gameplay Loop

- Each run is divided into **rounds**
- Each round gives you **9 darts**
- Each round has a **target score**

### Rules

- Hit or exceed the target → advance
- Fall short → run ends
- Every point **over** the target earns **coins**

Coins will later be used to buy charms that bend the rules of the game.

> Skill keeps you alive.  
> Overperformance makes you powerful.

---

## 🎯 Aiming System

Throw For Broke uses a **two-phase aiming mechanic**:

1. **Angle Phase**  
   A crosshair sweeps around the board.  
   Click / Space to lock the angle.

2. **Radius Phase**  
   The crosshair moves from bull to double (and beyond).  
   Click / Space again to lock distance.

Both phases include:

- Speed ramping
- Jitter (hand instability)
- The ability to **miss entirely**

Early runs feel shaky.  
Later runs can feel _surgically precise_.

---

## 🧮 Scoring

The dartboard is built **procedurally** with accurate scoring:

- Correct segment ordering (20, 1, 18, 4, …)
- Singles, doubles, triples
- Outer bull (25) and inner bull (50)
- Misses are possible and punished

Each throw produces a full hit result:

- Ring
- Segment
- Multiplier
- Total score
- Display label (e.g. `T20`, `D5`, `MISS`)

---

## 🔁 Roguelike Elements (In Progress)

- Increasing round difficulty
- Aggressive target scaling
- Coins reward high-skill play
- Planned charm system:
  - Modify aim behavior
  - Alter scoring rules
  - Create wild synergies

No meta progression yet — every run stands on its own.

---

## 🧱 Tech Stack

- **Vue 3** (Composition API)
- **Vite**
- **Three.js**
- **Pinia**
- **Tailwind CSS v4**
- Fully procedural geometry (no 3D models)

### Architecture Notes

- Rendering logic lives outside Vue components
- Game state is centralized in a run store
- UI derives state — it never mutates gameplay directly
- Scoring logic is deterministic and testable

---

## 🧪 Current State

✅ Procedural dartboard  
✅ Accurate scoring  
✅ Two-phase aiming with jitter  
✅ Run + round logic  
✅ HUD with throw history and totals  
✅ End-of-round overlay

🚧 Charm system  
🚧 Shop UI  
🚧 Throw animations & impact effects  
🚧 Audio feedback  
🚧 Difficulty tuning

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```
