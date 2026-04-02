# AGENTS.md — Via Website Design & Development Guide

This file provides instructions for AI agents working on this repository. Follow these rules for every file you create or modify.

---

## Mobile-First Design (CRITICAL)

Via websites are primarily viewed on mobile phones. Every design decision starts mobile-first. This is non-negotiable.

- Default styles target phone screens (375px width). Use `sm:`, `md:`, `lg:` prefixes to scale up for larger screens.
- Single-column stacked layout by default; multi-column only at `md:` and above.
- Minimum touch targets: `min-h-[44px]` and `min-w-[44px]` on all interactive elements (buttons, links, inputs).
- Base font size: `text-base` (16px) minimum — never smaller on mobile.
- Generous horizontal padding: `px-4` or `px-5` on all containers — content must never touch screen edges.
- Always include `<meta name="viewport" content="width=device-width, initial-scale=1">` in `index.html`.
- Test your layout mentally at 375px wide. If elements would overflow or feel cramped, fix it.

**Responsive pattern:**
```
Mobile (default):    single column, full-width cards, bottom or hamburger nav
Tablet (md:):        two-column grids, sidebar navigation appears
Desktop (lg:):       three-column grids, more horizontal space
```

---

## Design Identity (IMPORTANT — read before writing any component)

Every website MUST have its own unique visual personality. Do NOT produce generic-looking websites. Before writing any component code, decide on a design identity for the project.

### 1. Choose a color palette that matches the project theme

Define 2-3 brand colors in `tailwind.config.js` under `theme.extend.colors`. Use these consistently throughout — never fall back to generic Tailwind defaults like bare `blue-500` or `gray-500` for primary UI.

```js
// Example: a food/restaurant app
theme: {
  extend: {
    colors: {
      brand: { 50: '#fef7ed', 100: '#fdecd6', 500: '#f97316', 600: '#ea580c', 700: '#c2410c' },
      accent: { 500: '#10b981', 600: '#059669' },
    }
  }
}
```

### Color mood guide — pick colors that evoke the right feeling:

| Domain | Colors |
|--------|--------|
| Travel / adventure | Ocean blues, sunset oranges, warm sand tones |
| Food / restaurants | Warm reds, oranges, creamy whites, olive greens |
| Fitness / health | Energetic greens, bold blacks, vibrant accents |
| Finance / business | Deep navy, trustworthy blues, gold accents |
| Creative / art | Purples, pinks, gradients, playful brights |
| Nature / eco | Forest greens, earth browns, sky blues |
| Tech / SaaS | Cool indigos, electric blues, dark slate backgrounds |
| Social / community | Friendly oranges, warm purples, soft pinks |

### 2. Pick a visual style

Vary the look and feel per project — not every site should look the same:

- **Soft and rounded**: `rounded-2xl`, soft shadows, pastel backgrounds, gentle gradients
- **Sharp and modern**: Minimal border-radius, high contrast, bold typography, sharp edges
- **Minimal and airy**: Lots of whitespace, thin borders (`border`), subtle gray tones, understated
- **Rich and immersive**: Dark backgrounds, gradient overlays, vibrant accent colors, depth with shadows

### 3. Apply the identity everywhere

Once you pick colors and style, use them consistently. Every card, button, heading, and section should reflect the identity. A travel app should *feel* like travel. A fitness app should *feel* energetic.

---

## Making Beautiful Websites

### Layout and spacing

- **Generous whitespace.** Use `py-8`, `py-12`, `gap-6`, `space-y-6` liberally. Whitespace makes everything look better. Cramped layouts look amateur.
- **Visual hierarchy.** One hero element per page. Size and weight guide the eye: large bold headings (`text-3xl font-bold` on mobile, `md:text-5xl` on desktop), medium subheadings (`text-lg text-gray-600`), comfortable body text (`text-base leading-relaxed`).
- **Full-width sections with contained content.** Use full-width background colors/gradients with a centered `max-w-xl mx-auto px-4` content container inside.

### Cards and surfaces

- Round corners: `rounded-xl` or `rounded-2xl`
- Subtle shadows: `shadow-sm` default, `hover:shadow-md` on hover
- Hover lift: `hover:-translate-y-1 transition-all duration-200`
- Adequate padding: `p-5` or `p-6` inside cards
- Never use bare borders — prefer shadows for depth

### Buttons and interactions

- Generous padding: `px-6 py-3` for primary buttons
- Rounded: `rounded-lg` or `rounded-full` depending on style
- Hover feedback: `hover:brightness-110 active:scale-[0.98] transition-all`
- Primary actions: use your brand color with white text
- Secondary actions: `bg-gray-100 text-gray-700 hover:bg-gray-200`

### Animations (use framer-motion)

- Page/section entrance: fade in + slide up
  ```jsx
  import { motion } from 'framer-motion';
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
  ```
- Stagger children in lists:
  ```jsx
  {items.map((item, i) => (
    <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
  ```
