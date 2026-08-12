# Gallery audio assets

Visitor place sound and night ambience default to a **gentle WebAudio pad**
(no file required) so demos work offline and without licensing friction.

## Optional CC0 loops

Place short royalty-free / CC0 files here if you prefer file-based loops:

| Path | Use |
|------|-----|
| `public/audio/night-pad.mp3` | Soft evening drone (loop) |
| `public/audio/room-tone.mp3` | Very quiet hall tone (loop) |
| `public/audio/footstep.mp3` | Soft step one-shot |

Wire paths in `src/features/viewer/lib/webaudio-ambience.ts` when assets exist.
Keep peaks low (−24 dB FS or quieter) for a museum walk.
