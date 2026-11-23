# Milestone 5 — Advanced 3D learning experience

This project builds on Milestone 4 and preserves the 2D fallback, quiz and local completion tracking.

## Start on Windows

1. Extract the ZIP to `C:\Users\HP\sukoaa-learnmotion-advanced-3d`.
2. Open PowerShell in that folder.
3. Run `npm install` then `npm run dev`.
4. Open `http://localhost:3000/learn/solar-system`.
5. Switch to **3D interactive**. Select a planet or press **Focus selected planet**.

## What's new

- Offline-generated, deterministic stylized surface maps; these are *not* NASA photographs or scientifically accurate planet textures.
- Smooth animated camera focus for the selected planet, with manual orbit and zoom.
- Separate 3D scene logic from lesson UI, preserving existing reusable controls.
- GPU pixel-ratio cap and low-power rendering preference.
- Existing 2D view, quiz and progress tracking remain available.

## Limitations

- Visual scale and orbit speeds are educational illustrations, not physical measurements.
- WebGL is required for 3D; choose 2D on unsupported devices.
- Production build and mobile testing should be performed on your machine.
