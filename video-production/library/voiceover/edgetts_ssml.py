# Origin: v8 — extracted to library on 2026-03-23
#!/usr/bin/env python3
"""Generate SSML-enhanced voiceover using Edge-TTS with Neerja (Indian English).

Edge-TTS uses Microsoft Azure Neural TTS under the hood.
en-IN-NeerjaNeural supports rich SSML including:
  - <emphasis level="strong|moderate|reduced"> for stress on key words
  - <break time="500ms"/> for dramatic pauses
  - <prosody rate="slow" pitch="+2st"> for prosody variations
  - <say-as interpret-as="characters"> for spelling out acronyms
  - <mstts:express-as style="..."> for emotion styles (Neerja supports some)

This script generates multiple SSML takes for comparison:
  1. ssml_expressive — emphasis + pauses + prosody variations
  2. ssml_dramatic   — stronger pauses, slower pace at key moments
  3. ssml_energetic  — faster pace with emphasis bursts

Usage:
    python3 generate_voiceover_edgetts_ssml.py
"""

import asyncio
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("Install edge-tts:  pip install edge-tts")
    sys.exit(1)

VOICE = "en-IN-NeerjaNeural"
OUTPUT_DIR = Path(__file__).parent.parent / "remotion" / "public" / "voiceover"

# ---------------------------------------------------------------------------
# SSML Narration — Full v8 script with expressive markup
#
# Key SSML techniques used:
#   1. <emphasis> on "Tara", "thirteen minutes", key impact phrases
#   2. <break> after dramatic reveals and section transitions
#   3. <prosody rate="slow"> for gravitas moments
#   4. <prosody rate="fast"> for the rapid execution sequence
#   5. <prosody pitch="+2st"> for energy/excitement lifts
#   6. Natural paragraph breaks with <break> for breathing room
# ---------------------------------------------------------------------------

SSML_EXPRESSIVE = """<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN">
  <voice name="en-IN-NeerjaNeural">
    <prosody rate="-5%" pitch="+0Hz">

      <emphasis level="strong">Thirteen minutes.</emphasis>
      <break time="600ms"/>

      Someone from marketing drops a screenshot of a typo in Slack
      <break time="200ms"/>
      — thirteen minutes later, the exact file is identified,
      a JIRA ticket is created,
      and a pull request is opened.
      <break time="300ms"/>
      No IDE opened. No ticket reassigned
      <break time="200ms"/>
      — because there's something in that Slack channel that changes how the whole thing works.

      <break time="700ms"/>

      <prosody rate="-10%" pitch="+1st">
        <emphasis level="strong">Tara.</emphasis>
      </prosody>
      <break time="400ms"/>

      She lives in your team's Slack, reads everything you share
      — screenshots, code, tickets, designs, spreadsheets
      — and she works the way your team already works.

      <break time="400ms"/>

      She reads the screenshot, searches the codebase across three repositories,
      cross-references JIRA tickets, and comes back with a diagnosis
      <break time="200ms"/>
      — the exact file, the root cause, a plan to fix it.

      <break time="400ms"/>

      <prosody rate="-15%">
        <emphasis level="strong">Not a suggestion.</emphasis>
        <break time="300ms"/>
        <emphasis level="strong">A diagnosis.</emphasis>
      </prosody>

      <break time="700ms"/>

      And now the thread becomes the workspace.
      <break time="200ms"/>
      A PM adds a requirement. An engineer flags an edge case.
      A designer shares updated specs. Each message sharpens the plan
      — and <emphasis level="moderate">Tara</emphasis> adapts with every reply.

      <break time="400ms"/>

      <prosody rate="-10%">
        This is the part that matters
        — the thinking, the debating, the human judgment that no AI can replace
      </prosody>
      <break time="200ms"/>
      — all happening asynchronously, in one conversation, with no one waiting for anyone.

      <break time="600ms"/>

      <prosody pitch="+2st" rate="+5%">
        "Make it real."
      </prosody>
      <break time="300ms"/>
      The plan splits
      — three branches, three implementations, running in parallel.

      <break time="300ms"/>

      <emphasis level="moderate">Tara</emphasis> clones the repos, studies your team's patterns
      — commit style, architecture, conventions
      — and writes code that looks like your team wrote it.

      <break time="300ms"/>

      <prosody rate="+10%">
        Implements. Tests. Opens pull requests.
      </prosody>

      <break time="400ms"/>

      <emphasis level="strong">Three PRs. One conversation.</emphasis>

      <break time="600ms"/>

      She does this because she's connected to everything you already use
      <break time="200ms"/>
      — JIRA, Bitbucket, GitHub, Figma
      <break time="200ms"/>
      — fifty tools, all through Slack. No new tools. No context-switching.

      <break time="300ms"/>

      She reads PDFs, images, code in fifty languages
      — and everything she does flows back into the thread
      as tickets, reports, pull requests
      — natural outputs of the conversation.

      <break time="500ms"/>

      <prosody rate="-5%">
        From a screenshot to production, in minutes.
      </prosody>
      <break time="300ms"/>
      And this is just <emphasis level="moderate">Phase Zero.</emphasis>

      <break time="600ms"/>

      Coder becomes engineer. Engineer becomes builder.
      <break time="200ms"/>
      Less time typing, more time thinking, designing, deciding
      — and the implementation happens in parallel,
      right where the conversation started.

      <break time="700ms"/>

      <prosody rate="-15%" pitch="+1st">
        <emphasis level="strong">Tara.</emphasis>
        <break time="500ms"/>
        <emphasis level="strong">Build what matters.</emphasis>
      </prosody>

    </prosody>
  </voice>
</speak>"""


