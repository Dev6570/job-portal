import test from "node:test";
import assert from "node:assert/strict";
import { formatDate, shortId } from "./format.js";

test("timestamps without a timezone are treated as UTC, same as with Z", () => {
  assert.equal(formatDate("2026-09-28T10:00:00"), formatDate("2026-09-28T10:00:00Z"));
});

test("explicit offsets are respected", () => {
  assert.equal(formatDate("2026-09-28T15:30:00+05:30"), formatDate("2026-09-28T10:00:00Z"));
});

test("bad or empty input does not throw", () => {
  assert.equal(formatDate(""), "");
  assert.equal(formatDate("garbage"), "garbage");
});

test("shortId", () => {
  assert.equal(shortId("070571a4-be3c-4ab3-8544-ed5d2b031c24"), "070571a4");
  assert.equal(shortId(null), "");
});
