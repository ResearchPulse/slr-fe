---
name: Systematic Review Support System
description: A focused workbench for conducting systematic literature reviews with clarity and traceable decisions.
colors:
  primary: "#0071BC"
  primary-hover: "#005F9E"
  primary-light: "#F0F7FC"
  background: "#F7F9FA"
  background-secondary: "#EEF2F5"
  surface: "#FFFFFF"
  ink: "#122331"
  text-secondary: "#647381"
  text-muted: "#647381"
  border: "#DCE4E9"
  success: "#117035"
  warning: "#92400E"
  error: "#DC2626"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.15em"
rounded:
  sm: "8px"
  md: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    typography: "{typography.body}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  tab-active:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "10px 16px"
    typography: "{typography.label}"
---

# Design System: Systematic Review Support System

## 1. Overview

**Creative North Star: "The Research Workbench"**

SLRS is a modern, information-rich product UI for researchers and review teams. It should feel like a dependable workbench: the interface gets out of the way, keeps evidence and decisions legible, and makes the next workflow action easy to find. Favor compact, consistent patterns that let users move quickly through systematic review tasks.

Use cool blue-gray surfaces, Manrope typography, thin borders, and softly rounded controls. Keep depth restrained and use motion to clarify interaction state. Respect the product principles in PRODUCT.md: make each review phase and next action clear, preserve evidence context, and show only accurate, traceable workflow data. The active implementation tokens in `src/index.css` define the current palette; `docs/design-system.md` describes a different ivory and burgundy direction and should not override those tokens unless the source design is intentionally changed.

**Key Characteristics:**
- Dense, orderly layouts for research workflows and evidence.
- Research Blue signals primary actions, selection, and focus.
- Softly rounded components with light borders and limited shadow.
- Manrope carries both headings and interface text.
- Reduced motion and non-color state cues are required.

## 2. Colors

The palette pairs Research Blue with cool, pale blue-gray surfaces and deep blue-black text; semantic colors are reserved for status.

