# Milestone 9 - Advanced Interactive Forces and Motion

Open `/learn/force-and-motion` after running `npm install` and `npm run dev`.

## Features
- Five selectable objects with combined masses; click to add or remove objects.
- Applied force from -500 N to +500 N, including precise numeric control.
- Adjustable friction with distinct static and kinetic coefficients.
- Fixed-step (120 Hz) numerical integration, velocity, acceleration, displacement, and track boundaries.
- Play, pause, reset, full screen, force arrows, speed gauge, numeric readouts, and display toggles.
- Prediction exercise and assessment quiz; completion still uses browser localStorage.

## Important model limits
- One-dimensional motion, constant g=9.81 m/s², illustrative graphics and masses.
- Friction slider represents a dimensionless setting; static coefficient = 0.9*setting, kinetic coefficient = 0.7*setting.
- Collisions at track edges simply stop the cart; no bounce or collision energy modeling.
- This is a teaching simulation, not a validated engineering physics solver.
- No database, accounts, teacher analytics, or multi-tenant support yet. Those are future milestones.

## Test cases
1. With a 50 kg crate, friction 0, force 100 N, acceleration should be 2 m/s².
2. With force 0 and initial velocity 0, cart stays still.
3. With friction 0.25, 50 kg crate and force 10 N, static friction holds cart still.
4. With friction 0, force -100 N, cart accelerates left.
5. Pause freezes the motion; reset returns time, velocity and position to zero.
