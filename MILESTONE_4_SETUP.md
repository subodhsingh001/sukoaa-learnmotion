# SUKOAA LearnMotion AI — Milestone 4 (3D Engine)

## Windows setup

1. Extract this ZIP into a **new folder**, e.g. `C:\Users\HP\sukoaa-learnmotion-3d`.
2. Open PowerShell in that folder.
3. Run `npm install` (required: adds three, @react-three/fiber and @react-three/drei).
4. Run `npm run dev`.
5. Open `http://localhost:3000/learn/solar-system` (type URL without asterisks).
6. Select **3D interactive**. Drag to orbit camera, scroll to zoom, select planets, pause and change speed.
7. Select **2D lightweight** to use the original 2D view. Quiz and completion remain shared.

## Architecture
- `components/lesson/solar3d/SolarSystemScene.tsx` contains Three.js/R3F scene.
- `components/lesson/SolarSystemSimulation.tsx` manages shared controls, selection, 2D fallback and quiz.
- `data/solar-system.ts` remains the shared lesson data source.
- `components/lesson/LessonPlayer.tsx` and `LessonQuiz.tsx` are reused unchanged.

## Limitations
- The scene is illustrative and not physically to scale.
- 3D needs WebGL; select 2D for older devices.
- This is the reusable foundation; advanced textures, camera focus, accessible non-WebGL detection and additional simulations come later.
