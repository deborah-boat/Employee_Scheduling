import { describe, expect, it } from "vitest";
import { readStoredAuth } from "./authStorage";

describe("readStoredAuth", () => {
  it("returns empty auth for missing data", () => {
    expect(readStoredAuth(null)).toEqual({ role: null, user: null });
  });

  it("returns parsed auth when both role and user exist", () => {
    expect(
      readStoredAuth(JSON.stringify({ role: "employee", user: { id: 1, username: "Sara" } }))
    ).toEqual({
      role: "employee",
      user: { id: 1, username: "Sara" }
    });
  });

  it("falls back to empty auth for malformed json", () => {
    expect(readStoredAuth("not-json")).toEqual({ role: null, user: null });
  });

  it("falls back to empty auth when required fields are missing", () => {
    expect(readStoredAuth(JSON.stringify({ role: "employee" }))).toEqual({
      role: null,
      user: null
    });
  });
});