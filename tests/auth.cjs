// Auth/RBAC pure-logic regression tests; no network or production data is
// used, and nothing here talks to a real Supabase project.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
const vm = require("node:vm");

function load(path, dependencies = {}, extraGlobals = {}) {
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
    ...extraGlobals,
  });
  return exports;
}

const authTypes = load("types/auth.ts");
const rbac = load("lib/rbac.ts", { "@/types/auth": authTypes });
const authErrors = load("lib/auth-errors.ts");
const validation = load("lib/validation.ts");
const deepLink = load("lib/auth-deep-link.ts");

function loadCallbackUrl({ platformOS, windowOrigin, createURLResult }) {
  const extraGlobals = {};
  if (windowOrigin !== undefined) {
    extraGlobals.window = { location: { origin: windowOrigin } };
  }
  return load(
    "lib/auth-callback-url.ts",
    {
      "react-native": { Platform: { OS: platformOS } },
      "expo-linking": { createURL: () => createURLResult },
    },
    extraGlobals,
  );
}

test("isUserRole accepts only the three known roles", () => {
  assert.equal(rbac.isUserRole("customer"), true);
  assert.equal(rbac.isUserRole("professional"), true);
  assert.equal(rbac.isUserRole("admin"), true);
  assert.equal(rbac.isUserRole("superadmin"), false);
  assert.equal(rbac.isUserRole(""), false);
  assert.equal(rbac.isUserRole(null), false);
  assert.equal(rbac.isUserRole(undefined), false);
  assert.equal(rbac.isUserRole(123), false);
  // Never trust a client-shaped object claiming a role field.
  assert.equal(rbac.isUserRole({ role: "admin" }), false);
});

test("decideAccess: loading takes priority over everything else", () => {
  assert.equal(
    rbac.decideAccess({ isLoading: true, hasSession: false, role: null }),
    "loading",
  );
  assert.equal(
    rbac.decideAccess({
      isLoading: true,
      hasSession: true,
      role: "admin",
      requiredRole: "admin",
    }),
    "loading",
  );
});

test("decideAccess: no session is signed-out regardless of role", () => {
  assert.equal(
    rbac.decideAccess({ isLoading: false, hasSession: false, role: null }),
    "signed-out",
  );
});

test("decideAccess: role mismatch on a gated route is forbidden, not silently allowed", () => {
  assert.equal(
    rbac.decideAccess({
      isLoading: false,
      hasSession: true,
      role: "customer",
      requiredRole: "admin",
    }),
    "forbidden",
  );
  // A customer must never be treated as admin-equivalent, in either direction.
  assert.equal(
    rbac.decideAccess({
      isLoading: false,
      hasSession: true,
      role: null,
      requiredRole: "admin",
    }),
    "forbidden",
  );
});

test("decideAccess: matching role, or no role requirement, is ok", () => {
  assert.equal(
    rbac.decideAccess({
      isLoading: false,
      hasSession: true,
      role: "admin",
      requiredRole: "admin",
    }),
    "ok",
  );
  assert.equal(
    rbac.decideAccess({ isLoading: false, hasSession: true, role: "customer" }),
    "ok",
  );
});

test("mapAuthError maps known cases to Turkish and never leaks raw internals for unknown ones", () => {
  assert.equal(
    authErrors.mapAuthError({ message: "Invalid login credentials" }),
    "E-posta veya şifre hatalı.",
  );
  assert.equal(
    authErrors.mapAuthError({ message: "User already registered" }),
    "Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.",
  );
  assert.equal(
    authErrors.mapAuthError({ message: "Some very specific Postgres constraint violation xyz123" }),
    "Bir sorun oluştu. Lütfen tekrar deneyin.",
  );
  assert.equal(authErrors.mapAuthError({ status: 429, message: "" }), "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.");
});

test("isValidEmail rejects obviously malformed addresses", () => {
  assert.equal(validation.isValidEmail("test@example.com"), true);
  assert.equal(validation.isValidEmail("  test@example.com  "), true);
  assert.equal(validation.isValidEmail("not-an-email"), false);
  assert.equal(validation.isValidEmail("missing-domain@"), false);
  assert.equal(validation.isValidEmail("@missing-local.com"), false);
  assert.equal(validation.isValidEmail("no-tld@example"), false);
  assert.equal(validation.isValidEmail(""), false);
  assert.equal(validation.isValidEmail("has space@example.com"), false);
});

test("parseAuthCallbackUrl reads tokens from the fragment (Supabase's implicit-flow shape)", () => {
  const result = deepLink.parseAuthCallbackUrl(
    "ustayanimda://auth/callback#access_token=AT123&refresh_token=RT456&type=signup&token_type=bearer",
  );
  assert.equal(result.accessToken, "AT123");
  assert.equal(result.refreshToken, "RT456");
  assert.equal(result.type, "signup");
  assert.equal(result.error, null);
});

