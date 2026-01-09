# Desktop Train Perimeter Sim

An aesthetic, lightweight desktop overlay application that brings a miniature railway to life along the edges of your Windows screen. The train follows your desktop's perimeter, providing a cozy atmosphere while you work.

## ✨ Features

- **Edge-Running Simulation**: The train intelligently follows the bounds of your monitor (perimeter).
- **Smooth Animation**: High-performance rendering with hardware-aware transparency.
- **Customizable Engine**: 
  - Adjust velocity (speed) and the number of coupled cars.
  - Choose from standard color liveries.
- **AI Generative Skins**: Powered by **Google Gemini 2.5 Flash**, you can generate custom high-quality train textures by typing prompts (e.g., "Steampunk", "Cyberpunk", "Lego").
- **Dynamic Smoke**: Real-time particle effects that react to the train's speed.
- **Transparent Overlay**: Non-intrusive design that stays on top but lets you click through to your windows.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)
- A **Google Gemini API Key** (required for the AI Skin feature)

### Installation

1. Clone or download the project files.
2. Open your terminal in the project root folder.
3. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

The application requires an API key for the AI generation feature.
- Ensure your Gemini API Key is available as an environment variable named `API_KEY`.
- For development, you can create a `.env` file in the root directory:
  ```env
  API_KEY=your_actual_api_key_here
  ```

## 🛠️ Usage Instructions

### Running in Development Mode
To run the app with hot-reloading (Vite + Electron):
```bash
# In one terminal start Vite
npm run dev

# In another terminal start Electron
npm start
```

### Building the Portable Windows (.exe)
To create a standalone portable application for Windows:
```bash
npm run build-exe
```
The output will be located in the `/release` directory as a `Portable` executable.

## 🎮 Controls

- **Velocity**: Controls how fast the train moves around your screen.
- **Coupled Cars**: Increases or decreases the length of the train.
- **Standard Livery**: Quick-toggle between classic colors.
- **AI Skin**: Type a theme and click "Apply AI Skin" to have Gemini design a unique look for your train.

## 📝 Troubleshooting

- **Black Background**: If the background isn't transparent, ensure your Windows "Transparency effects" are enabled in System Settings. The app is optimized to disable GPU compositing on certain hardware to prevent this issue.
- **Click-Through**: The train itself and the background are "click-through". Only the **Control Panel** (top-right) will capture mouse clicks.
- **AI Not Working**: Ensure your `API_KEY` is valid and you have an active internet connection.

## 🛠️ Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 5
- **Shell**: Electron 28
- **Styling**: Tailwind CSS
- **AI Engine**: Google Gemini API (@google/genai)

---
*Note: This application is designed for Windows. While it may run on Linux/macOS, transparency and "Always on Top" behaviors are optimized for the Windows Desktop environment.*
