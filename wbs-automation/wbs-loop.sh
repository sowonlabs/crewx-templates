#!/bin/bash
# ============================================================
# CrewX WBS automatic progress loop (Coordinator Agent version)
# ============================================================
#
# 🔄 Workflow (extremely simple!):
#   1. Call the @coordinator agent
#   2. Done! (The agent automatically analyzes wbs.md → selects Phases → runs them in parallel)
#
# 🤖 The Coordinator agent automatically:
#   - Reads wbs.md and finds incomplete Phases
#   - Plans parallel execution for independent Phases
#   - Selects and invokes appropriate development agents
#   - Instructs through to marking Phases as done in wbs.md
#   - Uses a 30-minute timeout to complete multiple Phases concurrently
#
# 📡 Thread system:
#   - Context Thread: shares the daily work context
#
# 🎯 Key improvements:
#   - The script only acts as a simple scheduler
#   - All logic is delegated to the coordinator agent
#   - Prompt improvements are easy and testable
# ============================================================

set -e
set -o pipefail

# CrewX command configuration
CREWX_CMD="${CREWX_CMD:-crewx}"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Log functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error_log() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn_log() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

info_log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

coordinator_log() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} 🤖 $1"
}

# Loop counter
LOOP_COUNT=0
MAX_LOOPS=${MAX_LOOPS:-24} # Default: 24 hours
SLEEP_TIME=${SLEEP_TIME:-3600} # Default: 1 hour (3600 seconds)

# Progress and error log files
PROGRESS_FILE="wbs-progress.log"
ERROR_FILE="wbs-errors.log"

# Thread IDs (daily-based by default)
DAY_THREAD="wbs-$(date +%Y%m%d)"
CONTEXT_THREAD="$DAY_THREAD-context"

# Expose CONTEXT_THREAD via environment variable (usable in agent config as {{env.CONTEXT_THREAD}})
export CONTEXT_THREAD

# Coordinator configuration
CONFIG_FILE="crewx.wbs.yaml"
COORDINATOR_TIMEOUT="1800000"   # Coordinator completes work within: 30 minutes

# Initialization
init() {
    log "🚀 Starting WBS automation loop"
    log "📌 CrewX command: $CREWX_CMD"
    log "🤖 Coordinator Agent: @coordinator"
    log "📄 Config: $CONFIG_FILE"
    log "📡 Context Thread: $CONTEXT_THREAD"

    echo "========================================" >> "$PROGRESS_FILE"
    echo "Start time: $(date)" >> "$PROGRESS_FILE"
    echo "CrewX command: $CREWX_CMD" >> "$PROGRESS_FILE"
    echo "Config: $CONFIG_FILE" >> "$PROGRESS_FILE"
    echo "Context Thread: $CONTEXT_THREAD" >> "$PROGRESS_FILE"
    echo "========================================" >> "$PROGRESS_FILE"

    coordinator_log "Coordinator agent initialization complete"
}

# Work cycle - just call the Coordinator agent and you're done!
work_cycle() {
    local cycle=$1
    log "🔄 Starting work cycle #$cycle ($(date '+%Y-%m-%d %H:%M'))"

    coordinator_log "Calling @coordinator..."

    # The Coordinator automatically, according to its system prompt:
    # - Analyzes wbs.md → selects Phases → runs them in parallel → updates wbs.md
    local exit_code=0
    local cycle_temp_log
    cycle_temp_log=$(mktemp -t crewx-cycle-XXXXXX)

    set +e
    $CREWX_CMD execute "@coordinator Cycle #$cycle: Check wbs.md, find any pending Phases, and immediately run them in parallel. Do not ask the user; just proceed automatically." \
        --config $CONFIG_FILE \
        --thread $CONTEXT_THREAD \
        --timeout "$COORDINATOR_TIMEOUT" 2>&1 | tee -a "$PROGRESS_FILE" | tee "$cycle_temp_log"
    exit_code=$?
    set -e

    if [ $exit_code -eq 0 ]; then
        log "✅ Cycle #$cycle completed"
    else
        error_log "❌ Cycle #$cycle failed (exit code: $exit_code)"
        {
            echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: Cycle $cycle failed (exit code: $exit_code)"
            echo "----- Last output -----"
            tail -n 40 "$cycle_temp_log"
            echo "-----------------------"
        } >> "$ERROR_FILE"
    fi

    rm -f "$cycle_temp_log"
}


