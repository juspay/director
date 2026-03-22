#!/usr/bin/env bash
set -e

RUNWAY_KEY="key_5f754f2f65952c9141d63ab31a409c5dad6739f1707c83fc233b423285f8543b48f960b94dbd8cd44a7bda6d771d2a379f5b1f2c68f66390c75c78ddf7a86408"
OUTPUT_DIR="assets/broll"
mkdir -p "$OUTPUT_DIR"

generate_runway() {
  local name="$1"
  local prompt="$2"
  local duration="${3:-10}"

  echo "[$name] Submitting to Runway..."

  local RESULT=$(curl -s -X POST "https://api.dev.runwayml.com/v1/text_to_video" \
    -H "Authorization: Bearer $RUNWAY_KEY" \
    -H "Content-Type: application/json" \
    -H "X-Runway-Version: 2024-11-06" \
    -d "{
      \"model\": \"gen4.5\",
      \"prompt\": $(echo "$prompt" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read().strip()))'),
      \"duration\": $duration,
      \"ratio\": \"1280:720\"
    }")

  local TASK_ID=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

  if [ -z "$TASK_ID" ]; then
    echo "[$name] ERROR: No task ID returned"
    echo "$RESULT"
    return 1
  fi

  echo "[$name] Task ID: $TASK_ID"
  echo "$TASK_ID" > "$OUTPUT_DIR/${name}.taskid"

  # Poll for completion
  local MAX_POLLS=120  # 10 min max
  local POLL=0
  while [ $POLL -lt $MAX_POLLS ]; do
    sleep 5
    POLL=$((POLL + 1))

    local STATUS_RESULT=$(curl -s "https://api.dev.runwayml.com/v1/tasks/$TASK_ID" \
      -H "Authorization: Bearer $RUNWAY_KEY" \
      -H "X-Runway-Version: 2024-11-06")

    local STATUS=$(echo "$STATUS_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)

    if [ "$STATUS" = "SUCCEEDED" ]; then
      local VIDEO_URL=$(echo "$STATUS_RESULT" | python3 -c "
import sys,json
d = json.load(sys.stdin)
output = d.get('output', [])
if output: print(output[0])
else: print('')
" 2>/dev/null)

      if [ -n "$VIDEO_URL" ]; then
        echo "[$name] Downloading..."
        curl -s -L -o "$OUTPUT_DIR/${name}.mp4" "$VIDEO_URL"
        local SIZE=$(stat -f%z "$OUTPUT_DIR/${name}.mp4" 2>/dev/null || echo "0")
        echo "[$name] Done! ($SIZE bytes)"
        return 0
      fi
    elif [ "$STATUS" = "FAILED" ]; then
      echo "[$name] FAILED"
      echo "$STATUS_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('failure','unknown'))" 2>/dev/null
      return 1
    else
      echo "[$name] Status: $STATUS (poll $POLL)"
    fi
  done

  echo "[$name] TIMEOUT after $MAX_POLLS polls"
  return 1
}

echo "=========================================="
echo "  Generating B-Roll Clips via Runway API"
echo "=========================================="
echo ""

# ACT 2 CLIPS (need ~32s total, generating 5 clips of 10s each for variety)

generate_runway "act2_clip1" \
  "Cinematic wide shot of diverse engineers collaborating in a modern glass-walled meeting room, warm ambient lighting, screens showing architectural diagrams in the background, professional tech company, dark moody cinematic color grading, shallow depth of field" \
  10 &

generate_runway "act2_clip2" \
  "Abstract cinematic visualization of artificial intelligence transforming lines of code into glowing architectural blueprints, dark background with blue and amber light trails flowing through a network of connected nodes, futuristic tech aesthetic" \
  10 &

generate_runway "act2_clip3" \
  "Close-up of a whiteboard filled with software architecture diagrams and flowcharts, a hand drawing connections between components, warm office lighting, shallow depth of field, cinematic documentary style" \
  10 &

generate_runway "act2_clip4" \
  "Cinematic shot of code being automatically written on a dark IDE screen, cursor moving on its own typing elegant code, green syntax highlighting, dark room with monitor glow, futuristic automated programming aesthetic" \
  10 &

# ACT 3 CLIPS (need ~9s total)

generate_runway "act3_clip1" \
  "Overhead cinematic shot of a developer's desk with five different screens showing JIRA, code editor, terminal, Slack, and browser, hands moving between keyboards, stressful fragmented workflow, dark moody lighting, quick cuts feeling" \
  10 &

# Wait for all background jobs
echo ""
echo "Waiting for all generations to complete..."
wait

echo ""
echo "=========================================="
echo "  All B-Roll Generated!"
echo "=========================================="
echo ""
ls -lh "$OUTPUT_DIR"/*.mp4 2>/dev/null
