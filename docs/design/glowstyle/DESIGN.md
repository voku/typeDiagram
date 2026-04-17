# Design System Specification

## 1. Overview & Creative North Star: "The Architectural Blueprint"

The North Star for this design system is **"The Architectural Blueprint."** This is a high-fidelity, technical language designed for precision and structural clarity. It moves away from the "consumer-web" aesthetic of soft bubbles and friendly gradients toward a world of engineering rigors, intentional asymmetry, and deep tonal layering.

The experience is built around the **Split Pane** logic: a bilateral division between raw logic (the code) and visual manifestation (the diagram). By utilizing high-contrast monospace typography against a deeply recessed dark palette, we create an environment that feels like a premium IDE—authoritative, minimal, and focused on the beauty of technical architecture.

---

## 2. Colors & Surface Logic

This system utilizes a dark-themed palette that prioritizes depth and semantic meaning over decorative color.

### Core Palette (Material Token Mapping)

- **Background (`#0b1326`):** The foundational void. Everything emerges from here.
- **Primary / Type (`#8ed5ff`):** Used for structural records and core definitions.
- **Secondary / Union (`#ddb7ff`):** Used for sum types and logical branches.
- **Tertiary / Alias (`#45e3ce`):** Used for decorative or meaningful renames and aliases.

### The "No-Line" Rule

Traditional 1px solid borders are strictly prohibited for layout sectioning. Visual boundaries must be established through **Tonal Transitions**.

- To separate the **Split Pane**, use `surface_container_low` for the editor side and `surface` for the preview canvas.
- Avoid strokes; let the shift in background value define the edge.

### Surface Hierarchy & Glassmorphism

The UI is a series of stacked architectural plates.

- **The Base:** `surface_dim` (`#0b1326`)
- **The Workspace:** `surface_container_low` (`#131b2e`)
- **The Node Card:** `surface_container_high` (`#222a3d`)
- **The Overlay/Modal:** `surface_bright` (`#31394d`) with a 12px `backdrop-blur` and 60% opacity to create a "frosted tech" feel.

---

## 3. Typography: The Monospace Hierarchy

Typography is the primary vehicle for the "Technical" aesthetic. We pair a brutalist display face with a clean, high-legibility body face.

- **Display & Headlines (Space Grotesk):** Used for high-impact branding and section headers. Its geometric quirks reinforce the "blueprint" feel.
  - `display-lg`: 3.5rem. Use with tight letter-spacing for hero sections.
- **Titles & Labels (Inter / Monospace Fallback):** `title-sm` (1rem) serves as the primary label for Node Cards.
- **Code & Metadata (Monospace):** All "Input" and "Output" data must use a monospace stack (e.g., JetBrains Mono, Fira Code).
  - **Weighting:** Use `medium` for keywords (`type`, `union`) and `regular` for properties.
  - **Coloring:** Map `primary` to `type`, `secondary` to `union`, and `tertiary` to `alias`.

---

## 4. Elevation & Depth: Tonal Layering

We reject traditional drop shadows in favor of **Ambient Lift**.

- **The Layering Principle:** Depth is achieved by "stacking" container tiers. A `surface_container_highest` element placed on a `surface_dim` background provides enough contrast to imply elevation without a single pixel of shadow.
- **The "Ghost Border":** Where accessibility demands a border (such as focused input fields), use `outline_variant` at 20% opacity. It should feel like a faint guide wire, not a heavy wall.
- **Ambient Glow:** Floating cards (like the Node Card in the diagram) may use an ultra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4)`. The shadow should feel like a natural light obstruction, not a "glow."

---

## 5. Components

### The Node Card (Signature Pattern)

The Node Card is the atom of this system.

- **Structure:** No border. A 4px vertical accent bar on the far-left edge using the semantic color (`primary`, `secondary`, or `tertiary`).
- **Surface:** `surface_container_high`.
- **Corner Radius:** `sm` (0.125rem) or `none` to maintain a "technical" sharpness.

### The Split Pane Editor

- **Layout:** A 50/50 or 40/60 split.
- **The Gutter:** A 4px gap using `surface_container_lowest`. No divider line.
- **Active State:** The active pane receives a subtle background shift to `surface_container_low`.

### Buttons

- **Primary:** High-contrast `primary_container` with `on_primary_container` text. Use `md` (0.375rem) roundedness.
- **Ghost (Secondary):** No background. `outline` text. On hover, shift background to `surface_bright`.
- **Tertiary:** Monospace text with a simple underline that appears only on hover.

### Input Fields

- **Styling:** `surface_container_lowest` background.
- **Interaction:** On focus, the bottom edge gains a 2px `primary` accent. Avoid 4-sided focus rings.

---

## 6. Do's and Don'ts

### Do

- **DO** use asymmetry. Place the "Type" definitions at varying vertical offsets to create a "drifting code" aesthetic.
- **DO** use `surface_container` tiers to create hierarchy.
- **DO** use the `tertiary` (Teal) color sparingly as a highlight for refined details.

### Don't

- **DON'T** use 1px solid white or grey borders to separate sections.
- **DON'T** use standard sans-serif fonts for data-heavy views; keep it monospace to maintain the "Technical" persona.
- **DON'T** use high-saturation backgrounds. Keep the "void" (`#0b1326`) as the dominant surface.
- **DON'T** use large corner radii. Stick to `none`, `sm`, or `md` to keep the UI feeling "engineered."
