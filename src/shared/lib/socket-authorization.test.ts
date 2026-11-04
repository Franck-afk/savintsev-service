import assert from "node:assert/strict";
import test from "node:test";
import {
  canEmitDialogDeletion,
  canEmitOrderDeletion,
  canEmitOrderStageUpdate,
  canEmitPaymentNotice,
} from "./socket-authorization";

test("order updates are limited to the owner, assigned master, or pending order client", () => {
  const order = { userId: "client-1", masterId: "master-1", status: "InProgress" };

  assert.equal(canEmitOrderStageUpdate("owner-1", "Owner", order), true);
  assert.equal(canEmitOrderStageUpdate("master-1", "Master", order), true);
  assert.equal(canEmitOrderStageUpdate("other-master", "Master", order), false);
  assert.equal(canEmitOrderStageUpdate("client-1", "Client", order), false);
  assert.equal(
    canEmitOrderStageUpdate("client-1", "Client", { ...order, status: "Pending" }),
    true,
  );
});

test("order deletion notices cannot target another client's room", () => {
  assert.equal(canEmitOrderDeletion("client-1", "Client", "client-1"), true);
  assert.equal(canEmitOrderDeletion("client-1", "Client", "client-2"), false);
  assert.equal(canEmitOrderDeletion("owner-1", "Owner", "client-2"), true);
});

test("dialog deletion notices must name the authenticated sender", () => {
  assert.equal(canEmitDialogDeletion("user-1", "user-1"), true);
  assert.equal(canEmitDialogDeletion("user-1", "user-2"), false);
});

test("payment notices are limited to the owner or assigned master", () => {
  assert.equal(canEmitPaymentNotice("owner-1", "Owner", null), true);
  assert.equal(canEmitPaymentNotice("master-1", "Master", "master-1"), true);
  assert.equal(canEmitPaymentNotice("master-2", "Master", "master-1"), false);
  assert.equal(canEmitPaymentNotice("client-1", "Client", "master-1"), false);
});