# Dramatic version — stronger pauses, more contrast between fast/slow
SSML_DRAMATIC = """<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN">
  <voice name="en-IN-NeerjaNeural">
    <prosody rate="-8%" pitch="+0Hz">

      <emphasis level="strong">Thirteen minutes.</emphasis>
      <break time="800ms"/>

      Someone from marketing drops a screenshot of a typo in Slack
      <break time="300ms"/>
      — thirteen minutes later, the exact file is identified,
      a JIRA ticket is created,
      and a pull request is opened.
      <break time="400ms"/>
      No IDE opened. No ticket reassigned
      <break time="300ms"/>
      — because there's something in that Slack channel
      <break time="200ms"/>
      that changes how the whole thing works.

      <break time="900ms"/>

      <prosody rate="-20%" pitch="+2st">
        <emphasis level="strong">Tara.</emphasis>
      </prosody>
      <break time="600ms"/>

      She lives in your team's Slack, reads everything you share
      — screenshots, code, tickets, designs, spreadsheets
      — and she works the way your team already works.

      <break time="500ms"/>

      She reads the screenshot, searches the codebase across three repositories,
      cross-references JIRA tickets, and comes back with a diagnosis
      <break time="300ms"/>
      — the exact file, the root cause, a plan to fix it.

      <break time="500ms"/>

      <prosody rate="-25%">
        <emphasis level="strong">Not a suggestion.</emphasis>
        <break time="500ms"/>
        <emphasis level="strong">A diagnosis.</emphasis>
      </prosody>

      <break time="900ms"/>

      And now the thread becomes the workspace.
      <break time="300ms"/>
      A PM adds a requirement. An engineer flags an edge case.
      A designer shares updated specs. Each message sharpens the plan
      — and <emphasis level="strong">Tara</emphasis> adapts with every reply.

      <break time="500ms"/>

      <prosody rate="-15%">
        This is the part that matters
        <break time="200ms"/>
        — the thinking, the debating, the human judgment that no AI can replace
      </prosody>
      <break time="300ms"/>
      — all happening asynchronously, in one conversation, with no one waiting for anyone.

      <break time="800ms"/>

      <prosody pitch="+3st" rate="+5%">
        "Make it real."
      </prosody>
      <break time="500ms"/>
      The plan splits
      — three branches, three implementations, running in parallel.

      <break time="400ms"/>

      <emphasis level="moderate">Tara</emphasis> clones the repos, studies your team's patterns
      — commit style, architecture, conventions
      — and writes code that looks like your team wrote it.

      <break time="400ms"/>

      <prosody rate="+15%">
        Implements. Tests. Opens pull requests.
      </prosody>

      <break time="500ms"/>

      <prosody rate="-10%">
        <emphasis level="strong">Three PRs. One conversation.</emphasis>
      </prosody>

      <break time="800ms"/>

      She does this because she's connected to everything you already use
      <break time="300ms"/>
      — JIRA, Bitbucket, GitHub, Figma
      <break time="200ms"/>
      — fifty tools, all through Slack.
      <break time="200ms"/>
      No new tools. No context-switching.

      <break time="400ms"/>

      She reads PDFs, images, code in fifty languages
      — and everything she does flows back into the thread
      as tickets, reports, pull requests
      — natural outputs of the conversation.

      <break time="600ms"/>

      <prosody rate="-10%">
        From a screenshot to production, in minutes.
      </prosody>
      <break time="400ms"/>
      And this is just <emphasis level="strong">Phase Zero.</emphasis>

      <break time="800ms"/>

      Coder becomes engineer.
      <break time="200ms"/>
      Engineer becomes builder.
      <break time="300ms"/>
      Less time typing, more time thinking, designing, deciding
      — and the implementation happens in parallel,
      right where the conversation started.

      <break time="900ms"/>

      <prosody rate="-25%" pitch="+2st">
        <emphasis level="strong">Tara.</emphasis>
        <break time="600ms"/>
        <emphasis level="strong">Build what matters.</emphasis>
      </prosody>

    </prosody>
  </voice>
</speak>"""


