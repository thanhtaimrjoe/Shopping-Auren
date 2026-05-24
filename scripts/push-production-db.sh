#!/usr/bin/env bash
# Apply pending supabase/migrations/*.sql to hosted Supabase (production).
# Prerequisites: supabase login, Docker not required for push.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="${SUPABASE_PROJECT_REF:-akyxznfvwogxhcwocukj}"

if ! supabase projects list &>/dev/null; then
  echo "Run: supabase login"
  exit 1
fi

if [[ ! -f supabase/.temp/project-ref ]]; then
  echo "Linking project ${PROJECT_REF}..."
  supabase link --project-ref "$PROJECT_REF"
fi

echo "Pushing migrations to production..."
supabase db push

echo "Done. Verify columns:"
echo "  week_from_date, week_to_date, snapshot_json on shopping_lists"
