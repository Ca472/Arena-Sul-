import assert from "node:assert/strict";
import test from "node:test";

import { validateInstagramAccountIdentity } from "../src/lib/instagram/account-validation.ts";

test("accepts the expected account and returns the professional account id", () => {
  assert.deepEqual(
    validateInstagramAccountIdentity(
      { user_id: "17841400000000000", username: "arenasulsports" },
      "arenasulsports",
    ),
    {
      userId: "17841400000000000",
      username: "arenasulsports",
    },
  );
});

test("normalizes harmless username casing and surrounding whitespace", () => {
  assert.deepEqual(
    validateInstagramAccountIdentity(
      { user_id: 123456789, username: "  ArenaSulSports  " },
      "arenasulsports",
    ),
    {
      userId: "123456789",
      username: "arenasulsports",
    },
  );
});

test("rejects every other Instagram account", () => {
  assert.equal(
    validateInstagramAccountIdentity(
      { user_id: "17841499999999999", username: "outra_conta" },
      "arenasulsports",
    ),
    null,
  );
});
