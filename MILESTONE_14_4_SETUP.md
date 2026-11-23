# SUKOAA Milestone 14.4 - Chapter UX correction

Merge the project files into a backed-up installation. Preserve backend/.env, uploads, Docker database volumes and local settings. Restart FastAPI and Next.js.

Changes:
- Chapter detail uses two tabs: Chapter Information and Learning Materials.
- Extracted text is returned by the API and can be previewed in the UI.
- Book chapter list has an explicit 'Sync titles & pages from contents' action, which corrects incorrectly imported chapter titles and page ranges from the PDF contents page. It clears previous extracted text for changed ranges; extract again afterward.
- Multiple assets of each kind continue to be supported by the existing ChapterAsset model.
- AI animation/video generation is NOT implemented; manual entry remains optional.

Test with the Gurukul EVS sample: go to /book-workspace/1 (adjust book ID), click Sync titles & pages from contents, then open Chapter 1 and confirm About Myself, pages 5-8. Click Extract chapter text, then Show extracted chapter text. PDF page offsets may differ in other books and should be checked before extraction.

Backend Python syntax was checked. Frontend TypeScript compilation and end-to-end browser/database integration were not verified because local dependencies/types are incomplete. No database migration is required for these changes.
