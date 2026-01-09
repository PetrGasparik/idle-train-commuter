# 🚂 Desktop Train Colony Sim - DevLog

## 🌌 Vision
Transforming the empty screen perimeter into a living, reactive ecosystem. The train is not just a decoration; it is an entity fueled by your digital energy, growing as you work.

---

## 📅 Roadmap

### ✅ Arc I: Perception
- **Status**: [COMPLETED]
- **Goal**: Establish the link between user activity and the machine.

### 🟡 Arc II: Wagon Economy & UI UX
- **Status**: [IN PROGRESS]
- **Goal**: Specialization, growth, and polished interaction.
- **Mechanics**:
  - `Stealth UI`: [DONE] Draggable anchor and panel logic.
  - `Desktop Simulator`: [DONE] Web-only environment for easier testing and preview.
  - `Focus Awareness`: [NEW] The app now detects when it's in the background.
  - `Wagon Upgrades`: [PLANNED] Spend Energy/Scrap to buy specialized cars.
  - `Idle Generation`: [PLANNED] Specific wagons generate resources passively.

### 🟠 Arc III: Wasteland Architecture
- **Status**: [PLANNED]

### 🔴 Arc IV: The Singularity
- **Status**: [PLANNED]

---

## 📝 Change Log

### [Current]
- **Attention Sensor**: Added IPC listeners for window focus/blur events. The console now tracks when the user is working in other apps.
- **Improved Idle Cruise**: Enhanced the speed decay logic. The train now maintains a base "cruising speed" when the user is focused elsewhere, ensuring it never feels dead.
- **Global Hook Note**: Acknowledged limitation. Real "Bongo Cat" style global input requires native `uiohook` modules which are restricted in the current cloud-based build environment. Implementing focus-based awareness as a high-performance alternative.

---
*The train never sleeps; it only waits for your next keystroke.*