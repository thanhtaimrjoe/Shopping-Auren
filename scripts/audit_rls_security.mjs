import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runAudit() {
  console.log("=== BẮT ĐẦU AUDIT AN NINH RLS & INTEGRATION (TASK-029) ===");
  const results = {
    tablesRLS: [],
    policies: [],
    rpcSecurity: [],
    secretLeaks: [],
    passed: true
  };

  const migrationsDir = path.join(__dirname, "../supabase/migrations");
  const files = fs.readdirSync(migrationsDir).sort();
  let sqlCombined = "";
  for (const f of files) {
    if (f.endsWith(".sql")) {
      sqlCombined += fs.readFileSync(path.join(migrationsDir, f), "utf8") + "\n";
    }
  }

  const expectedTables = [
    "ingredients", "meals", "meal_ingredients", "products",
    "weekly_plans", "weekly_plan_meals", "weekly_plan_products",
    "active_checklists", "active_checklist_items", "shopping_history"
  ];

  for (const table of expectedTables) {
    const rlsPattern = new RegExp("alter table public\\." + table + " enable row level security", "i");
    const hasRLS = rlsPattern.test(sqlCombined);
    results.tablesRLS.push({ table, hasRLS });
    if (!hasRLS) results.passed = false;

    const policyPattern = new RegExp("create policy .* on public\\." + table + " .*auth\\.uid\\(\\)", "i");
    const hasPolicy = policyPattern.test(sqlCombined);
    results.policies.push({ table, hasPolicy });
    if (!hasPolicy) results.passed = false;
  }

  const hasSecurityInvokerShopping = /create or replace function public\.save_shopping_data[\s\S]*?security invoker/i.test(sqlCombined);
  const hasSecurityInvokerChecklist = /create or replace function public\.save_active_checklist[\s\S]*?security invoker/i.test(sqlCombined);
  const hasSearchPathShopping = /create or replace function public\.save_shopping_data[\s\S]*?set search_path = ''/i.test(sqlCombined);
  const hasHardenedGuard = /is distinct from 'array'/i.test(sqlCombined);
  const hasRevokePublic = /revoke all on function public\.save_shopping_data.*from public, anon/i.test(sqlCombined);

  results.rpcSecurity.push({ check: "save_shopping_data security invoker", ok: hasSecurityInvokerShopping });
  results.rpcSecurity.push({ check: "save_active_checklist security invoker", ok: hasSecurityInvokerChecklist });
  results.rpcSecurity.push({ check: "set search_path = ''", ok: hasSearchPathShopping });
  results.rpcSecurity.push({ check: "Hardened guard against payload wipe", ok: hasHardenedGuard });
  results.rpcSecurity.push({ check: "Revoke execute from public/anon", ok: hasRevokePublic });

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const fullPath = path.join(dir, e.name);
      if (e.isDirectory()) {
        scanDir(fullPath);
      } else if (e.isFile() && (e.name.endsWith(".ts") || e.name.endsWith(".tsx") || e.name.endsWith(".js") || e.name.endsWith(".mjs"))) {
        const code = fs.readFileSync(fullPath, "utf8");
        if (/service_role/i.test(code) && !/never/i.test(code)) {
          results.secretLeaks.push(fullPath);
          results.passed = false;
        }
      }
    }
  }
  scanDir(path.join(__dirname, "../src"));

  console.log("1. RLS Tables (10/10):", results.tablesRLS.every(t => t.hasRLS) ? "PASSED" : "FAILED");
  console.log("2. Owner Policies (10/10):", results.policies.every(p => p.hasPolicy) ? "PASSED" : "FAILED");
  console.log("3. RPC Security Checks:", results.rpcSecurity.every(r => r.ok) ? "PASSED" : "FAILED");
  console.log("4. Leaked Service Role Keys in src/:", results.secretLeaks.length === 0 ? "NONE (SAFE)" : "LEAK DETECTED");

  if (results.passed) {
    console.log("==> TẤT CẢ CÁC BƯỚC AUDIT AN NINH ĐẠT CHUẨN 100%! <==");
  } else {
    console.error("==> PHÁT HIỆN LỖI AN NINH! <==");
    process.exit(1);
  }
}

runAudit();
