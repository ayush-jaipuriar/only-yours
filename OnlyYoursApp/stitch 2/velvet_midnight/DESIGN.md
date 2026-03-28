# Design System: High-End Editorial Dark-Luxe

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Sanctuary."** 

This is not a utility app; it is an intimate, cinematic experience designed to feel like a private lounge for two. To achieve this, we move away from "standard" app templates that rely on boxes and borders. Instead, we embrace **Tonal Depth** and **Intentional Asymmetry**. 

By using high-contrast editorial typography (Newsreader) against a deep, layered plum environment, we create a sense of prestige. The UI should feel "borderless," where content floats in a rich, midnight atmosphere, and interactions are signaled by soft glows rather than rigid outlines.

---

## 2. Colors
Our palette is built on "The Midnight Plum," avoiding the flat blacks of typical dark modes in favor of a rich, chromatic depth.

### Core Palette
- **Background (`surface` / `surface_dim`):** `#151023` — The foundational dark plum.
- **Primary Action (`primary_container`):** `#FF4E7B` — The heartbeat of the app. Use for high-intent actions.
- **Secondary Rose (`secondary`):** `#FFB1C3` — For supportive interactive elements.
- **Soft Cream Text (`on_surface`):** `#FFF7F6` — Warmth over stark white for long-form reading.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. 
Separation must be achieved through:
1. **Background Color Shifts:** Placing a `surface_container_high` card on a `surface` background.
2. **Vertical Rhythm:** Using the spacing scale (e.g., `8` or `10`) to create breathing room.
3. **Subtle Tonal Transitions:** Using gradients to define the start and end of a section.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers of smoked glass. 
- **Lowest Tier (`surface_container_lowest`):** Deepest background elements.
- **Middle Tier (`surface_container`):** Standard interactive surfaces.
- **Highest Tier (`surface_container_highest`):** Active cards or "popped" elements.

### Signature Textures
Apply a subtle linear gradient to all Primary CTAs: `linear-gradient(135deg, #FF3B78 0%, #FF2E6E 100%)`. For hero backgrounds, use a large-scale radial blur of `#FF2E6E` at 15% opacity to create a "warm glow" behind text.

---

## 3. Typography
We use a high-contrast pairing to balance intimacy with modern utility.

- **Display & Headlines (Newsreader):** This is our emotional anchor. Use `display-lg` for milestones and `headline-md` for game questions. The serif style feels curated and editorial.
- **Body & Utility (Manrope):** Our functional workhorse. Use `body-lg` for long-form content and `label-md` for all navigation and metadata.
- **The Hierarchy Rule:** Never use Newsreader for interactive labels or buttons. Serifs are for *feeling*; Sans-serifs are for *doing*.

---

## 4. Elevation & Depth
In this design system, shadows are light, not dark.

- **The Layering Principle:** Stack `surface_container_low` on top of `surface_dim`. The subtle shift in plum hex values creates a sophisticated "lift" without visual clutter.
- **Ambient Glows:** For floating elements (like active Gameplay Cards), use an ambient shadow: `0px 20px 40px rgba(255, 46, 110, 0.08)`. This mimics the pink accent color bleeding into the dark environment.
- **The "Ghost Border" Fallback:** If a boundary is required for accessibility, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.
- **Glassmorphism:** Apply a `backdrop-filter: blur(20px)` to the Bottom Navigation Bar and Top App Bar using a semi-transparent `surface_container` (`#221d30` at 80% alpha).

---

## 5. Components

### Buttons
- **Primary:** `primary_container` background with a subtle 2px inner-glow at the top. Use `xl` (1.5rem) roundedness for a pill-like, premium feel.
- **Secondary:** Transparent background with a "Ghost Border" (15% opacity `outline`). 
- **Tertiary:** Pure text (`on_secondary_fixed_variant`) with an icon, no container.

### Gameplay Cards (The "Focused Card")
Cards are the heart of the experience. 
- **Styling:** Borderless, `surface_container_high` background.
- **Animation:** One card at a time. Previous cards fade into `surface_dim` while the active card gains a subtle `primary` glow.
- **Content:** Headline in `headline-lg` (Newsreader), centered.

### Progress Indicators (XP & Milestones)
- **The Glow Bar:** Progress bars use `primary` color with a 4px blur shadow of the same color to create a "neon light" effect.
- **Background:** The unfilled track should be `surface_container_highest` at 40% opacity.

### Navigation
- **Bottom Nav:** Android-first logic. Icons use `secondary_fixed_dim`. The active state uses a small `primary` dot below the icon, rather than a heavy highlight box.
- **Top App Bar:** Minimalist. Use `title-md` for page titles. The background must be a glassmorphic blur to keep the cinematic background visible as the user scrolls.

---

## 6. Do's and Don'ts

### Do
- **Use White Space:** Let the deep plum background breathe. A lack of content is a sign of luxury.
- **Embrace Gradients:** Use them in backgrounds and buttons to avoid a "flat" app feel.
- **Prioritize Legibility:** Ensure `on_surface` (Cream) text always sits on a sufficiently dark `surface` container.

### Don't
- **No Divider Lines:** Never use a horizontal rule `<hr>` to separate list items. Use spacing or a `5% white` background shift.
- **No Pure Black:** Avoid `#000000`. It kills the "Plum/Eggplant" atmosphere.
- **No Sharp Corners:** Stick strictly to the Roundedness Scale (Default: `0.5rem`, Hero Cards: `1.5rem`). Sharp corners feel aggressive; we want intimate.
- **No Peach/Coral:** Stick to the cool-toned pinks (`#FF2E6E`) and deep purples. Avoid any orange-tinted reds.