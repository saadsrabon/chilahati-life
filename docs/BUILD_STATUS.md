# Chilahati Life build status

Checkpoint dated 18 November 2026, Bangladesh time.

The first browser-playable 3D prototype is deployed at [chilahati-life.vercel.app](https://chilahati-life.vercel.app). Source is available in the [GitHub repository](https://github.com/saadsrabon/chilahati-life). Pull requests [1](https://github.com/saadsrabon/chilahati-life/pull/1) and [2](https://github.com/saadsrabon/chilahati-life/pull/2) have been merged.

## Managed cloud milestone

The published Linux x86_64 runtime verified canonical GitHub main at `a72546c479f52c5e1fa67ffd455442a3500a2b3b` in `/workspace/chilahati-life` with Node.js v24.22.1. Clean install, nine baseline tests and the production build passed.

| Phase | Cloud status |
| --- | --- |
| 1. World survey | Partial. Acquired a bounded OSM extract and documented coverage and unresolved anchors. Boundary and local verification remain open. |
| 2. Whole-area foundation | Partial. The Guide now opens a playable 3D map area with source-aligned roads, rail and station point. The prototype district retains its gameplay and saved position. Terrain, landmark models, named market connections and local verification remain open. |
| 3. Playable demonstration | Prototype playable. Local prayer timing and licensed azan remain open. |
| 4. First full gameplay release | Partial. Added school tutoring and teaching progression and a tea stall with stock, sales cooldowns and saved progress. Required markets, shopkeeping and further jobs remain open. |
| 5. Local detail and depth | Partial prototype references and art. Current signage, facades and local review remain open. |
| 6. Expansion | Pending. |

The mapped-area visit passed in cloud Chromium at 1280×800 desktop and Android-emulated 393×852 portrait and 852×393 landscape. Keyboard and touch movement, linked attribution, frozen village time, return, and reload with a prior version-one save were verified. A simulated HTTP 503 kept the village playable and the next successful request entered the region without reloading.

The geographic acquisition result and its limits are recorded in [MAP_SOURCES.md](MAP_SOURCES.md).

Cloud Chromium 156 rendered the source map at 1280×800 desktop and at 393×852 portrait and 852×393 landscape using Android touch emulation. It displayed the extract counts and visible linked attribution, with no horizontal overflow or JavaScript errors in those checks. On the baseline, desktop keyboard movement, Escape, motorcycle rental and save/reload passed. Emulated touch moved the player and opened and closed the transport menu in both orientations. A short SwiftShader sample measured roughly 6 FPS at desktop size and 11 FPS at the emulated sizes. The HUD now measures real frame intervals. Physical Android and PC GPU performance remain unverified.

Browser checks also opened a tea stall on desktop, served an order, checked the sale cooldown and focus, restocked, and reloaded with the same cash and stock. Pixel 7 emulation used a save at the school with the teaching prerequisites met, completed a paid class via touch, and confirmed the daily limit. Twelve simulation tests and the production build passed, including migration from prior version-one saves.

A station rendering follow-up batches 240 facade details into one instanced mesh. At the same 1280×800 spawn view and low graphics setting, cloud Chromium measured 477 WebGL draws per frame before and 238 after. The station facade matched visually in the two captures. SwiftShader frame-rate samples overlapped at roughly 5–6 FPS, so this checkpoint establishes lower draw-call overhead. Physical-device performance remains open.

## Implemented prototype features

- Interactive Three.js village scene with a station, railway, market scenery, Bengali signs, mosque, post office, school and homes. Current landmark models and facades are illustrative.
- Walking and vehicle controls, with vans, bicycles and motorcycles represented in the playable build. Android touch controls and PC keyboard/mouse controls are implemented.
- Contextual activities for vehicle rental and purchase, tea and meals, loans and repayments, savings, studying, delivery work, free rides, a lost bag, theft, restitution and home ownership.
- Cash, debt, energy, trust, police attention, inventory and progression state. Repeated job payouts, lost-bag rewards and free-ride rewards have validation or cooldowns.
- Local browser saving and loading, with malformed-save handling and bounded state values.
- Game clock and five illustrative prayer-time events. A verified local timetable and licensed azan recording are still required.
- Responsive game interface, contextual action panels and adjustable graphics settings.

## Checks completed

The latest development checks passed:

- Nine automated simulation tests covering purchases, vehicle ownership, loan limits and repayments, delivery payouts, theft and returns, free-ride cooldowns, save validation, day rollover and once-only prayer events.
- TypeScript typecheck.
- Production build.

Desktop browser verification observed the rendered 3D scene, the start-game flow, a motorcycle rental reducing the displayed cash from ৳650 to ৳500, and the save-confirmation message. Reload persistence was not browser-verified in this checkpoint; automated tests cover storage round-tripping.

This checkpoint is not a completed full visual or device review. Mobile browser QA was blocked by the current-URL limitation in the available computer-use session. Touch behavior, mobile layout and performance still require verification on an actual Android device.

## Geographic and audio limits

The final scope remains the whole agreed Chilahati region, including Chilahati Railway Station, Dakghor, Botolganj Bazar, Kazirhat, Boaed Bazar and Bouer Bazar, together with connecting roads, neighbourhoods, schools, colleges, shops, hotels and mosques.

An exact, complete Chilahati map is not ready. The current scene must not be presented as a surveyed reconstruction. Current road coverage, market extents, building fronts, entrances and Bengali signs need source checks and local review. Boaed Bazar's exact name and location remain unresolved.

Real azan audio is pending a licensed or permission-granted recording. Prayer events currently use explicitly illustrative game timings, rather than a verified annual Chilahati timetable. No fabricated religious recitation is included.

## Next development work

1. Verify the agreed outer map boundary and all named markets; replace illustrative geometry with checked roads and landmark models.
2. Complete Android and desktop interaction, layout and performance QA, including walking, vehicle handling, purchases, jobs and save/reload.
3. Attach approved azan recordings and verified per-mosque timing data with distance-based audio and duplicate-event protection.
4. Expand businesses, property interiors, NPC routines and missions while preserving the complete regional scope.

## Corrective character and station pass

After user feedback, the station model now follows contemporary photo references with a folded concrete canopy, red-brick walls and silver columns. People wear Bangladeshi clothing and have articulated walking and seated poses. Exact dimensions and whole-area geography remain unverified. The corrective appearance has not been re-tested in a browser. See VISUAL_REFERENCES.md.
