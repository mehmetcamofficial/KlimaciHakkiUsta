// Service contract regression tests; no network or production data is used.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
const vm = require("node:vm");
function load(path, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    // Without an explicit target, transpileModule defaults to ES3, which
    // downlevels `class X extends Error` into a form whose instances don't
    // reliably keep X's prototype (a well-known TS/ES5 pitfall) — breaking
    // `instanceof`/`.constructor` for custom error classes in tests even
    // though the real Hermes/Babel app bundle handles native classes fine.
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      if (dependencies[name]) return dependencies[name];
      throw Error(name);
    },
    fetch: async () => ({ arrayBuffer: async () => new ArrayBuffer(8) }),
    Date,
    Math,
    Error,
  });
  return exports;
}
const catalog = load("data/service-catalog.ts");
function categories(results) {
  return load("services/categories.ts", {
    "@/data/service-catalog": catalog,
    "@/lib/supabase": {
      supabase: {
        from: (name) => ({
          select() {
            return this;
          },
          eq() {
            return this;
          },
          order: async () => results[name],
        }),
      },
    },
  });
}
test("10 categories, 45 services, unique slugs and valid ownership", () => {
  assert.equal(catalog.SERVICE_CATALOG.length, 10);
  const services = catalog.SERVICE_CATALOG.flatMap(
    (entry) => entry.serviceTypes,
  );
  assert.equal(services.length, 45);
  assert.equal(new Set(services.map((type) => type.id)).size, services.length);
  for (const entry of catalog.SERVICE_CATALOG)
    assert.ok(
      entry.serviceTypes.every((type) => type.categoryId === entry.category.id),
    );
});
test("missing migration uses a coherent local snapshot", async () => {
  const result = await categories({
    service_categories: { error: { code: "PGRST205" } },
    service_types: {},
  }).fetchCatalog();
  assert.equal(result.source, "local");
  assert.equal(result.categories.length, 10);
});
test("empty remote catalog stays empty; permission failures remain errors", async () => {
  const result = await categories({
    service_categories: { data: [] },
    service_types: { data: [] },
  }).fetchCatalog();
  assert.equal(result.categories.length, 0);
  assert.equal(result.source, "remote");
  await assert.rejects(
    categories({
      service_categories: { error: { code: "42501" } },
      service_types: {},
    }).fetchCatalog(),
  );
});
function requests(errors) {
  const inserts = [];
  const uploads = [];
  const service = load("services/requests.ts", {
    "@/lib/supabase": {
      supabase: {
        from: () => ({
          insert: async (data) => {
            inserts.push(data);
            return { error: errors.shift() };
          },
        }),
        storage: {
          from: () => ({
            upload: async (...args) => {
              uploads.push(args);
              return {};
            },
            getPublicUrl: () => ({
              data: { publicUrl: "https://example.test/photo" },
            }),
          }),
        },
      },
    },
  });
  return { ...service, inserts, uploads };
}
const input = {
  customerId: "user-1",
  categorySlug: "klima",
  serviceTypeSlug: "klima-arizasi",
  serviceTypeName: "Klima Arızası",
  phone: "05550000000",
  address: "Test",
  description: "Test",
  latitude: 0,
  longitude: 0,
};
test("Klima request preserves GPS, photo, selected service and ownership", async () => {
  const service = requests([null]);
  const result = await service.createServiceRequest({
    ...input,
    photoUri: "test.png",
    photoMimeType: "image/png",
  });
  assert.ok(result.requestNo.startsWith("UY-"));
  assert.equal(service.inserts[0].latitude, 0);
  assert.equal(service.inserts[0].customer_id, "user-1");
  assert.equal(service.inserts[0].category_slug, "klima");
  assert.equal(service.inserts[0].photo_url, "https://example.test/photo");
  assert.ok(service.inserts[0].photo_path.startsWith("user-1/"));
  assert.equal(service.uploads[0][2].upsert, false);
  assert.equal(service.uploads[0][2].contentType, "image/png");
});
test("retry drops only the missing optional column, keeps ownership and service name", async () => {
  const service = requests([
    { code: "PGRST204", message: "Could not find the 'category_id' column" },
    null,
  ]);
  await service.createServiceRequest(input);
  assert.equal(service.inserts.length, 2);
  assert.equal(service.inserts[0].category_id, null);
  assert.equal("category_id" in service.inserts[1], false);
  assert.equal(service.inserts[1].customer_id, "user-1");
  assert.equal(service.inserts[1].problem_type, "Klima Arızası");
  const denied = requests([{ code: "42501", message: "permission denied" }]);
  await assert.rejects(denied.createServiceRequest(input));
  assert.equal(denied.inserts.length, 1);
});
test("missing customer_id column fails closed instead of creating an unowned request", async () => {
  const service = requests([
    { code: "PGRST204", message: "Could not find the 'customer_id' column" },
  ]);
  await assert.rejects(
    service.createServiceRequest(input),
    (error) => error.constructor.name === "ConfigurationError",
  );
  // No retry was attempted with ownership stripped from the payload.
  assert.equal(service.inserts.length, 1);
});
