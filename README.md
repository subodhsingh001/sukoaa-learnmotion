# SUKOAA LearnMotion AI

Next.js App Router, React, TypeScript and Tailwind CSS v4.

## Start

```powershell
npm install
npm run dev
```

Visit http://localhost:3000 (Dashboard), http://localhost:3000/explore (topic search), and select a topic for its overview.

## Structure

- `app/`: thin Next.js route entrypoints
- `components/layout/`: shared navigation, topbar and responsive shell
- `components/dashboard/`: independent dashboard cards and chart
- `components/explore/`: topic browser and reusable topic card
- `components/ui/`: shared progress ring
- `data/`: sample student progress and topic catalogue

The AI tutor, lessons, achievements, and lab are not implemented. The sidebar labels them **Soon** instead of pretending they work.