- Keep animations subtle — 0.3-0.5s duration, small movements (y: 10-20px)

### Icons

- Use `lucide-react` for all icons: `import { Heart, MapPin, Clock } from 'lucide-react'`
- Size icons appropriately: `<MapPin className="w-5 h-5" />` for inline, `w-8 h-8` for feature icons
- Pair icons with text in buttons and labels for better scannability

### Hero sections

Every app should have a compelling top section — not just a plain heading. Options:
- Gradient background with bold white text
- Large heading + descriptive subtext + primary CTA button
- Full-width colored or gradient banner: `bg-gradient-to-br from-brand-500 to-brand-700 text-white py-12 px-4`

### Content and data

- **Real data, not placeholders.** Seed the database with realistic, interesting example data. Use specific names, descriptions, prices, dates — never "Item 1", "Lorem ipsum", "Test data".
- **Fetch live data for data-driven topics.** When the request is about a domain with real, publicly available data — sports scores, flights, stocks, weather, news, crypto — do NOT invent the data. Search for a suitable free public API, fetch server-side in `server.js` using `axios`, and serve via Express. If no API exists, scrape with `cheerio`. Only fall back to hardcoded data for genuinely static reference data.
- **Loading states.** Show a spinner or skeleton while fetching. Never a blank screen.
- **Error states.** Friendly error message with an icon and a retry button. Never raw error text.
- **Empty states.** When there's no data yet, show a helpful message with an icon and call to action — not a blank page.

### Typography

- Use Inter (loaded via Google Fonts in `index.html`) as the base font — configured in `tailwind.config.js`
- Headings: `font-bold` or `font-semibold`, `tracking-tight` for large headings
- Body: `text-gray-600` or `text-gray-700` for secondary text, `leading-relaxed` for readability
- Don't use more than 2-3 font sizes per section — consistency matters

---

## Component Quality

- One component per file in `src/components/`
- Use `clsx` for conditional class names: `className={clsx('px-4 py-2 rounded-lg', active && 'bg-brand-500 text-white')}`
- Semantic HTML: `<button>`, `<nav>`, `<main>`, `<section>`, `<label htmlFor>`
- Accessible: `aria-label` on icon-only buttons, proper form labels

---

## Tailwind Custom Colors Gate

If you use `bg-brand-500`, `text-accent-600`, `from-ocean-400`, or any color class that is NOT a standard Tailwind color (red, blue, gray, slate, green, etc.), you MUST define those colors in `tailwind.config.js` under `theme.extend.colors` FIRST.

**Why:** Undefined custom colors produce NO CSS. The class `bg-brand-500` without a `brand` color definition results in no background — elements become invisible.

After writing all components, scan for custom color patterns like `bg-X-NNN`, `text-X-NNN`, `border-X-NNN` where X is not a standard Tailwind color. For each one found, verify it exists in `tailwind.config.js`. If missing, add it.

---

## Prisma + PostgreSQL Patterns

### schema.prisma template

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = "postgresql://user@localhost:5432/viadb?schema=public"
}

model Item {
  id        Int      @id @default(autoincrement())
  name      String
  category  String
  createdAt DateTime @default(now())
}
```

### Express + Prisma pattern

```js
import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany();
    res.json(items);
  } catch (err) {
    console.error('DB error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3001);
```

### Critical Prisma rules

- **Pin Prisma to version 5** — Prisma 6+ has breaking schema changes that break `npx prisma db push`.
- Use the direct PostgreSQL URL in `schema.prisma` as shown above.
- Always run `npx prisma db push` after writing or changing `schema.prisma`. Do NOT declare success until it exits 0.
- Prisma queries are async — always `await` them.
- Use named imports: `import { PrismaClient } from '@prisma/client'`.
- Every field in `prisma.<model>.create()` / `.update()` must exist in the schema — mismatch is the #1 runtime error.

---

## New Project Scaffolding

The project scaffold (package.json, vite.config.js, server.js, etc.) is pre-installed by the supervisor. If any scaffold files are missing, create them manually:

### package.json

```json
{
  "name": "via-website",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19",
    "react-dom": "^19",
    "react-router-dom": "^7",
    "express": "^5",
    "@prisma/client": "5",
    "lucide-react": "^0.400",
    "framer-motion": "^11",
    "clsx": "^2",
    "date-fns": "^3",
    "axios": "^1",
    "cors": "^2"
  },
  "devDependencies": {
    "vite": "^6",
    "@vitejs/plugin-react": "^4",
    "tailwindcss": "^3",
    "postcss": "^8",
    "autoprefixer": "^10",
    "prisma": "5"
  }
}
```

### index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>App</title>
  </head>
  <body class="bg-white text-gray-900 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### vite.config.js

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', allowedHosts: true, proxy: { '/api': 'http://localhost:3001' } }
});
```

### tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // ADD YOUR PROJECT COLORS HERE — see "Design Identity" section
    },
  },
  plugins: [],
}
```

### postcss.config.js

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### src/main.jsx

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```
