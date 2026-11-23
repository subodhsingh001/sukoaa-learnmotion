# SUKOAA Human Body video update

Four uploaded clips replace the matching files in `public/learning-videos/`:

- `4058-176749056 (1).mp4` -> anatomy-overview.mp4 (general body animation)
- `73922-548642461.mp4` -> brain.mp4 (brain model)
- `4360-178617258.mp4` -> heart.mp4 (heart and ECG)
- `4041-176748907.mp4` -> bones.mp4 (skeleton explanation)

The existing `BilingualScienceCinema.tsx` chapter player, English/Hindi explanation, and other lesson videos are retained. These are video demonstrations, not interactive 3D models.

Extract this ZIP into the Next.js project root, preserving paths and replacing files. Start `npm run dev`, then open `/learn/human-body`.

This package is based on the earlier SUKOAA User Videos Human/Plants integration. It does not include later PDF flipbook patches, so preserve those files in your project. No Next.js build or browser playback was performed here.
