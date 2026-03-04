import { describe, it, expect } from "vitest";
import {
  calculateVerificationDigit,
  validateNit,
} from "../nit-validator";

describe("calculateVerificationDigit", () => {
  it("computes DV=2 for Bancolombia NIT 860069804", () => {
    expect(calculateVerificationDigit("860069804")).toBe(2);
  });

  it("computes a valid DV for 900123456", () => {
    const dv = calculateVerificationDigit("900123456");
    expect(dv).toBeGreaterThanOrEqual(0);
    expect(dv).toBeLessThanOrEqual(9);
  });

  it("returns -1 for empty string", () => {
    expect(calculateVerificationDigit("")).toBe(-1);
  });

  it("handles short NIT with padding (5 digits)", () => {
    const dv = calculateVerificationDigit("12345");
    expect(dv).toBeGreaterThanOrEqual(0);
    expect(dv).toBeLessThanOrEqual(10);
  });

  it("returns -1 for NIT longer than 15 digits", () => {
    expect(calculateVerificationDigit("1234567890123456")).toBe(-1);
  });

  it("strips non-digit characters before computing", () => {
    // "860.069.804" should compute same as "860069804"
    expect(calculateVerificationDigit("860.069.804")).toBe(2);
  });
});

describe("validateNit", () => {
  it("returns valid=true with correct fields for known NIT 860069804", () => {
    const result = validateNit("860069804");
    expect(result).toEqual({
      valid: true,
      baseNumber: "860069804",
      verificationDigit: 2,
      lastOneDigit: "4",
      lastTwoDigits: "04",
    });
  });

  it("returns valid=false for NIT shorter than 6 digits", () => {
    const result = validateNit("12345");
    expect(result.valid).toBe(false);
  });

  it("returns valid=false for NIT longer than 10 digits", () => {
    const result = validateNit("12345678901");
    expect(result.valid).toBe(false);
  });

  it("returns valid=false for non-numeric input", () => {
    const result = validateNit("abc");
    expect(result.valid).toBe(false);
    expect(result.baseNumber).toBe("");
  });

  it("extracts lastOneDigit from base number (not DV)", () => {
    // NIT 860069804 -> last 1 digit of base = "4"
    const result = validateNit("860069804");
    expect(result.lastOneDigit).toBe("4");
  });

  it("extracts lastTwoDigits from base number, zero-padded", () => {
    // NIT 860069804 -> last 2 digits of base = "04"
    const result = validateNit("860069804");
    expect(result.lastTwoDigits).toBe("04");
  });

  it("handles 6-digit valid NIT", () => {
    const result = validateNit("123456");
    expect(result.valid).toBe(true);
    expect(result.baseNumber).toBe("123456");
    expect(result.lastOneDigit).toBe("6");
    expect(result.lastTwoDigits).toBe("56");
  });

  it("handles 10-digit valid NIT", () => {
    const result = validateNit("1234567890");
    expect(result.valid).toBe(true);
    expect(result.baseNumber).toBe("1234567890");
    expect(result.lastOneDigit).toBe("0");
    expect(result.lastTwoDigits).toBe("90");
  });
});