# Main loop
main_loop() {
    while [ $LOOP_COUNT -lt $MAX_LOOPS ]; do
        LOOP_COUNT=$((LOOP_COUNT + 1))

        log "========== Loop #$LOOP_COUNT / $MAX_LOOPS =========="

        # Coordinator progresses work (analyzes wbs.md → selects Phases → runs them in parallel)
        work_cycle $LOOP_COUNT

        log "✅ Loop #$LOOP_COUNT completed"

        # Wait until next loop
        if [ $LOOP_COUNT -lt $MAX_LOOPS ]; then
            info_log "💤 Waiting $((SLEEP_TIME/60)) minutes until the next loop..."
            sleep $SLEEP_TIME
        fi
    done

    log "🎉 All loops completed!"
}

# Cleanup / shutdown
cleanup() {
    log "🛑 Shutting down loop..."
    echo "========================================" >> "$PROGRESS_FILE"
    echo "End time: $(date)" >> "$PROGRESS_FILE"
    echo "Total loops executed: $LOOP_COUNT" >> "$PROGRESS_FILE"
    echo "========================================" >> "$PROGRESS_FILE"

    # Final report
    coordinator_log "Generating final report..."
    $CREWX_CMD query "@coordinator Final report for today: please check wbs.md and summarize, in up to 7 lines, (1) the list of completed Phases, (2) overall progress, and (3) recommended next actions." \
        --config $CONFIG_FILE \
        --timeout 60000 2>&1 | tee -a "$PROGRESS_FILE"
}

# Signal handling
trap cleanup EXIT INT TERM

# Usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show help"
    echo "  -l, --loops NUM      Maximum number of loops (default: 24)"
    echo "  -s, --sleep SECONDS  Sleep time between loops (default: 3600 seconds)"
    echo "  -t, --test           Test mode (3 times with 5 minutes interval)"
    echo "  -c, --cmd COMMAND    CrewX command (default: crewx)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Default execution"
    echo "  $0 --test             # Test mode"
    echo "  $0 -c './dist/main.js' # Development mode"
}

# Command-line argument parsing
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -l|--loops)
            MAX_LOOPS="$2"
            shift 2
            ;;
        -s|--sleep)
            SLEEP_TIME="$2"
            shift 2
            ;;
        -c|--cmd)
            CREWX_CMD="$2"
            shift 2
            ;;
        -t|--test)
            MAX_LOOPS=3
            SLEEP_TIME=300 # 5 minutes
            COORDINATOR_TIMEOUT=120000  # 2 minutes (Coordinator completes work)
            TEST_MODE=true
            log "📍 Test mode: 3 loops, 5-minute interval"
            shift
            ;;
        *)
            error_log "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Execution confirmation banner
echo "========================================"
echo "  CrewX Monorepo Automation Loop"
echo "  🤖 Coordinator Agent Version"
echo "========================================"
echo "CrewX command: $CREWX_CMD"
echo "Config: $CONFIG_FILE"
echo "Max loops: $MAX_LOOPS"
echo "Sleep time: $((SLEEP_TIME/60)) minutes"
echo ""
echo "Coordinator Agent:"
echo "  - @coordinator (Phase-level parallel execution)"
echo ""
warn_log "⚠️ The Coordinator will automatically execute Phases in parallel. Starting..."

# Main execution
init
main_loop
cleanup
