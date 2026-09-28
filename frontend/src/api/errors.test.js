import test from "node:test";
import assert from "node:assert/strict";
import { extractErrorMessage } from "./errors.js";

test("string detail is returned as-is", () => {
  const err = { response: { data: { detail: "Incorrect email or password" } } };
  assert.equal(extractErrorMessage(err), "Incorrect email or password");
});

test("422 validation list becomes readable text (drops the 'body' prefix)", () => {
  const err = { response: { data: { detail: [
    { loc: ["body", "password"], msg: "String should have at least 8 characters" },
    { loc: ["body", "student", "cgpa"], msg: "Input should be a valid number" },
  ] } } };
  assert.equal(
    extractErrorMessage(err),
    "password: String should have at least 8 characters; student.cgpa: Input should be a valid number"
  );
});

test("no response (network down / CORS) gives a helpful message", () => {
  assert.match(extractErrorMessage(new Error("Network Error")), /Cannot reach the server/);
});

test("unknown shape falls back", () => {
  assert.equal(extractErrorMessage({ response: { data: {} } }, "Nope"), "Nope");
});
