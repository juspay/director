# =============================================================================
# TARA v7.4 "Builders" Video — Build Targets
# =============================================================================
#
# Usage:
#   make validate        — Run asset validation
#   make render-draft    — Quick draft render (fast, low quality)
#   make render-preview  — Medium quality preview
#   make render-final    — Full quality final render
#   make assemble        — Assembly only (skip Remotion, reuse build/)
#   make clean           — Clean build artifacts
#   make all             — Full pipeline (validate → render → assemble)
#
# =============================================================================

SHELL := /bin/bash
PYTHON := python3
SCRIPTS_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
V7_ROOT := $(abspath $(SCRIPTS_DIR)/..)

OUTPUT_DIR := $(V7_ROOT)/output
BUILD_DIR := $(V7_ROOT)/build
REMOTION_DIR := $(V7_ROOT)/remotion

# Default quality for `make render`
QUALITY ?= preview

# Override Chrome path if Remotion's bundled headless shell fails (macOS arm64).
# Auto-detected by render_video_v7.py, but can be forced:
#   make render-draft REMOTION_CHROME_EXECUTABLE="/path/to/Google Chrome"
ifdef REMOTION_CHROME_EXECUTABLE
export REMOTION_CHROME_EXECUTABLE
endif

.PHONY: all validate render render-draft render-preview render-final \
        assemble assemble-draft assemble-preview assemble-final \
        test-draft remotion-deps clean help

# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------

all: validate render-final
	@echo ""
	@echo "✓ Full pipeline complete. Output in $(OUTPUT_DIR)/"

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

validate:
	@echo "Running asset validation..."
	@cd $(SCRIPTS_DIR) && $(PYTHON) validate_assets_v7.py

validate-strict:
	@echo "Running strict asset validation..."
	@cd $(SCRIPTS_DIR) && $(PYTHON) validate_assets_v7.py --strict

# ---------------------------------------------------------------------------
# Remotion dependencies
# ---------------------------------------------------------------------------

remotion-deps:
	@echo "Installing Remotion dependencies..."
	@cd $(REMOTION_DIR) && npm install

# ---------------------------------------------------------------------------
# Render (full pipeline: validate + remotion + audio + compose)
# ---------------------------------------------------------------------------

render: render-$(QUALITY)

render-draft:
	@echo "Rendering draft quality..."
	@cd $(SCRIPTS_DIR) && $(PYTHON) render_video_v7.py --quality draft

render-preview:
	@echo "Rendering preview quality..."
	@cd $(SCRIPTS_DIR) && $(PYTHON) render_video_v7.py --quality preview

render-final:
	@echo "Rendering final quality..."
	@cd $(SCRIPTS_DIR) && $(PYTHON) render_video_v7.py --quality final

# ---------------------------------------------------------------------------
# Quick test render (first 10 seconds + audio overlay)
# Uses render_video_v7.py for Chrome auto-detection, then trims + overlays audio.
# ---------------------------------------------------------------------------

test-draft:
	@echo "Test render: first 10 seconds..."
	@cd $(SCRIPTS_DIR) && $(PYTHON) -c "\
		from render_video_v7 import find_chrome_executable; \
		import subprocess, os; \
		chrome = os.environ.get('REMOTION_CHROME_EXECUTABLE') or find_chrome_executable() or ''; \
		cmd = ['npx', 'remotion', 'render', 'TaraBuilders', \
			'$(OUTPUT_DIR)/test-draft.mp4', \
			'--frames=0-300', '--jpeg-quality=70', '--concurrency=4']; \
		cmd += ['--browser-executable', chrome] if chrome else []; \
		print('Using Chrome:', chrome or '(bundled)'); \
		r = subprocess.run(cmd, cwd='$(REMOTION_DIR)'); \
		exit(r.returncode)"
	@echo "Overlaying audio..."
	@ffmpeg -y -i $(OUTPUT_DIR)/test-draft.mp4 \
		-i $(V7_ROOT)/assets/mix/tara_v74_final_mix.mp3 \
		-c:v copy -c:a aac -b:a 192k -shortest \
		$(OUTPUT_DIR)/test-draft-with-audio.mp4
	@echo ""
	@echo "Test draft complete:"
	@echo "  Video only: $(OUTPUT_DIR)/test-draft.mp4"
	@echo "  With audio: $(OUTPUT_DIR)/test-draft-with-audio.mp4"

