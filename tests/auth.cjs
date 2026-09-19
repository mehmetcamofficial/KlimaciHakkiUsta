// Auth/RBAC pure-logic regression tests; no network or production data is
// used, and nothing here talks to a real Supabase project.
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

const authTypes = load("types/auth.ts");
const rbac = load("lib/rbac.ts", { "@/types/auth": authTypes });
const authErrors = load("lib/auth-errors.ts");
const validation = load("lib/validation.ts");
const deepLink = load("lib/auth-deep-link.ts");

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
