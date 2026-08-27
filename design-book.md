# Riffle — Design Book

## Direction

Riffle is a **digital indie-tech publication**.

The visual language combines:

* editorial typography;
* minimalism;
* developer culture;
* subtle retro-computing references;
* pixel art;
* ASCII art.

It should feel deliberately designed but slightly raw.

Think:

```text
independent tech magazine
×
developer terminal
×
small printed zine
```

Do not make it look like:

* a SaaS dashboard;
* a generic Tailwind template;
* a corporate news portal;
* a gaming website;
* a cyberpunk neon interface.

---

# Color palette

## Paper

```css
--paper: #F6F4EF;
```

Primary page background.

A slightly warm off-white is preferred over pure white.

## Ink

```css
--ink: #111111;
```

Primary text, borders and graphical elements.

## Riffle Red

```css
--riffle-red: #FF3B1F;
```

Main accent color.

Use deliberately and sparingly.

Target roughly **less than 10% of the visual surface**.

Good uses:

* tiny glyph details;
* active states;
* issue markers;
* small highlights;
* arrows;
* important labels.

Do not create large red sections merely for visual impact.

## Acid Lime

```css
--acid-lime: #C6F44E;
```

Secondary optional accent.

Use significantly less frequently than red.

It should feel like an unexpected editorial highlight, not part of every component.

---

# Typography

Use two font families.

## Space Grotesk

Use for:

* logo;
* headings;
* issue titles;
* large numbers;
* prominent editorial typography.

Preferred weights:

```text
600
700
```

## IBM Plex Mono

Use for:

* body text;
* descriptions;
* metadata;
* labels;
* dates;
* tags;
* navigation;
* ASCII art.

Preferred weights:

```text
400
500
```

The contrast between a strong geometric headline and monospaced editorial text is an important part of the Riffle identity.

---

# Layout

Use generous whitespace.

The page should feel editorial rather than component-heavy.

Prefer:

```text
content
──────────────
content
──────────────
content
```

over:

```text
╭────────────╮
│   card     │
╰────────────╯
```

Use:

* thin borders;
* straight edges;
* square or nearly-square blocks;
* asymmetric editorial compositions where appropriate.

Avoid:

* excessive rounded corners;
* large card grids;
* shadows;
* gradients;
* glassmorphism;
* decorative blur;
* excessive animation.

---

# Pixel art

Pixel art is one of Riffle's primary visual signatures.

It should not look like game artwork.

Use abstract or metaphorical symbols related to the content.

Examples:

```text
network
database
terminal
robot
document
signal
cloud
cursor
link
chip
```

## Generation

Pixel glyphs should be defined programmatically as grid data.

Default grid:

```text
16 × 16
```

A smaller:

```text
12 × 12
```

grid is acceptable where appropriate.

Render them as SVG.

Pixels must:

* align perfectly to the grid;
* have hard edges;
* have no antialiasing effect;
* primarily use `Ink`;
* optionally contain **1–2 Riffle Red pixels**.

Avoid multicolor pixel illustrations.

Pixel graphics are accents, not hero illustrations competing with the content.

---

# ASCII art

ASCII art is a secondary visual motif.

It should support the editorial identity rather than dominate the page.

Use reusable templates that can incorporate dynamic information such as:

```text
ISSUE 004
12 LINKS
PROJECTS / TOOLS / READS
```

Example character vocabulary:

```text
─ │ ┌ ┐ └ ┘
+ - /
> _
█ ▓ ▒ ░
```

Render ASCII using **IBM Plex Mono**.

Rules:

* maximum approximately one dominant ASCII composition per viewport;
* never allow horizontal overflow;
* simplify or hide decorative ASCII on narrow screens;
* preserve whitespace exactly;
* do not fill every empty space with ASCII decoration.

---

# Branding

The preferred logotype is intentionally simple:

```text
riffle.
```

Lowercase.

The final dot is part of the character of the mark.

Avoid creating an elaborate standalone logo when typography and pixel graphics already provide enough identity.

---

# Homepage

The homepage should immediately communicate:

```text
riffle.
LATEST ISSUE
```

The latest issue is the dominant element.

Recommended composition:

```text
riffle.

LATEST ISSUE                         [pixel art]

#004
Title of the current issue

Short introduction explaining
what this issue contains.

READ ISSUE ↗


────────────────────────────────────────────

RECENT ISSUES

#003        date
Issue title                                →

#002        date
Issue title                                →

#001        date
Issue title                                →
```

On wider screens, the latest-issue text and visual element may form an asymmetric two-column composition.

Recent issues may display roughly **3–4 entries** simultaneously.

On mobile everything collapses naturally into one column.

---

# Issue page

The issue itself is a curated list.

The visual hierarchy should be:

```text
ISSUE #004
27 AUG 2026

Main issue title

Short Polish introduction describing
the character of this issue.

12 LINKS

[pixel glyph / optional ASCII]
```

Followed by link rows.

Example:

```text
PROJECT / GITHUB

Interesting original project title ↗

Krótki polski opis wyjaśniający, czym jest projekt
i dlaczego znalazł się w tym wydaniu.

AI   AGENTS
```

Then:

```text
────────────────────────────────────────────
```

and the next item.

The title is the strongest element inside a link entry.

Source, type, tags and metadata are secondary.

Descriptions should remain concise.

Do not place every link inside a separate rounded container.

---

# Interaction

Interaction should be subtle.

Good:

* underline appearing on hover;
* arrow moving a few pixels;
* foreground/background inversion;
* tiny red accent appearing;
* crisp state changes.

Avoid:

* bouncing elements;
* large scale transforms;
* parallax;
* animated gradients;
* long easing animations.

The interface should still feel excellent with animations completely disabled.

---

# Responsive behavior

Desktop can use more experimental editorial composition.

Mobile prioritizes readability.

On small screens:

* use a single content column;
* reduce oversized headings;
* simplify ASCII;
* keep pixel glyphs small;
* maintain comfortable horizontal padding;
* never introduce horizontal scrolling.

Decorative elements may disappear if keeping them would compromise content.

Content always wins over decoration.

---

# Design rule of thumb

When choosing between:

```text
more polished
```

and:

```text
more characteristic
```

prefer characteristic.

When choosing between:

```text
more decoration
```

and:

```text
better readability
```

prefer readability.

When choosing between:

```text
another UI component
```

and:

```text
typography + whitespace + a thin line
```

prefer typography, whitespace and the thin line.

Riffle's visual identity should emerge from a small number of consistently applied primitives rather than a large component library.
