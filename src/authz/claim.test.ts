import { describe, expect, it } from "vitest";
import { claimUrl, parseClaimUrl } from "./claim.js";

describe("claimUrl", () => {
  it("encodes id and token onto the approve path", () => {
    expect(claimUrl({ baseUrl: "http://h:49400", id: "r 1", token: "t/+" })).toBe(
      "http://h:49400/approve?id=r%201&token=t%2F%2B",
    );
  });

  it("tolerates a trailing slash on the base", () => {
    expect(claimUrl({ baseUrl: "http://h/", id: "i", token: "t" })).toBe(
      "http://h/approve?id=i&token=t",
    );
  });
});

describe("parseClaimUrl", () => {
  it("round-trips an absolute claim url", () => {
    const url = claimUrl({ baseUrl: "https://m3.tailnet-example.ts.net", id: "r1", token: "tok" });
    expect(parseClaimUrl(url)).toEqual({ id: "r1", token: "tok" });
  });

  it("parses a path-only claim", () => {
    expect(parseClaimUrl("/approve?id=a&token=b")).toEqual({ id: "a", token: "b" });
  });

  it.each([
    [""],
    ["not a url"],
    ["http://h/wrong?id=a&token=b"],
    ["http://h/approve?token=b"],
    ["http://h/approve?id=&token=b"],
    ["http://h/approve?id=a"],
  ])("rejects %j", (input) => {
    expect(parseClaimUrl(input)).toBeNull();
  });

  it("rejects null input at runtime despite its type", () => {
    expect(parseClaimUrl(null as unknown as string)).toBeNull();
  });

  it("requires both parts even with extra params", () => {
    expect(parseClaimUrl("/approve?id=a&token=b&extra=1")).toEqual({ id: "a", token: "b" });
    expect(parseClaimUrl("/approve?id=%20&token=b")).toEqual({ id: " ", token: "b" });
    expect(parseClaimUrl("/approve?id=&token=b")).toBeNull();
  });
});
