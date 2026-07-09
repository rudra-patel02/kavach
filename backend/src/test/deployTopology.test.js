import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// backend/src/test → repo root is three levels up.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel) => readFileSync(path.join(repoRoot, rel), "utf8");

describe("Part 6 — deploy topology (nginx-only ingress, Mongo auth)", () => {
  const compose = read("docker-compose.yml");

  test("only nginx publishes a host port; mongo/backend/frontend/mqtt stay internal (DoD)", () => {
    assert.match(compose, /"80:80"/);
    for (const stray of ['"27017:27017"', '"5000:5000"', '"3000:3000"', '"1883:1883"']) {
      assert.ok(!compose.includes(stray), `${stray} must not be published to the host`);
    }
  });

  test("Mongo requires credentials (DoD)", () => {
    assert.match(compose, /MONGO_INITDB_ROOT_USERNAME/);
    assert.match(compose, /MONGO_INITDB_ROOT_PASSWORD/);
    assert.match(compose, /authSource=admin/);
  });

  test("no placeholder secret is baked into compose — secrets come from env (DoD)", () => {
    assert.ok(
      !/replace-with|changeme|change-me/i.test(compose),
      "compose must inject secrets from env, not bake placeholders"
    );
    assert.match(compose, /\$\{JWT_SECRET/);
    assert.match(compose, /\$\{JWT_REFRESH_SECRET/);
  });

  test("nginx proxies /api, /socket.io (with WebSocket upgrade) and the app (DoD)", () => {
    const conf = read("nginx/kavach.conf");
    assert.match(conf, /location \/api\//);
    assert.match(conf, /location \/socket\.io\//);
    assert.match(conf, /Upgrade \$http_upgrade/);
    assert.match(conf, /location \/ \{/);
  });

  test("containers run as a non-root user (DoD)", () => {
    assert.match(read("backend/Dockerfile"), /USER\s+(node|\d)/);
    assert.match(read("frontend/Dockerfile"), /USER\s+(node|nextjs|\d)/);
  });

  test("prod backend image ships no dev dependencies (DoD)", () => {
    assert.match(read("backend/Dockerfile"), /npm ci --omit=dev|npm ci --production/);
  });
});

describe("Part 6 — CI pipeline", () => {
  const ci = read(".github/workflows/ci.yml");

  test("CI runs the full suite, build, and a failing npm audit (DoD)", () => {
    assert.match(ci, /npm audit/);
    assert.match(ci, /--audit-level[= ](high|critical)/);
    assert.match(ci, /backend:test/);
    assert.match(ci, /frontend:test/);
    assert.match(ci, /frontend:typecheck/);
    assert.match(ci, /frontend:lint/);
    assert.match(ci, /frontend:build/);
  });
});