### Primary
- **Research Blue** (`colors.primary`, #0071BC): Primary actions, links, focus, and active workflow indicators.
- **Deep Research Blue** (`colors.primary-hover`, #005F9E): Hover state for primary actions.
- **Blue Wash** (`colors.primary-light`, #F0F7FC): Selected or hovered option backgrounds.

### Neutral
- **Cool Canvas** (`colors.background`, #F7F9FA): Main application background.
- **Mist Panel** (`colors.background-secondary`, #EEF2F5): Secondary panels, table headers, and quiet control surfaces.
- **White Surface** (`colors.surface`, #FFFFFF): Cards, inputs, menus, and modal surfaces.
- **Blue-Black Ink** (`colors.ink`, #122331): Main text and high-emphasis content.
- **Slate Text** (`colors.text-secondary`, #647381): Supporting text and inactive navigation.
- **Muted Slate** (`colors.text-muted`, #647381): Placeholder and low-emphasis text, kept readable on white surfaces.
- **Cool Divider** (`colors.border`, #DCE4E9): Control outlines, separators, and panel edges.

### Status
- **Success Green** (`colors.success`, #117035), **Warning Amber** (`colors.warning`, #92400E), and **Error Red** (`colors.error`, #DC2626): Communicate semantic state. Pair each with text or an icon; never rely on color alone.

**The Signal Rule.** Keep Research Blue for actions, selection, links, and focus. Do not use it as broad decoration.

## 3. Typography

**Display Font:** Manrope (with system sans-serif fallbacks)  
**Body Font:** Manrope (with system sans-serif fallbacks)  
**Label/Mono Font:** Manrope; data and labels use the same family.

**Character:** Compact, clear, and contemporary. A single sans-serif family keeps dense academic workflows consistent; the legacy serif utility classes also resolve to Manrope, so do not treat them as a second font.

### Hierarchy
- **Display** (700, 32px, 1.2 line-height, -0.025em tracking): Main application page titles. Review-process headers use 28px and reduce to 22px on small screens.
- **Title** (700, 24px, 1.25 line-height): Major sections within a work surface.
- **Body** (400, 14px, 1.5 line-height): Forms, tables, labels, and core reading. Let prose breathe; keep dense data compact when the task requires it.
- **Label** (500, 11px, 1.35 line-height, 0.15em tracking, often uppercase): Tabs, compact section labels, and button text. Use uppercase selectively, not as a default for all copy.

**The One-Family Rule.** Use Manrope throughout product UI. Establish hierarchy with size, weight, and spacing rather than a decorative display face.

## 4. Elevation

The interface is mostly flat. Thin borders and the shift from the cool canvas to white surfaces do most of the layering; reserve shadows for surfaces that float above the workflow. Shared content cards use borders without a resting shadow. Primary-button hover may add a compact blue-tinted shadow, while popovers and dialogs use a broader shadow to separate them from the workflow.

**The Floating-Surface Rule.** Use shadow to distinguish an overlay or hover response; never use it as decoration on every panel.

## 5. Components

Components feel soft and approachable while preserving the familiar behavior expected in a research tool. The shared shape is a 12px radius, a thin cool border, and short state transitions.

- **Primary button:** Research Blue with white text, 12px corners, semibold 14px text, and sentence-case labels by default. Hover darkens the blue and lifts the button by 1px; focus has a visible blue ring. Size variants use 36px, 44px, and 52px minimum heights.
- **Secondary button:** White surface with a cool outline and ink text. Hover adds a quiet secondary-surface fill. Keep its geometry and type scale aligned with the primary button.
- **Text input:** White surface, 1px border, 12px corners, and 12px by 16px padding. Focus changes the border to Research Blue and adds a soft ring; error state uses Error Red for both border and ring.
- **Select:** A 44px trigger with a white surface and the same input focus and error treatment. The option menu is a rounded, bordered floating surface; selected and keyboard-active options use Blue Wash and Research Blue text.
- **Checkbox and switch:** Use Research Blue for the selected state, a visible keyboard focus ring, and a short state transition. Switch thumbs move without bounce or elastic easing.
- **Card:** White surface, 1px cool border, 12px corners, and 16px padding (24px at the `sm` breakpoint and above). Keep ordinary content cards flat; add hover treatment only when the card itself is interactive.
- **Tabs:** A horizontal, scrollable row with a bottom divider. Labels use the shared 14px interface scale. The active tab uses ink text and a 2px Research Blue underline; inactive tabs use Slate Text and gain emphasis on hover.
- **Sidebar navigation:** A collapsible, light blue-gray rail with compact grouped links and a quiet active fill. Use the shared semantic palette tokens for active and hover states across client and admin navigation.

Controls transition color, background, border, and focus state in roughly 150–200ms. Popovers use a short opacity and vertical-shift entrance to clarify their relationship to the trigger. Keep motion state-led, support keyboard focus, and honor `prefers-reduced-motion` globally.

## 6. Do's and Don'ts

- **Do** use `#0071BC` for primary actions, selected states, and focus; use `#F0F7FC` for a quiet selection surface.
- **Do** use the 12px shared radius and the 14px Manrope body scale to keep screens coherent.
- **Do** make workflow states understandable through labels, icons, or text as well as color.
- **Do** keep evidence, review decisions, and ownership traceable to real data.
- **Don't** use ornate decoration and visual noise that distract from research tasks.
- **Don't** use generic dashboard patterns that obscure the review workflow.
- **Don't** show invented metrics, statuses, progress, or ownership that are not supported by actual data.
- **Don't** use ivory and burgundy values from `docs/design-system.md` as live tokens while the implementation remains on the blue-gray palette.
- **Don't** add decorative motion, overshooting transitions, or broad shadows to ordinary content surfaces.
