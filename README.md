# 🚂 Desktop Train Perimeter Sim

An aesthetic, high-performance desktop overlay that brings a miniature, top-down railway to life along the extreme edges of your monitor. Perfect for adding a cozy, "lo-fi" atmosphere to your workspace while you work or relax.

## ✨ Latest Features

- **Precision Perimeter Tracking**: The train intelligently navigates the exact bounds of your primary display, including smooth interpolation around corners.
- **Organic Smoke System**: 
  - **High-Frequency Emission**: Realistic, dense trails that react to the train's velocity.
  - **Unique Puff Geometry**: Every smoke cloud is procedurally generated with a random "blob" shape and unique rotation.
  - **Dynamic Drift**: Particles gently expand and drift away from the tracks before fading out.
- **AI-Powered Generative Skins**:
  - Integrated with **Google Gemini 2.5 Flash**.
  - Describe any theme (e.g., "Cyberpunk Neon", "Classic Wood", "Lego Blocks") and the AI will synthesize a custom top-down texture for your train.
- **Aesthetic Control Panel**: A glassmorphism-inspired UI (top-right) allows real-time adjustment of speed, train length, and livery without interrupting your workflow.
- **Transparent "Click-Through" Architecture**: The train itself is a non-intrusive ghost layer; your mouse clicks pass through the tracks to your underlying apps, while the Control Panel remains interactive.

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)
- A **Google Gemini API Key** (for generative skins)

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

To start the development environment:
```bash
# Terminal 1: Vite HMR
npm run dev

# Terminal 2: Electron Shell
npm start
```

## 🛠️ Configuration

The app automatically detects your screen resolution. For the AI skin generation, ensure your environment has access to the `API_KEY`.
- You can create a `.env` file in the root:
  ```env
  API_KEY=your_gemini_api_key
  ```

## 🎮 Features & Controls

| Feature | Description |
| :--- | :--- |
| **Velocity Control** | Adjust speed from a slow crawl to a high-speed express. |
| **Train Length** | Add up to 15 coupled cars to your engine. |
| **Livery Toggle** | Switch between five high-contrast classic railway colors. |
| **AI Synthesis** | Enter a prompt to generate professional game-asset-style textures. |

## 📝 Technical Notes (Windows)

- **Transparency**: If the background appears black, ensure "Transparency effects" are toggled **ON** in Windows Personalization settings.
- **Performance**: Hardware acceleration is disabled by default to ensure maximum compatibility with transparent window layering on various GPUs.
- **Always on Top**: The train uses the `screen-saver` priority level to stay visible above most applications and taskbars.

## 🏗️ Tech Stack

- **Core**: React 19 + TypeScript
- **Engine**: Custom RequestAnimationFrame physics loop
- **Shell**: Electron 28
- **Styling**: Tailwind CSS
- **Intelligence**: Google Gemini API (@google/genai)

---
*Created with ❤️ for a more magical desktop experience.*