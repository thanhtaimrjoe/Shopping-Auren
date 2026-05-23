#!/usr/bin/env bash
# Helper for local Supabase Docker workflow.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

cmd="${1:-status}"

case "$cmd" in
  start)
    supabase start
    ;;
  stop)
    supabase stop
    ;;
  reset)
    supabase db reset
    ;;
  export-seed)
    "$ROOT/backend/venv/bin/python" "$ROOT/scripts/export_supabase_seed.py"
    ;;
  refresh)
    "$ROOT/backend/venv/bin/python" "$ROOT/scripts/export_supabase_seed.py"
    supabase db reset
    ;;
  status)
    supabase status
    ;;
  *)
    echo "Usage: $0 {start|stop|reset|export-seed|refresh|status}"
    exit 1
    ;;
esac
