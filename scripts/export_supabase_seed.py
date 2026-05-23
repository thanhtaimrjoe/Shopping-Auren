#!/usr/bin/env python3
"""Export production Supabase data into supabase/seed.sql for local development."""

from __future__ import annotations

import json
import os
import sys
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any
from uuid import UUID

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
BACKEND_ENV = ROOT / "backend" / ".env"
SEED_PATH = ROOT / "supabase" / "seed.sql"

PUBLIC_TABLES = [
    "meals",
    "products",
    "meal_plans",
    "meal_plan_items",
    "shopping_lists",
    "shopping_items",
]


def sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float, Decimal)):
        return str(value)
    if isinstance(value, (datetime, date)):
        return f"'{value.isoformat()}'::timestamptz" if isinstance(value, datetime) else f"'{value.isoformat()}'::date"
    if isinstance(value, UUID):
        return f"'{value}'::uuid"
    if isinstance(value, (dict, list)):
        escaped = json.dumps(value, ensure_ascii=False).replace("'", "''")
        return f"'{escaped}'::jsonb"
    text = str(value).replace("'", "''")
    return f"'{text}'"


def fetch_table(client: httpx.Client, table: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    offset = 0
    page_size = 1000
    while True:
        response = client.get(
            f"/rest/v1/{table}",
            params={"select": "*", "offset": offset, "limit": page_size},
            headers={"Accept-Profile": "public", "Content-Profile": "public"},
        )
        response.raise_for_status()
        batch = response.json()
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return rows


def fetch_auth_users(client: httpx.Client) -> list[dict[str, Any]]:
    response = client.get("/auth/v1/admin/users", params={"per_page": 200})
    response.raise_for_status()
    payload = response.json()
    return payload.get("users", payload)


def identities_insert(identities: list[dict[str, Any]]) -> str:
    if not identities:
        return "-- auth.identities: no rows\n"
    lines = [
        "INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)",
        "VALUES",
    ]
    value_rows = []
    for row in identities:
        provider_id = row.get("provider_id") or row["user_id"]
        value_rows.append(
            "("
            + ", ".join(
                [
                    sql_literal(row["id"]),
                    sql_literal(row["user_id"]),
                    sql_literal(provider_id),
                    sql_literal(row["identity_data"]),
                    sql_literal(row["provider"]),
                    sql_literal(row.get("last_sign_in_at")),
                    sql_literal(row["created_at"]),
                    sql_literal(row["updated_at"]),
                ]
            )
            + ")"
        )
    lines.append(",\n".join(value_rows))
    lines.append("ON CONFLICT (id) DO NOTHING;\n")
    return "\n".join(lines) + "\n"


def insert_statement(schema: str, table: str, rows: list[dict[str, Any]]) -> str:
    if not rows:
        return f"-- {schema}.{table}: no rows\n"
    columns = list(rows[0].keys())
    col_list = ", ".join(columns)
    values_sql = []
    for row in rows:
        vals = ", ".join(sql_literal(row.get(col)) for col in columns)
        values_sql.append(f"  ({vals})")
    body = ",\n".join(values_sql)
    return (
        f"-- {schema}.{table}: {len(rows)} rows\n"
        f"INSERT INTO {schema}.{table} ({col_list})\nVALUES\n{body}\n"
        f"ON CONFLICT DO NOTHING;\n\n"
    )


def auth_users_insert(users: list[dict[str, Any]]) -> str:
    if not users:
        return "-- auth.users: no rows\n"
    lines = [
        "-- auth.users: preserve production passwords for local login",
        "INSERT INTO auth.users (",
        "  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,",
        "  invited_at, confirmation_token, confirmation_sent_at, recovery_token,",
        "  recovery_sent_at, email_change_token_new, email_change, email_change_sent_at,",
        "  last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,",
        "  created_at, updated_at, phone, phone_confirmed_at, phone_change,",
        "  phone_change_token, phone_change_sent_at, email_change_token_current,",
        "  email_change_confirm_status, banned_until, reauthentication_token,",
        "  reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous",
        ") VALUES",
    ]
    value_rows = []
    for user in users:
        value_rows.append(
            "("
            + ", ".join(
                [
                    "'00000000-0000-0000-0000-000000000000'::uuid",
                    sql_literal(user["id"]),
                    "'authenticated'",
                    sql_literal(user.get("role") or "authenticated"),
                    sql_literal(user.get("email")),
                    sql_literal(user.get("encrypted_password")),
                    sql_literal(user.get("email_confirmed_at")),
                    "NULL",  # invited_at
                    "''",  # confirmation_token (GoTrue requires empty string, not NULL)
                    "NULL",  # confirmation_sent_at
                    "''",  # recovery_token
                    "NULL",  # recovery_sent_at
                    "''",  # email_change_token_new
                    "''",  # email_change
                    "NULL",  # email_change_sent_at
                    "NULL",  # last_sign_in_at
                    sql_literal(user.get("raw_app_meta_data") or {"provider": "email", "providers": ["email"]}),
                    sql_literal(user.get("raw_user_meta_data") or {}),
                    "NULL",  # is_super_admin
                    sql_literal(user.get("created_at")),
                    sql_literal(user.get("updated_at")),
                    "NULL",  # phone
                    "NULL",  # phone_confirmed_at
                    "''",  # phone_change
                    "''",  # phone_change_token
                    "NULL",  # phone_change_sent_at
                    "''",  # email_change_token_current
                    "0",  # email_change_confirm_status
                    "NULL",  # banned_until
                    "''",  # reauthentication_token
                    "NULL",  # reauthentication_sent_at
                    "false",  # is_sso_user
                    "NULL",  # deleted_at
                    "false",  # is_anonymous
                ]
            )
            + ")"
        )
    lines.append(",\n".join(value_rows))
    lines.append("ON CONFLICT (id) DO NOTHING;\n")
    return "\n".join(lines) + "\n"


def main() -> int:
    load_dotenv(BACKEND_ENV)
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not service_key:
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env", file=sys.stderr)
        return 1

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
    }

    parts = [
        "-- Generated by scripts/export_supabase_seed.py\n",
        "-- Source: production Supabase (Shopping Memo)\n\n",
        "SET session_replication_role = replica;\n\n",
    ]

    auth_users_path = ROOT / "supabase" / ".seed_auth_users.json"
    if not auth_users_path.exists():
        print(f"Missing {auth_users_path} (auth password hashes for local seed)", file=sys.stderr)
        return 1
    users = json.loads(auth_users_path.read_text(encoding="utf-8"))
    parts.append(auth_users_insert(users))

    with httpx.Client(base_url=url, headers=headers, timeout=60.0) as client:

        identities_path = ROOT / "supabase" / ".seed_identities.json"
        if identities_path.exists():
            identities = json.loads(identities_path.read_text(encoding="utf-8"))
            parts.append(identities_insert(identities))

        for table in PUBLIC_TABLES:
            rows = fetch_table(client, table)
            parts.append(insert_statement("public", table, rows))

    parts.append(
        "-- GoTrue cannot scan NULL into string token columns\n"
        "UPDATE auth.users SET\n"
        "  confirmation_token = COALESCE(confirmation_token, ''),\n"
        "  recovery_token = COALESCE(recovery_token, ''),\n"
        "  email_change_token_new = COALESCE(email_change_token_new, ''),\n"
        "  email_change = COALESCE(email_change, ''),\n"
        "  phone_change = COALESCE(phone_change, ''),\n"
        "  phone_change_token = COALESCE(phone_change_token, ''),\n"
        "  email_change_token_current = COALESCE(email_change_token_current, ''),\n"
        "  reauthentication_token = COALESCE(reauthentication_token, '');\n\n"
    )
    parts.append("SET session_replication_role = origin;\n")

    SEED_PATH.write_text("".join(parts), encoding="utf-8")
    print(f"Wrote {SEED_PATH} ({SEED_PATH.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
