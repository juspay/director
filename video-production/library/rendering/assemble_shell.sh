# Origin: assembly/assemble.sh — extracted to library on 2026-03-23
#!/usr/bin/env bash
set -e

BASE_DIR="/Users/sachinsharma/Developer/Official/curator-fork/curator/docs/plans/video-production"
TRIMMED_DIR="$BASE_DIR/assembly/trimmed"
SCENES_DIR="$BASE_DIR/assembly/scenes"
CONCAT_FILE="$TRIMMED_DIR/concat_list.txt"
NO_MUSIC_OUTPUT="$BASE_DIR/assembly/no_music.mp4"
FINAL_OUTPUT="$BASE_DIR/assembly/tara_final.mp4"
BGM_FILE="$BASE_DIR/assets/music/background_music_looped.mp3"

# Video encoding settings
VCODEC="-c:v libx264 -preset medium -crf 18"
SCALE_FILTER="scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2"

# Create output directories
mkdir -p "$TRIMMED_DIR"
mkdir -p "$SCENES_DIR"

# Define scenes: id|video|audio (audio can be "null" for no voiceover)
SCENES=(
  "act1_hook|assembly/scenes/act1_hook.mp4|assets/voiceover/act1_hook.mp3"
  "act2_vision|assembly/scenes/act2_vision.mp4|assets/voiceover/act2_vision.mp3"
  "act3_problem|assembly/scenes/act3_problem.mp4|assets/voiceover/act3_problem.mp3"
  "act4_meet_tara|assembly/scenes/act4_meet_tara.mp4|assets/voiceover/act4_meet_tara.mp3"
  "act5a_race_condition|assembly/scenes/act5a_race_condition.mp4|assets/voiceover/act5a_race_condition.mp3"
  "act5b_async_loop|assembly/scenes/act5b_async_loop.mp4|assets/voiceover/act5b_async_loop.mp3"
  "act5c_coding_agent|assembly/scenes/act5c_coding_agent.mp4|assets/voiceover/act5c_coding_agent.mp3"
  "act6_numbers|assembly/scenes/act6_numbers.mp4|null"
  "act7_roadmap|assembly/scenes/act7_roadmap.mp4|null"
  "act8_cta|assembly/scenes/act8_cta.mp4|assets/voiceover/act8_cta.mp3"
)

echo "=========================================="
echo "  Tara Video Assembly Pipeline"
echo "=========================================="
echo ""

# Clear concat list
> "$CONCAT_FILE"

SCENE_NUM=0
for SCENE_ENTRY in "${SCENES[@]}"; do
  SCENE_NUM=$((SCENE_NUM + 1))
  IFS='|' read -r SCENE_ID VIDEO_REL AUDIO_REL <<< "$SCENE_ENTRY"

  VIDEO="$BASE_DIR/$VIDEO_REL"
  OUTPUT="$TRIMMED_DIR/${SCENE_ID}.mp4"

  echo "------------------------------------------"
  echo "[$SCENE_NUM/${#SCENES[@]}] Processing: $SCENE_ID"
  echo "------------------------------------------"

  if [ ! -f "$VIDEO" ]; then
    echo "  ERROR: Video file not found: $VIDEO"
    exit 1
  fi

  if [ "$AUDIO_REL" != "null" ]; then
    AUDIO="$BASE_DIR/$AUDIO_REL"

    if [ ! -f "$AUDIO" ]; then
      echo "  ERROR: Audio file not found: $AUDIO"
      exit 1
    fi

    # Get audio duration
    DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO")
    echo "  Audio duration: ${DURATION}s"
    echo "  Trimming video to match audio + combining..."

    ffmpeg -y -i "$VIDEO" -i "$AUDIO" \
      -t "$DURATION" \
      -vf "$SCALE_FILTER" \
      $VCODEC \
      -c:a aac -b:a 192k \
      -shortest \
      "$OUTPUT" \
      2>/dev/null

    echo "  Done: $OUTPUT"
  else
    echo "  No voiceover — scaling video only..."

    ffmpeg -y -i "$VIDEO" \
      -vf "$SCALE_FILTER" \
      $VCODEC \
      -an \
      "$OUTPUT" \
      2>/dev/null

    echo "  Done: $OUTPUT"
  fi

  # Add to concat list
  echo "file '$OUTPUT'" >> "$CONCAT_FILE"
done

echo ""
echo "=========================================="
echo "  Concatenating all scenes"
echo "=========================================="

ffmpeg -y -f concat -safe 0 -i "$CONCAT_FILE" \
  -c copy \
  "$NO_MUSIC_OUTPUT" \
  2>/dev/null

echo "  Concatenated: $NO_MUSIC_OUTPUT"

echo ""
echo "=========================================="
echo "  Adding background music (12% volume)"
echo "=========================================="

if [ ! -f "$BGM_FILE" ]; then
  echo "  WARNING: Background music not found: $BGM_FILE"
  echo "  Copying concatenated output as final..."
  cp "$NO_MUSIC_OUTPUT" "$FINAL_OUTPUT"
else
  ffmpeg -y -i "$NO_MUSIC_OUTPUT" -i "$BGM_FILE" \
    -filter_complex "[1:a]volume=0.12[bgm];[0:a][bgm]amix=inputs=2:duration=first[aout]" \
    -map 0:v -map "[aout]" \
    -c:v copy -c:a aac -b:a 192k \
    "$FINAL_OUTPUT" \
    2>/dev/null

  echo "  Final output: $FINAL_OUTPUT"
fi

echo ""
echo "=========================================="
echo "  Assembly complete!"
echo "=========================================="
echo "  Output: $FINAL_OUTPUT"
echo ""
