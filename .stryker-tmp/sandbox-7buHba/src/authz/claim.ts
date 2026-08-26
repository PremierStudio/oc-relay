// @ts-nocheck
import { isNonEmptyString } from "../manifest/validate.js";

/**
 * Claim links encode a pending authorization as a single URL a phone can
 * open (via tailscale serve, the Phase 6 DO anchor, or any fronting
 * transport). The token is single-use, short-lived, and verified against
 * a stored hash — never persisted alongside the request.
 */

export const APPROVE_PATH = "/approve";

export interface ClaimParts {
  id: string;
  token: string;
}

export function claimUrl(opts: { baseUrl: string; id: string; token: string }): string {
  const base = opts.baseUrl.replace(/\/$/, "");
  return `${base}${APPROVE_PATH}?id=${encodeURIComponent(opts.id)}&token=${encodeURIComponent(
    opts.token,
  )}`;
}

/** Extract claim parts from an approve URL (absolute or path-only). Returns null otherwise. */
export function parseClaimUrl(url: string): ClaimParts | null {
  if (!isNonEmptyString(url)) {
    return null;
  }
  const parsed = new URL(url, "http://relative.invalid");
  if (parsed.pathname !== APPROVE_PATH) {
    return null;
  }
  const id = parsed.searchParams.get("id") ?? "";
  const token = parsed.searchParams.get("token") ?? "";
  if (!isNonEmptyString(id) || !isNonEmptyString(token)) {
    return null;
  }
  return { id, token };
}
