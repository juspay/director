# Origin: v8 — extracted to library on 2026-03-23
#!/usr/bin/env python3
"""Generate voiceover for TARA Video v8 using Google Cloud TTS Chirp3-HD with SSML.

Uses the Aoede voice (en-IN-Chirp3-HD-Aoede) with SSML markup for expressive
delivery — emphasis on key phrases, dramatic pauses, and prosody variations.

Requirements:
    pip install google-cloud-texttospeech

Credentials:
    Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account JSON,
    or configure Application Default Credentials.

Project: dev-ai-beta
"""

import os
import sys
import time
from pathlib import Path

try:
    from google.cloud import texttospeech
except ImportError:
    print("ERROR: Install google-cloud-texttospeech: pip3 install google-cloud-texttospeech")
    sys.exit(1)


# ─── Configuration ───────────────────────────────────────────────────────────

VOICE_NAME = "en-IN-Chirp3-HD-Aoede"
LANGUAGE_CODE = "en-IN"
PROJECT_ID = "dev-ai-beta"
SPEAKING_RATE = 0.92   # Matches the rate used for the original Chirp3 samples
# Note: Chirp3-HD does NOT support pitch parameters in AudioConfig.
# Pitch modulation is done via SSML <prosody pitch="..."> tags instead.

# Output
OUTPUT_DIR = Path(__file__).parent.parent / "remotion" / "public" / "voiceover"
OUTPUT_FILENAME = "voice_test_chirp3_aoede_ssml.mp3"


# ─── SSML Narration ─────────────────────────────────────────────────────────
#
# The full v8 narration with SSML markup for expressive delivery:
#   - <emphasis level="strong"> on key impactful phrases
#   - <break time="500ms"/> after dramatic moments
#   - <prosody rate="slow"> for moments of weight/gravity
#   - <prosody rate="fast"> for the rapid execution section
#   - <prosody pitch="+1st"> for energy builds
#
# Note: Chirp3-HD processes SSML tags. Tags it doesn't support are silently
# ignored, so it's safe to include them all.

SSML_NARRATION = """<speak>

<emphasis level="strong">Thirteen minutes.</emphasis><break time="500ms"/>

Someone from marketing drops a screenshot of a typo in Slack
— thirteen minutes later, the exact file is identified, a JIRA ticket is created,
and a pull request is opened. No IDE opened. No ticket reassigned
— because there's something in that Slack channel that changes how the whole thing works.

<break time="300ms"/>

Tara. She lives in your team's Slack, reads everything you share
— screenshots, code, tickets, designs, spreadsheets
— and she works the way your team already works.

She reads the screenshot, searches the codebase across three repositories,
cross-references JIRA tickets, and comes back with a diagnosis
— the exact file, the root cause, a plan to fix it.

<emphasis level="strong">Not a suggestion. A diagnosis.</emphasis><break time="500ms"/>

And now the thread becomes the workspace.
A PM adds a requirement. An engineer flags an edge case.
A designer shares updated specs. Each message sharpens the plan
— and Tara adapts with every reply.

<prosody rate="slow">This is the part that matters
— the thinking, the debating, the human judgment that no AI can replace</prosody>
— all happening asynchronously, in one conversation, with no one waiting for anyone.

<break time="300ms"/>

<prosody pitch="+1st">"Make it real."</prosody> The plan splits
— three branches, three implementations, running in parallel.

Tara clones the repos, studies your team's patterns
— commit style, architecture, conventions
— and writes code that looks like your team wrote it.

<prosody rate="fast">Implements. Tests. Opens pull requests.</prosody>

<emphasis level="strong">Three PRs. One conversation.</emphasis><break time="500ms"/>

She does this because she's connected to everything you already use
— JIRA, Bitbucket, GitHub, Figma
— fifty tools, all through Slack. No new tools. No context-switching.

She reads PDFs, images, code in fifty languages
— and everything she does flows back into the thread
as tickets, reports, pull requests
— natural outputs of the conversation.

<break time="200ms"/>

From a screenshot to production, in minutes.
And this is just Phase Zero.

Coder becomes engineer. Engineer becomes builder.
Less time typing, more time thinking, designing, deciding
— and the implementation happens in parallel,
right where the conversation started.

<break time="300ms"/>

Tara. <emphasis level="strong">Build what matters.</emphasis>

</speak>"""


