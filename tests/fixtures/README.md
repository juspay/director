# Test Fixtures

| File | Purpose | Notes |
|------|---------|-------|
| `script.md` | Two-scene script for pipeline runs | Used by Tier 0–3 tests |
| `portrait.jpg` | Placeholder face image for D-ID avatar tests | Solid color — swap in a real face for visual quality runs |
| `portrait.mp4` | Placeholder face video for MuseTalk lip-sync tests | 2 s solid color — swap in a real face video for visual quality runs |

The placeholders exist so the integration plumbing (HTTP requests, file paths, payload shapes) can be exercised without copyrighted assets. Real face inputs are only needed when validating output quality, not when validating that the integration *works*.
