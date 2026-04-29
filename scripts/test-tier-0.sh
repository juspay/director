#!/usr/bin/env bash
# Tier 0 — no-key smoke tests. See TESTING.md for context.
#
# Verifies the parts of the pipeline that don't need any provider API keys:
#   • Edge-TTS voiceover (Microsoft, free)
#   • Python DSP scripts (synthesis, SFX, mix, analyze)
#
# Output goes to ./out/tier0/. Each step prints PASS / FAIL on its own line.
# Exit code reflects overall success.

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/out/tier0"
mkdir -p "$OUT"

PASS=0
FAIL=0

check_file() {
  local path="$1"
  local min_bytes="${2:-100}"
  if [[ ! -f "$path" ]]; then
    printf "  expected file missing: %s\n" "$path" >&2
    return 1
  fi
  local size
  size=$(stat -f%z "$path" 2>/dev/null || stat -c%s "$path")
  if (( size < min_bytes )); then
    printf "  file too small (%d bytes < %d): %s\n" "$size" "$min_bytes" "$path" >&2
    return 1
  fi
  printf "  %s (%d bytes)\n" "$path" "$size"
}
export -f check_file

step() {
  local name="$1"
  shift
  printf "\n→ %s\n" "$name"
  if "$@"; then
    printf "  PASS  %s\n" "$name"
    PASS=$((PASS + 1))
  else
    printf "  FAIL  %s\n" "$name"
    FAIL=$((FAIL + 1))
  fi
}

# ---- 0.0 prerequisites --------------------------------------------------
step "0.0  Prerequisites" bash -c '
  for cmd in node python3 ffmpeg edge-tts; do
    command -v "$cmd" >/dev/null || { echo "  MISSING: $cmd"; exit 1; }
  done
  python3 -c "import numpy, scipy, librosa, pretty_midi" 2>/dev/null || {
    echo "  MISSING Python deps. Run: pip install -r scripts/python/requirements.txt"
    exit 1
  }
  echo "  node $(node --version), python $(python3 --version 2>&1 | awk "{print \$2}"), ffmpeg + edge-tts ok"
'

# ---- 0.1 Edge-TTS -------------------------------------------------------
step "0.1  Edge-TTS voiceover" bash -c "
  cd '$ROOT' &&
  node --import tsx -e \"
    import { generate } from './src/voiceover/edgetts.ts';
    await generate('Director Tier zero voiceover test, scene one.', '$OUT/voiceover.mp3');
  \" &&
  check_file '$OUT/voiceover.mp3' 5000
"

# ---- 0.2 Synthesize music ----------------------------------------------
step "0.2  Python synthesize-music.py" bash -c "
  cd '$ROOT' &&
  python3 scripts/python/synthesize-music.py --output '$OUT/music.wav' >/dev/null &&
  check_file '$OUT/music.wav' 1000000
"

# ---- 0.3 Synthesize SFX ------------------------------------------------
step "0.3  Python synthesize-sfx.py" bash -c "
  cd '$ROOT' &&
  python3 scripts/python/synthesize-sfx.py --output-dir '$OUT/sfx' >/dev/null &&
  count=\$(ls '$OUT/sfx'/*.wav 2>/dev/null | wc -l | tr -d ' ') &&
  [[ \$count -ge 3 ]] &&
  printf '  generated %d SFX files\n' \$count
"

# ---- 0.4 Analyze audio --------------------------------------------------
step "0.4  Python analyze-audio.py" bash -c "
  cd '$ROOT' &&
  python3 scripts/python/analyze-audio.py --audio '$OUT/music.wav' --json > '$OUT/analysis.json' &&
  python3 -c \"
import json
with open('$OUT/analysis.json') as f:
    data = json.load(f)
score = data.get('composite_score')
assert score is not None, 'composite_score missing'
assert 0 <= score <= 100, f'composite_score {score} out of range'
print(f'  composite_score: {score:.2f}/100')
print(f'  features: {len([k for k in data if k != \\\"composite_score\\\"])}')
\"
"

# ---- 0.5 Mix audio (graceful degradation if optional deps missing) ----
step "0.5  Python mix-audio.py" bash -c "
  cd '$ROOT' &&
  ffmpeg -y -i '$OUT/voiceover.mp3' -ar 44100 -ac 2 '$OUT/voiceover.wav' >/dev/null 2>&1 &&
  python3 scripts/python/mix-audio.py \
    --music '$OUT/music.wav' \
    --voiceover '$OUT/voiceover.wav' \
    --output '$OUT/mixed.wav' \
    --duck-db -9 &&
  check_file '$OUT/mixed.wav' 100000
"

# ---- summary ------------------------------------------------------------
echo
echo "════════════════════════════════════════════════════════"
printf "  Tier 0 results:  %d pass / %d fail\n" "$PASS" "$FAIL"
echo "  Artifacts in:     $OUT"
echo "════════════════════════════════════════════════════════"

(( FAIL == 0 ))
