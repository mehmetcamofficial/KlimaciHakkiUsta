// Responsive/platform-contract regression tests; no network or production
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

const responsive = load("lib/responsive.ts");

test("getScreenSize: exact boundaries are inclusive on the larger tier", () => {
  assert.equal(responsive.getScreenSize(767), "mobile");
  assert.equal(responsive.getScreenSize(768), "tablet");
  assert.equal(responsive.getScreenSize(1023), "tablet");
  assert.equal(responsive.getScreenSize(1024), "desktop");
});

test("getScreenSize: typical device widths classify as expected", () => {
  assert.equal(responsive.getScreenSize(375), "mobile"); // phone
  assert.equal(responsive.getScreenSize(390), "mobile"); // phone
  assert.equal(responsive.getScreenSize(820), "tablet"); // iPad-class
  assert.equal(responsive.getScreenSize(1440), "desktop"); // laptop/monitor
});

test("CONTENT_MAX_WIDTH: narrow < medium < default, each in its expected range", () => {
  const { narrow, medium, default: defaultWidth } = responsive.CONTENT_MAX_WIDTH;
  assert.ok(narrow > 0 && medium > 0 && defaultWidth > 0);
  assert.ok(narrow < medium && medium < defaultWidth);
  // A readable form width, not a full dashboard width.
  assert.ok(narrow >= 400 && narrow <= 600);
  // Enough for a single-column list/detail view without being a form.
  assert.ok(medium >= 650 && medium <= 900);
  // Roughly the 1100-1280px range called for genuinely wide (grid) content.
  assert.ok(defaultWidth >= 1000 && defaultWidth <= 1280);
});

test("getGridColumns follows mobile=2, tablet=3, desktop=4", () => {
  assert.equal(responsive.getGridColumns("mobile"), 2);
  assert.equal(responsive.getGridColumns("tablet"), 3);
  assert.equal(responsive.getGridColumns("desktop"), 4);
});

test("GRID_ITEM_WIDTH_PERCENT: every column count leaves room for gaps (stays under 100% * count)", () => {
  for (const columns of [1, 2, 3, 4]) {
    const percent = responsive.GRID_ITEM_WIDTH_PERCENT[columns];
    assert.ok(percent, `no width defined for ${columns} columns`);
    const value = Number(percent.replace("%", ""));
    // An even split would be 100/columns; every tier must undershoot that
    // (except the trivial 1-column case) so items plus gaps never overflow
    // the row — mirrors the already-shipped, visually-verified 47.5% (not
    // 50%) 2-column value.
    if (columns > 1) {
      assert.ok(value < 100 / columns, `${columns} columns at ${percent} would overflow with any gap`);
    } else {
      assert.equal(value, 100);
    }
  }
});

test("Home's category grid uses the centralized grid helpers, not a re-hardcoded percentage", () => {
  const source = fs.readFileSync("app/(tabs)/index.tsx", "utf8");
  assert.match(source, /getGridColumns/);
  assert.match(source, /GRID_ITEM_WIDTH_PERCENT/);
  // The old fixed "47.5%" ternary must be gone, not just supplemented.
  assert.equal(/["'`]47\.5%["'`]/.test(source), false);
});

test("single-column list/detail screens use the medium content width, not the full-width default", () => {
  for (const file of [
    "components/service-request-form.tsx",
    "app/(tabs)/service.tsx",
    "app/(tabs)/tracking.tsx",
    "app/services/[categorySlug].tsx",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(source, /width="medium"/, `${file} should render <Screen width="medium">`);
  }
});

test("Profile and every RequireAuth/RequireRole gated state use the narrow content width", () => {
  const profileSource = fs.readFileSync("app/(tabs)/profile.tsx", "utf8");
  assert.match(profileSource, /width="narrow"/);

  const guardSource = fs.readFileSync("components/auth-guard.tsx", "utf8");
  const narrowCount = (guardSource.match(/width="narrow"/g) || []).length;
  // RequireAuth (loading, signed-out) + RequireRole (loading, signed-out,
  // forbidden) = 5 gated states total.
  assert.equal(narrowCount, 5);
});

test("Screen's width prop keys line up exactly with CONTENT_MAX_WIDTH's keys", () => {
  const marketplaceSource = fs.readFileSync("components/ui/marketplace.tsx", "utf8");
  for (const key of Object.keys(responsive.CONTENT_MAX_WIDTH)) {
    assert.match(marketplaceSource, new RegExp(key));
  }
});

test("every auth screen requests the narrow content width", () => {
  for (const file of [
    "app/sign-in.tsx",
    "app/sign-up.tsx",
    "app/forgot-password.tsx",
    "app/reset-password.tsx",
    "app/auth/callback.tsx",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(source, /width="narrow"/, `${file} should render <Screen width="narrow">`);
  }
});

test("desktop nav never links to /admin — admin stays hidden from customer navigation", () => {
  const source = fs.readFileSync("components/ui/desktop-nav.tsx", "utf8");
  assert.equal(/["'`]\/admin/.test(source), false);
});

test("desktop-only chrome in the tabs layout is gated behind Platform.OS === \"web\" so native never hides its tab bar", () => {
  const source = fs.readFileSync("app/(tabs)/_layout.tsx", "utf8");
  assert.match(source, /Platform\.OS\s*===\s*"web"/);
  // The condition must gate both the header swap and the tabBarStyle hide.
  assert.match(source, /isDesktopWeb/);
  assert.match(source, /tabBarStyle:\s*isDesktopWeb/);
});

test("getAuthCallbackUrl still never hardcodes localhost or the future production domain", () => {
  const source = fs.readFileSync("lib/auth-callback-url.ts", "utf8");
  // Check the actual code, not the doc comment — the comment legitimately
  // *discusses* both localhost and https://ustayanimda.net.tr as examples
  // of what window.location.origin resolves to dynamically, which isn't
  // the same thing as either being hardcoded in the code itself.
  const codeOnly = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  assert.equal(/localhost/i.test(codeOnly), false);
  assert.equal(/ustayanimda\.net\.tr/i.test(codeOnly), false);
});

test("admin route is untouched by this phase: still gated by RequireRole, no new customer-facing admin link introduced", () => {
  const adminSource = fs.readFileSync("app/(tabs)/admin.tsx", "utf8");
  assert.match(adminSource, /RequireRole/);
  assert.match(adminSource, /role="admin"/);
  const tabsLayout = fs.readFileSync("app/(tabs)/_layout.tsx", "utf8");
  // The admin tab must still be hidden from the (mobile) tab bar itself.
  assert.match(tabsLayout, /name="admin"[\s\S]*?href:\s*null/);
});
