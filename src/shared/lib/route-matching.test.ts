import assert from "node:assert/strict";
import test from "node:test";
import { matchesRoute } from "./route-matching";

test("the root route matches only the root path", () => {
  assert.equal(matchesRoute("/", "/"), true);
  assert.equal(matchesRoute("/dashboard", "/"), false);
  assert.equal(matchesRoute("/api/orders", "/"), false);
});

test("a route matches itself and nested paths", () => {
  assert.equal(matchesRoute("/admin", "/admin"), true);
  assert.equal(matchesRoute("/admin/users", "/admin"), true);
  assert.equal(matchesRoute("/admin/notifications/read", "/admin/notifications"), true);
});

test("a route does not match a similarly prefixed sibling", () => {
  assert.equal(matchesRoute("/administer", "/admin"), false);
  assert.equal(matchesRoute("/auth/login-evil", "/auth/login"), false);
});

test("trailing slashes in route configuration are normalized", () => {
  assert.equal(matchesRoute("/api/auth/callback/credentials", "/api/auth/"), true);
});
