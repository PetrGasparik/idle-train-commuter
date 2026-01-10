
# 🚂 Perimeter OS: DevLog (Simulation & Evolution)

## 🌌 Vision
Transforming the empty screen edge into a living, reactive ecosystem. The train is a digital organism dependent on hardware state and user behavior.

---

## 🎨 Visual Soul (Style Guide) - CRITICAL FOR CONSISTENCY
*Tato sekce definuje vizuální identitu projektu. Při jakékoliv změně kódu ji musíte dodržet:*

- **Atmosphere**: Dark Industrial Sci-Fi / High-Tech Minimal / Lo-Fi Overlay.
- **Color Palette**:
    - **Primary Base**: `slate-950` (95% opacity) s `backdrop-blur-3xl`.
    - **Accent Blue**: `blue-400` / `blue-500` (UI elements, glows).
    - **Status Colors**: Emerald-400 (Success/Energy), Amber-400 (Warning), Red-500 (Critical).
- **UI Architecture**:
    - **Panels**: Zaoblení `rounded-3xl`, tenké border linky `border-white/10`.
    - **Station (Command Post)**: Draggable hexagon/square hybrid, industrial style, small pulsing LEDs.
    - **Overseer Drone**: Small yellow/gold orb with a blue trailing light.
- **Train Aesthetic**: Top-down view. Minimalist geometric cars with glowing indicators.

---

## 🏗 Technical Architecture (Standard Practices)
*Klíčové principy pro stabilitu a výkon:*

- **Performance**: Všechny komponenty (`TrainCar`, `ControlPanel`, `Station`) MUSÍ být v `React.memo()`.
- **Electron Integration**: 
    - Používáme `setIgnoreMouseEvents(ignore, { forward: true })`.
    - Detekce myši je throttlovaná na 50ms interval v `App.tsx`.
    - Celý overlay je transparentní a `pointer-events-none`.
- **UX Bridge**: Implementována 300ms prodleva (Grace Period) pro skrytí menu při přechodu ze stanice na panel.
- **Resource Logic**: Běží v `useEffect` intervalu (150ms), zatímco animace vlaku běží přes `requestAnimationFrame` (60fps).

---

## 🗺 Roadmap of Arcs

### ✅ ARC I: Perception (Completed)
- [x] Basic perimeter movement.
- [x] Activity detection (Energy coupling).

### ✅ ARC II: Economy & Integration (Completed)
- [x] Draggable Command Post (Station).
- [x] Autonomous Overseer Drone (Direct intercept fueling).
- [x] Gemini Fabricator (AI Procedural Skins).

### ✅ ARC III: Architecture of the Wastes (Completed)
- [x] Mining & Residential Wagons.
- [x] Stability & Performance Patch (Memoization).

### ✅ ARC IV: Hardware Weather (Completed)
- [x] **CPU Storms**: High CPU load causes visual track distortion/glitches.
- [x] **RAM Fog**: High memory usage creates fog on edges, reducing visibility.
- [x] **Thermal Smoke**: Engine smoke color (Blue -> Orange -> Red) based on CPU temperature.

### 🌑 ARC V: Neural Core (Next)
- [ ] **AI Navigator**: Train reacts to specific active window titles (e.g., speed up in VS Code).
- [ ] **Adaptive Soundtrack**: Ambient procedural sounds based on train speed and scrap level.

---
*The train never sleeps; it only waits for your next keystroke.*
