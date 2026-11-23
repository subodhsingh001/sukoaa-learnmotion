SUKOAA PDF Flipbook Reader v2

Extract this ZIP into your Next.js project root, replacing matching files.

Run:
  npm install pdfjs-dist@4.10.38
  node scripts/copy-pdf-worker.mjs
  npm run build
  npm run dev

Open http://localhost:3000/learn/books

Improvements:
- Animated 3D page-turning sheet (760 ms) on mouse wheel, swipe and page buttons.
- Read pages extracts text from both visible PDF pages.
- Stop cancels current speech, clears pending chunks, and resets UI.
- Pause/Resume and restart narration.
- Short speech chunks for browser reliability.

Notes: The page turn uses CSS 3D rotation, not a physical mesh curl. Read-aloud requires a PDF text layer; scanned books need OCR. Hindi speech requires a browser Hindi voice.