# Energetic version — slightly faster base, punchy emphasis
SSML_ENERGETIC = """<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN">
  <voice name="en-IN-NeerjaNeural">
    <prosody rate="+0%" pitch="+1Hz">

      <emphasis level="strong">Thirteen minutes.</emphasis>
      <break time="500ms"/>

      Someone from marketing drops a screenshot of a typo in Slack
      — thirteen minutes later, the exact file is identified,
      a JIRA ticket is created,
      and a pull request is opened.
      <break time="200ms"/>
      No IDE opened. No ticket reassigned
      — because there's something in that Slack channel that changes how the whole thing works.

      <break time="600ms"/>

      <prosody rate="-5%" pitch="+2st">
        <emphasis level="strong">Tara.</emphasis>
      </prosody>
      <break time="400ms"/>

      She lives in your team's Slack, reads everything you share
      — screenshots, code, tickets, designs, spreadsheets
      — and she works the way your team already works.

      <break time="300ms"/>

      She reads the screenshot, searches the codebase across three repositories,
      cross-references JIRA tickets, and comes back with a diagnosis
      — the exact file, the root cause, a plan to fix it.

      <break time="300ms"/>

      <emphasis level="strong">Not a suggestion. A diagnosis.</emphasis>

      <break time="600ms"/>

      And now the thread becomes the workspace.
      A PM adds a requirement. An engineer flags an edge case.
      A designer shares updated specs. Each message sharpens the plan
      — and <emphasis level="moderate">Tara</emphasis> adapts with every reply.

      <break time="300ms"/>

      <prosody rate="-8%">
        This is the part that matters
        — the thinking, the debating, the human judgment that no AI can replace
      </prosody>
      — all happening asynchronously, in one conversation, with no one waiting for anyone.

      <break time="500ms"/>

      <prosody pitch="+3st" rate="+10%">
        "Make it real."
      </prosody>
      <break time="300ms"/>
      The plan splits
      — three branches, three implementations, running in parallel.

      <break time="200ms"/>

      <emphasis level="moderate">Tara</emphasis> clones the repos, studies your team's patterns
      — commit style, architecture, conventions
      — and writes code that looks like your team wrote it.

      <break time="200ms"/>

      <prosody rate="+15%">
        Implements. Tests. Opens pull requests.
      </prosody>

      <break time="300ms"/>

      <prosody pitch="+1st">
        <emphasis level="strong">Three PRs. One conversation.</emphasis>
      </prosody>

      <break time="500ms"/>

      She does this because she's connected to everything you already use
      — JIRA, Bitbucket, GitHub, Figma
      — fifty tools, all through Slack. No new tools. No context-switching.

      <break time="200ms"/>

      She reads PDFs, images, code in fifty languages
      — and everything she does flows back into the thread
      as tickets, reports, pull requests
      — natural outputs of the conversation.

      <break time="400ms"/>

      From a screenshot to production, in minutes.
      <break time="200ms"/>
      And this is just <emphasis level="strong">Phase Zero.</emphasis>

      <break time="500ms"/>

      <prosody rate="+5%">
        Coder becomes engineer. Engineer becomes builder.
      </prosody>
      Less time typing, more time thinking, designing, deciding
      — and the implementation happens in parallel,
      right where the conversation started.

      <break time="600ms"/>

      <prosody rate="-10%" pitch="+2st">
        <emphasis level="strong">Tara.</emphasis>
        <break time="400ms"/>
        <emphasis level="strong">Build what matters.</emphasis>
      </prosody>

    </prosody>
  </voice>
</speak>"""


