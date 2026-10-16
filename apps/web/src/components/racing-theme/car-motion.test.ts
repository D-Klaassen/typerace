import { describe, expect, it } from "vitest";
import { carMood, carPose, glide } from "./car-motion";

describe("a car's mood", () => {
  it("skids on a Typo, crashes on the third in a row, and drives on after the right key", () => {
    expect(carMood({ typosInARow: 0, finished: false })).toBe("driving");
    expect(carMood({ typosInARow: 1, finished: false })).toBe("skidding");
    expect(carMood({ typosInARow: 2, finished: false })).toBe("skidding");
    expect(carMood({ typosInARow: 3, finished: false })).toBe("crashed");
    expect(carMood({ typosInARow: 5, finished: false })).toBe("crashed");
    expect(carMood({ typosInARow: 0, finished: true })).toBe("finished");
  });
});

describe("a car's pose", () => {
  const still = { yaw: 0, slide: 0 };

  it("wobbles for 600 ms after a Typo, then drives straight again", () => {
    const during = carPose({ skidAgeMs: 150, crashAgeMs: null }, false);
    expect(Math.abs(during.yaw)).toBeGreaterThan(0.05);
    expect(Math.abs(during.yaw)).toBeLessThanOrEqual(0.45);

    expect(carPose({ skidAgeMs: 600, crashAgeMs: null }, false)).toEqual(still);
    expect(carPose({ skidAgeMs: null, crashAgeMs: null }, false)).toEqual(
      still,
    );
  });

  it("spins one and a quarter turns in a crash, ending sideways off its line", () => {
    const after = carPose({ skidAgeMs: null, crashAgeMs: 2_000 }, false);

    expect(after.yaw).toBeCloseTo(Math.PI * 2.5);
    expect(after.slide).toBeGreaterThan(0);
  });

  it("just stops with reduced motion: no wobble, spin or slide", () => {
    expect(carPose({ skidAgeMs: 150, crashAgeMs: null }, true)).toEqual(still);
    expect(carPose({ skidAgeMs: null, crashAgeMs: 300 }, true)).toEqual(still);
  });
});

describe("gliding to the next letter", () => {
  it("gets from the last letter to the new one in 90 ms, never past it", () => {
    expect(glide({ from: 4, to: 5, sinceChangeMs: 0 })).toBe(4);
    const halfway = glide({ from: 4, to: 5, sinceChangeMs: 45 });
    expect(halfway).toBeGreaterThan(4);
    expect(halfway).toBeLessThan(5);
    expect(glide({ from: 4, to: 5, sinceChangeMs: 90 })).toBe(5);
    expect(glide({ from: 4, to: 5, sinceChangeMs: 5_000 })).toBe(5);
  });

  it("covers a jump of several letters in the same time", () => {
    expect(glide({ from: 2, to: 6, sinceChangeMs: 90 })).toBe(6);
    expect(glide({ from: 2, to: 6, sinceChangeMs: 30 })).toBeLessThan(6);
  });
});