test("parseAuthCallbackUrl distinguishes a recovery link from a signup confirmation", () => {
  const result = deepLink.parseAuthCallbackUrl(
    "ustayanimda://auth/callback#access_token=AT&refresh_token=RT&type=recovery",
  );
  assert.equal(result.type, "recovery");
});

test("parseAuthCallbackUrl surfaces an expired/invalid link error instead of missing tokens", () => {
  const result = deepLink.parseAuthCallbackUrl(
    "ustayanimda://auth/callback?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
  );
  assert.equal(result.accessToken, null);
  assert.equal(result.error, "access_denied");
  assert.equal(result.errorCode, "otp_expired");
  assert.ok(result.errorDescription.includes("expired"));
  assert.equal(
    authErrors.mapAuthCallbackError(result),
    "Bağlantının süresi dolmuş. Lütfen yeni bir bağlantı isteyin.",
  );
});

test("parseAuthCallbackUrl on a malformed/tokenless URL yields nulls, not a throw", () => {
  const result = deepLink.parseAuthCallbackUrl("ustayanimda://auth/callback");
  assert.equal(result.accessToken, null);
  assert.equal(result.refreshToken, null);
  assert.equal(result.error, null);
  assert.equal(authErrors.mapAuthCallbackError(result), "Bir sorun oluştu. Lütfen tekrar deneyin.");
});

test("isValidPassword matches the signup minimum length", () => {
  assert.equal(validation.isValidPassword("12345"), false);
  assert.equal(validation.isValidPassword("123456"), true);
});

test("passwordsMatch catches mismatches and rejects a blank password", () => {
  assert.equal(validation.passwordsMatch("secret1", "secret1"), true);
  assert.equal(validation.passwordsMatch("secret1", "secret2"), false);
  assert.equal(validation.passwordsMatch("", ""), false);
});

test("getAuthCallbackUrl: native (dev build/standalone) uses the app's own scheme via Linking.createURL", () => {
  const mod = loadCallbackUrl({
    platformOS: "android",
    createURLResult: "ustayanimda://auth/callback",
  });
  assert.equal(mod.getAuthCallbackUrl(), "ustayanimda://auth/callback");
});

test("getAuthCallbackUrl: production web uses the page's own current origin, not a hardcoded host", () => {
  const mod = loadCallbackUrl({
    platformOS: "web",
    windowOrigin: "https://ustayanimda.net.tr",
    createURLResult: "should-not-be-used",
  });
  assert.equal(mod.getAuthCallbackUrl(), "https://ustayanimda.net.tr/auth/callback");
});

test("getAuthCallbackUrl: local web dev uses whatever the dev server's actual origin is", () => {
  const mod = loadCallbackUrl({
    platformOS: "web",
    windowOrigin: "http://localhost:8099",
    createURLResult: "should-not-be-used",
  });
  // This is the dev server's real, runtime-dependent origin — read live from
  // window.location, not a value this code guessed or hardcoded.
  assert.equal(mod.getAuthCallbackUrl(), "http://localhost:8099/auth/callback");
});

test("getAuthCallbackUrl: web with no window (static export prerender) falls back to Linking, never a bare guess", () => {
  const mod = loadCallbackUrl({
    platformOS: "web",
    createURLResult: "/auth/callback",
  });
  assert.equal(mod.getAuthCallbackUrl(), "/auth/callback");
});

test("signUp and requestPasswordReset both redirect through the single centralized helper", () => {
  // lib/auth.tsx is a React component and isn't renderable in this
  // harness, so this checks the source directly: there must be exactly one
  // redirect implementation, and both auth calls that need a redirect must
  // use it — not a second, possibly-drifted Linking.createURL() call.
  const source = fs.readFileSync("lib/auth.tsx", "utf8");
  assert.equal((source.match(/getAuthCallbackUrl\(\)/g) || []).length, 2);
  assert.equal(/Linking\.createURL/.test(source), false);
  assert.match(source, /emailRedirectTo:\s*getAuthCallbackUrl\(\)/);
  assert.match(source, /redirectTo:\s*getAuthCallbackUrl\(\)/);
});

test("getAuthCallbackUrl: native never falls back to a hardcoded localhost regardless of window state", () => {
  const withoutWindow = loadCallbackUrl({
    platformOS: "ios",
    createURLResult: "ustayanimda://auth/callback",
  });
  assert.ok(!withoutWindow.getAuthCallbackUrl().includes("localhost"));
  // Even if something upstream leaked a browser-shaped global into a native
  // bundle, Platform.OS !== "web" must keep this on the Linking.createURL path.
  const withStrayWindow = loadCallbackUrl({
    platformOS: "ios",
    windowOrigin: "http://localhost:19006",
    createURLResult: "ustayanimda://auth/callback",
  });
  assert.equal(withStrayWindow.getAuthCallbackUrl(), "ustayanimda://auth/callback");
});
