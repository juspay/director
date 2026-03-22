#!/usr/bin/env bash
set -e

API_KEY="sk_417d218933896e24b378ece462e632bfd812fcc4273a1177"
VOICE_ID="1qEiC6qsybMkmnNdVMbK"
MODEL_ID="eleven_multilingual_v2"
OUTPUT_DIR="assets/voiceover"

generate() {
  local name="$1"
  local text="$2"
  local outfile="$OUTPUT_DIR/${name}.mp3"

  echo "Generating: $name"
  echo "  Text: ${text:0:80}..."

  curl -s -X POST \
    "https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}" \
    -H "xi-api-key: ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": $(echo "$text" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))'),
      \"model_id\": \"${MODEL_ID}\",
      \"voice_settings\": {
        \"stability\": 0.5,
        \"similarity_boost\": 0.75,
        \"style\": 0.2
      }
    }" \
    --output "$outfile"

  # Check if we got valid audio
  local size=$(stat -f%z "$outfile" 2>/dev/null || echo "0")
  if [ "$size" -lt 1000 ]; then
    echo "  ERROR: File too small ($size bytes), may have failed"
    cat "$outfile"
    echo ""
    return 1
  fi

  local dur=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$outfile")
  echo "  Done: ${dur}s ($size bytes)"
  echo ""
}

echo "=========================================="
echo "  Regenerating ALL voiceovers"
echo "=========================================="
echo ""

# ACT 1: THE HOOK — matches actual Slack announcement opening
generate "act1_hook" \
"One year ago, we asked a question: What if engineering was less about typing code, and more about the creative pursuit of solving problems? Today, that question has an answer."

# ACT 2: THE VISION — origin story
generate "act2_vision" \
"A year ago, we held an offline meeting with multiple engineering teams. One question on the table: how does AI actually change the way we build software? We created a playbook. Shared it across teams. The thesis was simple. The shift from coder to engineer to builder, where the creative work becomes the primary work. Discussions, debates, architecture, planning. Implementation gets offloaded. That wasn't a prediction. It was a design goal."

# ACT 3: THE PROBLEM
generate "act3_problem" \
"But the tools stayed fragmented. Context lived in five different places. Engineers spent more time navigating tools than solving problems."

# ACT 4: MEET TARA
generate "act4_meet_tara" \
"Meet Tara. Threaded AI Resource Agent. Tara means Star in Hindi. A guiding light. She lives in your Slack. She reads your code, your JIRA tickets, your PRs, your screenshots. She plans with you. She debates with you. And when you're ready, she builds for you."

# ACT 5A: RACE CONDITION
generate "act5a_race_condition" \
"An engineer suspected a race condition between two services. Tara's response: Critical Race Condition Confirmed. She identified the exact Redis deduplication gap. Named the specific functions. Generated a full root cause analysis. Not a suggestion. A diagnosis. With receipts."

# ACT 5B: ASYNC LOOP
generate "act5b_async_loop" \
"A PM needed a feature built. Tara reviewed the codebase, found thirteen existing tools, and built a plan. An engineer reviewed it. Caught an architectural issue. Tara corrected. The engineer said, make it real. Task complete. PR created. Eighty-seven messages. Multiple people. Fully async."

# ACT 5C: CODING AGENT
generate "act5c_coding_agent" \
"Tell Tara what to build. She clones the repo. Studies your team's coding patterns. Reads JIRA tickets for context. Implements, verifies, commits, pushes, creates a pull request. Real-time progress. Right in Slack."

# ACT 8: CTA
generate "act8_cta" \
"Tag Tara in any Slack channel. Build what matters."

echo "=========================================="
echo "  All voiceovers generated!"
echo "=========================================="

# Print summary
echo ""
echo "Durations:"
for f in $OUTPUT_DIR/act*.mp3; do
  dur=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$f")
  echo "  $(basename $f): ${dur}s"
done
