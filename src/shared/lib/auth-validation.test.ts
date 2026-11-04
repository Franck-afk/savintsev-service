import assert from "node:assert/strict";
import test from "node:test";
import {
  hasAcceptedPersonalDataConsent,
  hasMinimumPasswordLength,
} from "./auth-validation";

test("password validation enforces the shared minimum length", () => {
  assert.equal(hasMinimumPasswordLength("1234567"), false);
  assert.equal(hasMinimumPasswordLength("12345678"), true);
  assert.equal(hasMinimumPasswordLength(null), false);
});

test("personal data consent must be explicitly accepted", () => {
  assert.equal(hasAcceptedPersonalDataConsent(true), true);
  assert.equal(hasAcceptedPersonalDataConsent(false), false);
  assert.equal(hasAcceptedPersonalDataConsent("true"), false);
  assert.equal(hasAcceptedPersonalDataConsent(undefined), false);
});