def load_env():
    """Load .env from project root if credentials not already set."""
    # Check multiple .env locations
    env_paths = [
        Path(__file__).parent.parent / ".env",                    # v8/.env
        Path(__file__).parent.parent.parent / ".env",             # video-production/.env
        Path(__file__).parent.parent.parent.parent.parent.parent / ".env",  # curator root/.env
    ]

    for env_path in env_paths:
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, _, value = line.partition("=")
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        if key and value and key not in os.environ:
                            os.environ[key] = value


def generate_voiceover_ssml():
    """Generate the voiceover using Google Cloud TTS Chirp3-HD with SSML."""

    load_env()

    # Verify credentials
    creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if creds_path:
        print(f"Using credentials: {creds_path}")
        if not Path(creds_path).exists():
            print(f"ERROR: Credentials file not found: {creds_path}")
            sys.exit(1)
    else:
        print("WARNING: GOOGLE_APPLICATION_CREDENTIALS not set. Using Application Default Credentials.")

    # Create output directory
    output_dir = OUTPUT_DIR
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / OUTPUT_FILENAME

    print(f"\n{'='*60}")
    print(f"  Google Cloud TTS Chirp3-HD — SSML Voiceover Generation")
    print(f"{'='*60}")
    print(f"  Voice:         {VOICE_NAME}")
    print(f"  Language:      {LANGUAGE_CODE}")
    print(f"  Speaking rate: {SPEAKING_RATE}")
    print(f"  Pitch:         via SSML (Chirp3-HD doesn't support AudioConfig pitch)")
    print(f"  Output:        {output_path}")
    print(f"  SSML length:   {len(SSML_NARRATION)} chars")
    print(f"{'='*60}\n")

    # Initialize client
    print("  Initializing Google Cloud TTS client...")
    client = texttospeech.TextToSpeechClient()

    # Build request
    synthesis_input = texttospeech.SynthesisInput(ssml=SSML_NARRATION)

    voice_params = texttospeech.VoiceSelectionParams(
        language_code=LANGUAGE_CODE,
        name=VOICE_NAME,
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        sample_rate_hertz=24000,
        speaking_rate=SPEAKING_RATE,
    )

    # Generate
    print("  Generating audio (this may take 10-30 seconds)...")
    start_time = time.time()

    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice_params,
        audio_config=audio_config,
    )

    elapsed = time.time() - start_time
    audio_size = len(response.audio_content)

    # Write output
    output_path.write_bytes(response.audio_content)

    print(f"  Done in {elapsed:.1f}s")
    print(f"  File size: {audio_size / 1024:.0f} KB ({audio_size:,} bytes)")
    print(f"  Output: {output_path}")

    # Try to get duration using ffprobe
    print(f"\n  Measuring duration...")
    try:
        import subprocess
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", str(output_path)],
            capture_output=True, text=True, timeout=10,
        )
        if result.returncode == 0 and result.stdout.strip():
            duration_s = float(result.stdout.strip())
            minutes = int(duration_s // 60)
            seconds = duration_s % 60
            print(f"  Duration: {minutes}:{seconds:05.2f} ({duration_s:.2f}s)")
        else:
            print(f"  Could not measure duration (ffprobe error)")
    except FileNotFoundError:
        print(f"  ffprobe not found — install ffmpeg to measure duration")
        print(f"  Run: ffprobe -v error -show_entries format=duration -of csv=p=0 {output_path}")
    except Exception as e:
        print(f"  Duration measurement failed: {e}")

    print(f"\n{'='*60}")
    print(f"  SUCCESS: SSML voiceover generated")
    print(f"  Compare with original: voice_test_google_chirp3_aoede_hq.mp3")
    print(f"{'='*60}\n")

    return output_path


if __name__ == "__main__":
    generate_voiceover_ssml()
