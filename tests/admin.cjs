// Phase 2.5C admin-foundation contract tests; no network or production
// data is used, and nothing here talks to a real Supabase project.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
const vm = require("node:vm");

function load(path, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      if (dependencies[name]) return dependencies[name];
      throw Error(name);
    },
    Error,
  });
  return exports;
}

const admin = load("lib/admin.ts");
const authTypes = load("types/auth.ts");
const rbac = load("lib/rbac.ts", { "@/types/auth": authTypes });

test("ADMIN_NAV_ITEMS: every entry has a unique key and a unique /admin-prefixed href", () => {
  const keys = new Set();
  const hrefs = new Set();
  for (const item of admin.ADMIN_NAV_ITEMS) {
    assert.ok(!keys.has(item.key), `duplicate key ${item.key}`);
    assert.ok(!hrefs.has(item.href), `duplicate href ${item.href}`);
    assert.match(item.href, /^\/admin(\/|$)/);
    keys.add(item.key);
    hrefs.add(item.href);
  }
});

test("ADMIN_NAV_ITEMS: the requested 15-item planned information architecture is present", () => {
  assert.equal(admin.ADMIN_NAV_ITEMS.length, 15);
  const labels = admin.ADMIN_NAV_ITEMS.map((item) => item.label);
  for (const expected of [
    "Dashboard",
    "Talepler",
    "Operasyon",
    "Müşteriler",
    "Ustalar",
    "Usta Başvuruları",
    "Kategoriler & Hizmetler",
    "Yorumlar",
    "Şikayetler",
    "Bildirimler",
    "Finans",
    "Raporlar",
    "Kullanıcı & Roller",
    "Sistem Ayarları",
    "Denetim Kayıtları",
  ]) {
    assert.ok(labels.includes(expected), `missing planned module: ${expected}`);
  }
});

test("ADMIN_NAV_ITEMS: only Dashboard, Talepler and Operasyon are marked implemented — the rest are honest placeholders", () => {
  const implemented = admin.ADMIN_NAV_ITEMS.filter((item) => item.implemented).map((item) => item.key);
  // JSON comparison, not assert.deepEqual: the array under test was built
  // inside a separate vm context (see load()), so it has a different
  // realm's Array prototype — deepStrictEqual treats that as unequal even
  // when every element matches.
  assert.equal(JSON.stringify(implemented.sort()), JSON.stringify(["dashboard", "operations", "requests"].sort()));
});

test("adminModuleLabel resolves a placeholder module's slug back to its sidebar label, and rejects unknown slugs", () => {
  assert.equal(admin.adminModuleLabel("musteriler"), "Müşteriler");
  assert.equal(admin.adminModuleLabel("sistem-ayarlari"), "Sistem Ayarları");
  assert.equal(admin.adminModuleLabel("not-a-real-module"), null);
  assert.equal(admin.adminModuleLabel(undefined), null);
});

test("KNOWN_REQUEST_STATUSES matches the fixed status vocabulary the operations panel writes", () => {
  assert.equal(
    JSON.stringify(admin.KNOWN_REQUEST_STATUSES),
    JSON.stringify(["Talep alındı", "Usta aranıyor", "Usta atandı", "Yolda", "Servis tamamlandı"]),
  );
});

test("admin layout gates every /admin/* route behind RequireRole role=\"admin\" — the UI-level guard is present", () => {
  const source = fs.readFileSync("app/admin/_layout.tsx", "utf8");
  assert.match(source, /<RequireRole\s+role="admin">/);
});

test("CUSTOMER is denied the admin route by the same pure decision rbac.ts already enforces elsewhere", () => {
  assert.equal(
    rbac.decideAccess({ isLoading: false, hasSession: true, role: "customer", requiredRole: "admin" }),
    "forbidden",
  );
});

test("PROFESSIONAL is denied the admin route — admin access requires the admin role specifically, not just \"not a customer\"", () => {
  assert.equal(
    rbac.decideAccess({ isLoading: false, hasSession: true, role: "professional", requiredRole: "admin" }),
    "forbidden",
  );
});

test("ADMIN is allowed the admin route", () => {
  assert.equal(
    rbac.decideAccess({ isLoading: false, hasSession: true, role: "admin", requiredRole: "admin" }),
    "ok",
  );
});

test("the customer desktop nav's base link set never includes an admin entry — only DesktopNav's role check appends one", () => {
  const source = fs.readFileSync("components/ui/desktop-nav.tsx", "utf8");
  const linksArrayMatch = source.match(/const LINKS = \[[\s\S]*?\n\];/);
  assert.ok(linksArrayMatch, "could not locate the LINKS array");
  assert.equal(/\/admin/.test(linksArrayMatch[0]), false);
  // The admin link must only ever be appended behind an explicit role check.
  assert.match(source, /role === "admin"/);
});

test("admin shell degrades responsively instead of assuming a fixed desktop sidebar width everywhere", () => {
  const source = fs.readFileSync("components/admin/admin-shell.tsx", "utf8");
  assert.match(source, /useScreenSize/);
  assert.match(source, /isDesktop/);
  // Below desktop, navigation becomes a horizontal ScrollView, not a fixed
  // off-screen-width sidebar, which is what keeps 375/820px overflow-free.
  assert.match(source, /horizontal/);
});

test("admin request rows navigate to the request-detail route rather than exposing an inline edit/update action", () => {
  const source = fs.readFileSync("components/admin/admin-ui.tsx", "utf8");
  assert.match(source, /admin\/requests\/\[id\]/);
  assert.equal(/updateRequest/.test(source), false);
});

test("the admin dashboard and request-list screens only ever call admin-safe, RLS-scoped read functions — no service_role, no direct table mutation", () => {
  for (const file of ["app/admin/index.tsx", "app/admin/requests/index.tsx", "app/admin/requests/[id].tsx"]) {
    const source = fs.readFileSync(file, "utf8");
    assert.equal(/service_role/i.test(source), false);
    assert.equal(/\.update\(/.test(source), false);
    assert.equal(/\.delete\(/.test(source), false);
  }
});

test("placeholder modules render an honest not-built state, never fabricated data", () => {
  const source = fs.readFileSync("components/admin/admin-ui.tsx", "utf8");
  const placeholderMatch = source.match(/export function PlaceholderModule[\s\S]*?\n}/);
  assert.ok(placeholderMatch);
  assert.match(placeholderMatch[0], /henüz|yakında/i);
});
