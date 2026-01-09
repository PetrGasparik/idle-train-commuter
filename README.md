# 🚂 Desktop Train Perimeter Sim

An aesthetic, high-performance desktop overlay that brings a miniature, top-down railway to life along the extreme edges of your monitor. Optimized for a compact "lo-fi" workspace atmosphere.

## ✨ Core Features

- **Sector 01 - Draggable Command Post**:
  - The entire UI anchor is now a physical "Station" structure on your desktop.
  - **Draggable**: Grab the station to reposition your entire control hub anywhere on the screen.
  - **Integrated Hub**: The control panel slides out directly from the base's coordinates.

- **The Overseer Drone (V2)**:
  - **Direct Intercept**: No longer follows the tracks; the drone calculates the shortest flight path from the Command Post to the locomotive.
  - **Automated Life Support**: Intercepts the train when energy falls below 15%.
  - **Visual Feedback**: Features a dynamic light trail and "riding" mode when attached to the train.

- **Multi-Spectrum Energy HUD**:
  - **Adaptive Visuals**: The locomotive's headlights and internal glow change color based on fuel levels (**Green** > 60%, **Amber** 20-60%, **Red** < 20%).
  - **Critical Pulse**: In low energy states, the locomotive pulses red as a distress signal.

- **Refined Lo-Fi Aesthetic**:
  - **Compact Scale**: Smaller, more detailed train cars and station for a less intrusive desktop presence.
  - **Enhanced Atmosphere**: Dense, opaque smoke trails with procedural "blob" geometry for a satisfying mechanical feel.

- **AI-Powered Generative Skins**:
  - Integrated with **Google Gemini 2.5 Flash**.
  - Synthesize custom top-down textures via natural language prompts.

## 🚀 Quick Start

1. Install dependencies: `npm install`
2. Run development: `npm run dev` and `npm start`
3. **Pro Tip**: Drag the "Command Post" to your preferred corner of the screen. It will remember its position.

## 🎮 Mechanics & Resources

| Resource | Source | Use |
| :--- | :--- | :--- |
| **Energy** | Keyboards / Manual Pulse / Drone | Multiplies speed and changes visual "aura" of the train. |
| **Scrap** | Mouse clicks / Idle collection | Used to purchase Wagon segments (10 SC) or Efficiency Cores (25 SC). |
| **Overseer** | Automated (Low Energy Trigger) | Direct flight refueling to ensure continuous operation. |

---
*Created with ❤️ for a more magical desktop experience.*