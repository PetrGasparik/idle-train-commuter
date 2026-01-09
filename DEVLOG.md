# 🚂 Desktop Train Colony Sim - DevLog

## 🌌 Vision
Transforming the empty screen perimeter into a living, reactive ecosystem. The train is not just a decoration; it is an entity fueled by your digital energy, growing as you work.

---

## 📅 Roadmap

### ✅ Arc I: Perception
- **Status**: [COMPLETED]
- **Goal**: Establish the link between user activity and the machine.
- **Mechanics**:
  - `Input Harvesting`: [DONE] Keyboard = Energy, Mouse = Scrap.
  - `Dynamic Velocity`: [DONE] Train slows down and stops after 15s of inactivity.
  - `UI HUD`: [DONE] Real-time resource counters in the Control Panel.
  - `Stability`: [DONE] High-frequency ref-based state management for performance.

### 🟡 Arc II: Wagon Economy
- **Status**: [PLANNED]
- **Goal**: Specialization and growth.
- **Mechanics**:
  - `Wagon Upgrades`: [PLANNED] Spend Energy/Scrap to buy specialized cars (Coal, Batteries, Living Quarters).
  - `Idle Generation`: [PLANNED] Specific wagons generate resources passively even with low user activity.
  - `Biom Detection`: [PLANNED] Reaction to active application types (e.g., Code Editors vs. Browsers).
  - `Gemini Cargo`: [PLANNED] AI-generated cargo descriptions based on open window titles.

### 🟠 Arc III: Wasteland Architecture
- **Status**: [PLANNED]
- **Goal**: Establishing fixed points on the desktop "map".
- **Mechanics**:
  - `Stations`: [PLANNED] Corner buildings for cargo unloading.
  - `Trade Routes`: [PLANNED] Bonuses for completing loops between specific corners.
  - `Window Physics`: [PLANNED] Train "whistles" or reacts when passing near active window boundaries.

### 🔴 Arc IV: The Singularity
- **Status**: [PLANNED]
- **Goal**: Full autonomy and AI symbiosis.
- **Mechanics**:
  - `Daily Missions`: [PLANNED] Gemini-assigned tasks (e.g., "Write 1000 words to fill the Paper Wagon").
  - `Environmental Reactivity`: [PLANNED] Smoke color and train lights react to system audio or weather.
  - `Prestige System`: [PLANNED] "Reset" the colony for permanent multipliers.

---

## 📝 Change Log

### [Current]
- Fixed critical timing issues between `performance.now()` and `Date.now()`.
- Implemented smooth deceleration logic: Train now comes to a complete stop after 15 seconds of inactivity.
- Optimized resource harvesting to use `useRef` to prevent unnecessary React re-renders.
- Translated DevLog to English and established the Arc structure.

---
*The train never sleeps; it only waits for your next keystroke.*