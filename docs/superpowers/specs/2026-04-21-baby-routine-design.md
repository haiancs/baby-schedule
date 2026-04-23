# Baby Routine App - Design Spec

## 1. Visual Thesis
**Mood, Material, and Energy:** A calm, clinical, and tactile interface that feels like a professional yet warm timeline tool. It prioritizes clarity and precision, using a highly restrained color palette (mostly monochrome with soft, purposeful accent colors for different event types) to reduce cognitive load for tired parents.

## 2. Content Plan
- **Primary Workspace (Daily View):** A full-width, edge-to-edge "fisheye" timeline. The center represents the active day (07:00-21:00), flanked by compressed night-time summary zones. 
- **Event Lanes:** Distinct horizontal tracks for different data types. Lane 1 for duration events (sleep, outings) represented as stretchable blocks. Lane 2 for point-in-time events (feeding, diaper changes) represented as crisp, unmistakable icons.
- **Secondary Context (Weekly View):** A high-level, read-only grid summarizing the week's patterns, easily toggleable from the main view.
- **Action Layer:** A minimal, floating action bar or contextual popovers that appear only when interacting with the timeline, keeping the default state completely clean.

## 3. Interaction Thesis
- **The Fisheye Zoom (Apple Style - Continuous Lens):** Long-pressing the timeline smoothly expands the local 4-hour window using a continuous, fluid mathematical curve (like Gaussian or Sine). This avoids sharp "corners" in the timeline distortion, making the expansion feel organic, physical, and elastic—heavily inspired by the macOS Dock magnification physics.
- **Tactile Snapping:** When dragging or resizing an event block, the block snaps to 15-minute grid lines with a subtle, snappy micro-animation, accompanied by a crisp tooltip showing the exact time.
- **Night Zone Reveal:** Tapping the compressed night zones smoothly expands them into the center view, swapping the daytime context out with a fluid horizontal translation.

## 4. Technical Architecture (CloudBase + React)
- **Frontend:** React 18 + Vite + Tailwind CSS + Framer Motion (for UI transitions).
- **Core Timeline:** Canvas 2D for high-performance rendering of the non-linear (fisheye) time mapping, hit detection, and drag-and-drop logic.
- **Backend (CloudBase):**
  - **Auth:** CloudBase Auth (Email/Password mapped from custom usernames like `dad@baby.local`).
  - **Cloud Functions (`cloudfunctions/`):** 
    - `userAuth`: Handles secure, one-time whitelist registration.
    - `eventSync`: Handles CRUD operations for events with owner-based isolation.
  - **Database:** `allowed_users`, `babies`, `events` collections. Strict permissions (cloud-function only access for writes).

## 5. UI Restraint Guidelines
- **No Generic Cards:** Events are raw geometric shapes or icons directly on the canvas grid, not wrapped in unnecessary card containers.
- **Typography:** One clean sans-serif typeface. Bold weights used exclusively for times and primary values (e.g., "100ml").
- **Colors:** 
  - Background: Off-white or subtle gray (#F9FAFB).
  - Sleep: Soft Indigo/Blue.
  - Feeding: Warm Amber/Orange.
  - Poop/Diaper: Earthy Brown/Green or simple dark gray icons.
  - Outing: Soft Teal/Green.
- **Chrome:** Zero unnecessary borders. Sections are divided by whitespace and subtle background shifts.

## 6. Implementation Plan (Tasks)

- [x] **Phase 1: Project Scaffold & Auth Foundation**
  - [x] Clean up the existing Vite+React template (remove demo `todos` code).
  - [x] Implement the `/login` and `/register` routes using Tailwind.
  - [x] Create the `userAuth` Cloud Function to handle whitelist validation and account creation.
  - [x] Update `src/utils/cloudbase.js` to enforce auth state and redirect to login.

- [x] **Phase 2: Database & Cloud Functions Setup**
  - [x] Define the `events` and `allowed_users` collections in CloudBase console.
  - [x] Create the `eventSync` Cloud Function for fetching and mutating daily events.
  - [x] Set up frontend API wrappers to call `eventSync`.

- [x] **Phase 3: The Fisheye Timeline Canvas (Core)**
  - [x] Build the `DailyTimeline` React component wrapping a `<canvas>`.
  - [x] Implement the time-to-x mapping logic (linear mode vs. fisheye mode).
  - [x] Implement the render loop (drawing the grid, hours, night-compression zones).
  - [x] Render dummy event data (blocks for sleep, icons for feeding) onto the canvas.

- [x] **Phase 4: Interactions & Drag-and-Drop**
  - [x] Implement canvas hit detection (finding which event or handle was touched).
  - [x] Add long-press detection to trigger the fisheye zoom (±2h window).
  - [x] Implement drag and resize logic with 15-minute snapping.
  - [x] Sync local canvas changes back to the React state and trigger `eventSync` updates.

- [x] **Phase 5: Weekly Summary & Polish**
  - [x] Build the `WeeklyView` component (read-only grid aggregating 7 days).
  - [x] Add Framer Motion transitions between Daily and Weekly views.
  - [x] Polish the UI (empty states, loading spinners, error toasts).
  - [x] Final test of cross-device syncing using the single mapped account.

- [ ] **Phase 6: Emoji Drag-and-Drop & Rating Popover**
  - Implement draggable Emoji icons (💩, 🍼) in the top action bar using HTML5 Drag and Drop API.
  - Update `DailyTimeline` to accept dropped items, calculating the dropped X coordinate into a snapped time, and triggering an event addition.
  - Render the new events as 💩 and 🍼 text/emojis directly on the Canvas.
  - Implement a React-based floating Popover that opens when an emoji event is clicked on the Canvas.
  - Add a "Star Rating" style selector inside the Popover to let users choose the quantity (e.g., 1-5 💩 or 🍼 amounts).
