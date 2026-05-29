import test from "node:test";
import assert from "node:assert/strict";
import { getCorsOrigins, getJwtSecret } from "../src/config/env.js";

test("getCorsOrigins includes localhost by default", () => {
  const origins = getCorsOrigins();
  assert.ok(origins.includes("http://localhost:5173"));
});

test("getCorsOrigins merges CORS_ORIGINS env", () => {
  const prev = process.env.CORS_ORIGINS;
  process.env.CORS_ORIGINS = "https://example.com,https://app.example.com";
  try {
    const origins = getCorsOrigins();
    assert.ok(origins.includes("https://example.com"));
    assert.ok(origins.includes("https://app.example.com"));
  } finally {
    if (prev === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = prev;
  }
});

test("getJwtSecret returns dev fallback when unset outside production", () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = "development";
  try {
    const secret = getJwtSecret();
    assert.equal(typeof secret, "string");
    assert.ok(secret.length > 0);
  } finally {
    if (prevSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = prevSecret;
    process.env.NODE_ENV = prevEnv;
  }
});

test("getJwtSecret throws in production without JWT_SECRET", () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = "production";
  try {
    assert.throws(() => getJwtSecret(), /JWT_SECRET is required/);
  } finally {
    if (prevSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = prevSecret;
    process.env.NODE_ENV = prevEnv;
  }
});
