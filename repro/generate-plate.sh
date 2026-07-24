#!/usr/bin/env bash
# Generate the optional AI background plate (soft floating-tiles atmosphere) via
# Replicate seedance-2.0-fast, then blend it under the 3D overlay.
# BLOCKED until Replicate credit is topped up (last attempt: HTTP 402 insufficient credit).
#
# Usage:  REPLICATE_API_TOKEN=... bash generate-plate.sh
set -euo pipefail
TOKEN="${REPLICATE_API_TOKEN:?set REPLICATE_API_TOKEN}"
OUT="$(cd "$(dirname "$0")" && pwd)/out"
mkdir -p "$OUT"

PROMPT="Soft-focus, high-key 3D animation of many floating rounded white app-icon tiles and cards on a bright light-grey tiled surface, glossy matte plastic, shallow depth of field, gentle drifting light and soft ambient shadows, minimal clean corporate fintech aesthetic, slow smooth camera drift, dreamy and premium, no text, no logos, no people."

echo "Creating prediction..."
RESP=$(curl -s -X POST https://api.replicate.com/v1/models/bytedance/seedance-2.0-fast/predictions \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$(jq -n --arg p "$PROMPT" '{input:{prompt:$p,duration:5,resolution:"720p",aspect_ratio:"3:4",generate_audio:false}}')")
ID=$(echo "$RESP" | jq -r '.id // empty')
[ -z "$ID" ] && { echo "ERROR: $(echo "$RESP" | jq -r '.detail')"; exit 1; }

echo "Polling $ID ..."
while :; do
  P=$(curl -s -H "Authorization: Bearer $TOKEN" "https://api.replicate.com/v1/predictions/$ID")
  S=$(echo "$P" | jq -r '.status')
  echo "  status=$S"
  [ "$S" = "succeeded" ] && { URL=$(echo "$P" | jq -r '.output'); break; }
  [ "$S" = "failed" ] || [ "$S" = "canceled" ] && { echo "$P" | jq -r '.error'; exit 1; }
  sleep 6
done

curl -sL "$URL" -o "$OUT/plate.mp4"
echo "Plate saved: $OUT/plate.mp4"

# Blend the plate softly under the flat background of the 3D render (screen mode),
# then re-mux the audio.
ffmpeg -y -i "$OUT/repro_v6.mp4" -i "$OUT/plate.mp4" -i "$OUT/music.mp3" -filter_complex \
  "[1:v]scale=720:900,setsar=1,format=gbrp,colorchannelmixer=aa=0.18[pl];[0:v][pl]blend=all_mode=screen:shortest=1[v]" \
  -map "[v]" -map 2:a -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest "$OUT/repro_final_plate.mp4"
echo "Final with plate + audio: $OUT/repro_final_plate.mp4"