# ---------------------------------------------------------------------------
# Render with skip options (for iterating on specific steps)
# ---------------------------------------------------------------------------

render-audio-only:
	@echo "Re-mixing audio only (reusing existing Remotion render)..."
	@cd $(SCRIPTS_DIR) && $(PYTHON) render_video_v7.py --quality $(QUALITY) \
		--skip-validation --skip-remotion

render-compose-only:
	@echo "Re-composing only (reusing existing render + audio)..."
	@cd $(SCRIPTS_DIR) && $(PYTHON) render_video_v7.py --quality $(QUALITY) \
		--skip-validation --skip-remotion --skip-audio

# ---------------------------------------------------------------------------
# Assembly only (uses assemble_video_v7.py directly)
# ---------------------------------------------------------------------------

assemble: assemble-$(QUALITY)

assemble-draft:
	@echo "Assembling draft..."
	@cd $(SCRIPTS_DIR) && $(PYTHON) assemble_video_v7.py --quality draft

assemble-preview:
	@echo "Assembling preview..."
	@cd $(SCRIPTS_DIR) && $(PYTHON) assemble_video_v7.py --quality preview

assemble-final:
	@echo "Assembling final (all formats)..."
	@cd $(SCRIPTS_DIR) && $(PYTHON) assemble_video_v7.py --quality final

assemble-all:
	@echo "Assembling all quality levels..."
	@cd $(SCRIPTS_DIR) && $(PYTHON) assemble_video_v7.py --all

# ---------------------------------------------------------------------------
# Dry run (print commands without executing)
# ---------------------------------------------------------------------------

dry-run:
	@echo "Dry run ($(QUALITY))..."
	@cd $(SCRIPTS_DIR) && $(PYTHON) assemble_video_v7.py --quality $(QUALITY) --dry-run

# ---------------------------------------------------------------------------
# Clean
# ---------------------------------------------------------------------------

clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@echo "  Removed $(BUILD_DIR)/"
	@echo "Clean complete."

clean-all: clean
	@echo "Cleaning output..."
	@rm -rf $(OUTPUT_DIR)
	@echo "  Removed $(OUTPUT_DIR)/"
	@echo "Full clean complete."

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

help:
	@echo ""
	@echo "TARA v7.4 Video Pipeline"
	@echo "========================"
	@echo ""
	@echo "Primary targets:"
	@echo "  make validate         Run asset validation"
	@echo "  make render-draft     Quick draft render (fast, low quality)"
	@echo "  make render-preview   Medium quality preview"
	@echo "  make render-final     Full quality final render"
	@echo "  make all              Full pipeline (validate + render-final)"
	@echo ""
	@echo "Assembly (skip Remotion render):"
	@echo "  make assemble-draft   Assemble draft from build/"
	@echo "  make assemble-preview Assemble preview from build/"
	@echo "  make assemble-final   Assemble final + web + social from build/"
	@echo "  make assemble-all     All quality levels"
	@echo ""
	@echo "Testing:"
	@echo "  make test-draft       Quick 10-second render + audio overlay"
	@echo ""
	@echo "Iteration helpers:"
	@echo "  make render-audio-only   Re-mix audio, reuse Remotion render"
	@echo "  make render-compose-only Re-compose, reuse render + audio"
	@echo "  make dry-run             Print FFmpeg commands without executing"
	@echo ""
	@echo "Maintenance:"
	@echo "  make remotion-deps    Install Remotion node_modules"
	@echo "  make clean            Remove build/ directory"
	@echo "  make clean-all        Remove build/ and output/"
	@echo ""
	@echo "Variables:"
	@echo "  QUALITY=draft|preview|final  (default: preview)"
	@echo "  REMOTION_CHROME_EXECUTABLE   Override Chrome path (macOS arm64 fix)"
	@echo ""