# ---------------------------------------------------------------------------
# Takes to generate
# ---------------------------------------------------------------------------

TAKES = [
    {
        "label": "neerja_ssml_expressive",
        "ssml": SSML_EXPRESSIVE,
        "description": "Balanced: emphasis + pauses + prosody variations",
    },
    {
        "label": "neerja_ssml_dramatic",
        "ssml": SSML_DRAMATIC,
        "description": "Dramatic: longer pauses, stronger slow/fast contrast",
    },
    {
        "label": "neerja_ssml_energetic",
        "ssml": SSML_ENERGETIC,
        "description": "Energetic: faster base pace, punchy emphasis",
    },
]


async def generate_take(ssml: str, output_path: Path, label: str) -> Path:
    """Generate one SSML take using Edge-TTS."""
    print(f"  Generating {label} ({len(ssml)} chars SSML)...")

    tts = edge_tts.Communicate(ssml, VOICE)
    await tts.save(str(output_path))

    size_kb = output_path.stat().st_size / 1024
    print(f"  Saved: {output_path.name} ({size_kb:.0f} KB)")
    return output_path


async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*70}")
    print(f"Edge-TTS Neerja — SSML-Enhanced Voiceover Generation")
    print(f"{'='*70}")
    print(f"Voice:  {VOICE}")
    print(f"Takes:  {len(TAKES)}")
    print(f"Output: {OUTPUT_DIR}")
    print()

    generated = []

    for i, take in enumerate(TAKES, 1):
        label = take["label"]
        desc = take["description"]
        filename = f"voice_test_edgetts_{label}.mp3"
        output_path = OUTPUT_DIR / filename

        print(f"[{i}/{len(TAKES)}] {desc}")
        try:
            await generate_take(take["ssml"], output_path, label)
            generated.append((label, output_path))
        except Exception as e:
            print(f"  FAILED: {e}")
        print()

    # Summary
    print("=" * 70)
    print("RESULTS")
    print("=" * 70)

    if generated:
        print(f"\nGenerated {len(generated)} file(s):\n")
        for label, path in generated:
            size_kb = path.stat().st_size / 1024
            # Get duration
            try:
                import subprocess
                result = subprocess.run(
                    ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                     "-of", "csv=p=0", str(path)],
                    capture_output=True, text=True, timeout=10,
                )
                dur = float(result.stdout.strip()) if result.returncode == 0 else 0
                mins = int(dur // 60)
                secs = dur % 60
                print(f"  [{label}] {path.name}  ({size_kb:.0f} KB, {mins}:{secs:04.1f})")
            except Exception:
                print(f"  [{label}] {path.name}  ({size_kb:.0f} KB)")

        print(f"\nCompare with original (no SSML):")
        orig = OUTPUT_DIR / "voice_test_edgetts_neerja_expressive_hq.mp3"
        if orig.exists():
            try:
                result = subprocess.run(
                    ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                     "-of", "csv=p=0", str(orig)],
                    capture_output=True, text=True, timeout=10,
                )
                dur = float(result.stdout.strip())
                print(f"  Original: {dur:.1f}s")
            except Exception:
                print(f"  Original: (run ffprobe manually)")
    else:
        print("\nNo files generated. Check errors above.")

    print()


if __name__ == "__main__":
    asyncio.run(main())
