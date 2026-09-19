// Phase 2.5D production-deployment config contract tests. No network
// access, no Vercel/Supabase account interaction — pure static checks
// against the repo's own config files.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const vercelConfig = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
const appConfig = JSON.parse(fs.readFileSync("app.json", "utf8"));

test("vercel.json points at the real Expo static web export, not a guessed build command", () => {
  assert.match(vercelConfig.buildCommand, /expo export/);
  assert.match(vercelConfig.buildCommand, /--platform web/);
  assert.equal(vercelConfig.outputDirectory, "dist");
});

test("vercel.json enables cleanUrls — required for /sign-in etc. to resolve to sign-in.html", () => {
  assert.equal(vercelConfig.cleanUrls, true);
});

test("vercel.json's rewrites cover exactly the three dynamic route segments Expo's static export can't pre-enumerate — no more, no less", () => {
  const sources = vercelConfig.rewrites.map((r) => r.source).sort();
  assert.deepEqual(sources, [
    "/admin/:module",
    "/admin/requests/:id",
    "/services/:categorySlug",
  ].sort());
});

test("every rewrite destination in vercel.json matches a file the current export actually produces", () => {
  // Guards against a typo'd bracket filename silently 404ing in production.
  // Requires a prior `expo export --platform web` (see the required test
  // command sequence) — skips gracefully if dist/ hasn't been built yet.
  if (!fs.existsSync("dist")) return;
  for (const rule of vercelConfig.rewrites) {
    const filePath = "dist" + rule.destination;
    assert.ok(fs.existsSync(filePath), `${rule.destination} (for ${rule.source}) does not exist in dist/`);
  }
});

test("vercel.json never references service_role or a raw secret value", () => {
  const raw = fs.readFileSync("vercel.json", "utf8");
  assert.equal(/service_role/i.test(raw), false);
  assert.equal(/SUPABASE_SERVICE/i.test(raw), false);
});

test("app.json still builds a static export (vercel.json's outputDirectory assumption) and keeps the native deep-link scheme", () => {
  assert.equal(appConfig.expo.web.output, "static");
  // Native auth redirects (ustayanimda://**) must keep working after web
  // deployment — this is a read-only assertion, not a new requirement.
  assert.equal(appConfig.expo.scheme, "ustayanimda");
});

test("getAuthCallbackUrl resolves the production web callback from window.location.origin, never a hardcoded ustayanimda.net.tr string", () => {
  const source = fs.readFileSync("lib/auth-callback-url.ts", "utf8");
  const codeOnly = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.match(codeOnly, /window\.location\.origin/);
  assert.equal(/ustayanimda\.net\.tr/i.test(codeOnly), false);
});

test(".gitignore still excludes the build output and real env files — nothing secret or generated should ever be committed", () => {
  const gitignore = fs.readFileSync(".gitignore", "utf8");
  assert.match(gitignore, /^dist\/$/m);
  assert.match(gitignore, /^\.env$/m);
});

test("no .env file is tracked by git (secrets must only ever live in Vercel's own environment variable store)", () => {
  const { execSync } = require("node:child_process");
  const tracked = execSync("git ls-files").toString();
  const envFiles = tracked.split("\n").filter((f) => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".env.example"));
  assert.deepEqual(envFiles, []);
});
