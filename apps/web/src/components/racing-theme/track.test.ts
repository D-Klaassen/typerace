import { describe, expect, it } from "vitest";
import { lapsFor, placeOnTrack } from "./track";

describe("the circuit", () => {
  it("has a lap for every 100 or so characters, and at least one", () => {
    expect(lapsFor(50)).toBe(1);
    expect(lapsFor(100)).toBe(1);
    expect(lapsFor(130)).toBe(1);
    expect(lapsFor(200)).toBe(2);
    expect(lapsFor(5)).toBe(1);
  });

  it("starts and finishes every race on the start line", () => {
    const start = placeOnTrack(0, 1, 0);

    expect(placeOnTrack(1, 1, 0)).toMatchObject({
      x: expect.closeTo(start.x, 3),
      y: expect.closeTo(start.y, 3),
    });
    // Halfway through a two-lap race is back at the line too.
    expect(placeOnTrack(0.5, 2, 0)).toMatchObject({
      x: expect.closeTo(start.x, 3),
      y: expect.closeTo(start.y, 3),
    });
    expect(placeOnTrack(0.5, 1, 0).x).not.toBeCloseTo(start.x, 0);
  });
});
