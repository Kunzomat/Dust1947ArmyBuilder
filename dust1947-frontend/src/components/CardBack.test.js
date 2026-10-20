import React from "react";
import { render } from "@testing-library/react";
import CardBack, {
  calculateCardBackScale,
  retainCardBackScale,
} from "./CardBack";
import { getUnitCardFrameStyle } from "./UnitCard";

describe("calculateCardBackScale", () => {
  it("fits the rotated table using its logical height as the visual width", () => {
    expect(calculateCardBackScale(480, 656, 618)).toBeCloseTo(
      Math.min(480 / 618, 656 / 860)
    );
  });

  it("fits within fractional inner bounds without rounding", () => {
    const originalGetBoundingClientRect = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "getBoundingClientRect"
    );
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetHeight"
    );

    Object.defineProperties(HTMLElement.prototype, {
      getBoundingClientRect: {
        configurable: true,
        value: () => ({ width: 496.5, height: 672.25 }),
      },
      offsetHeight: { configurable: true, get: () => 618 },
    });

    try {
      const { container } = render(<CardBack />);
      const rotatedTable = container.firstChild.firstChild;
      const availableWidth = 496.5 - 2 * 8;
      const availableHeight = 672.25 - 2 * 8;
      const expectedScale = Math.min(
        availableWidth / 618,
        availableHeight / 860
      );

      expect(getComputedStyle(rotatedTable).transform).toBe(
        `translate(-50%, -50%) rotate(90deg) scale(${expectedScale})`
      );
      const epsilon =
        Number.EPSILON * Math.max(availableWidth, availableHeight) * 4;
      expect(618 * expectedScale).toBeLessThanOrEqual(
        availableWidth + epsilon
      );
      expect(860 * expectedScale).toBeLessThanOrEqual(
        availableHeight + epsilon
      );
      expect(calculateCardBackScale(618, 860, 618)).toBe(1);
    } finally {
      [
        ["getBoundingClientRect", originalGetBoundingClientRect],
        ["offsetHeight", originalOffsetHeight],
      ].forEach(([property, descriptor]) => {
        if (descriptor) {
          Object.defineProperty(HTMLElement.prototype, property, descriptor);
        } else {
          delete HTMLElement.prototype[property];
        }
      });
    }
  });

  it("fits the rotated table by its visual height when the card is short", () => {
    expect(calculateCardBackScale(500, 400, 618)).toBeCloseTo(400 / 860);
  });

  it("fits the rotated table by its visual width when card width is constrained", () => {
    expect(calculateCardBackScale(400, 700, 618)).toBeCloseTo(400 / 618);
  });

  it("does not calculate a scale until all measurements are available", () => {
    expect(calculateCardBackScale(0, 656, 618)).toBeNull();
    expect(calculateCardBackScale(480, 656, 0)).toBeNull();
  });
});

describe("getUnitCardFrameStyle", () => {
  it("uses the same responsive portrait geometry for either card side", () => {
    const frameStyle = getUnitCardFrameStyle();

    expect(frameStyle).toEqual({
      width: "min(500px, 100%)",
      maxWidth: "100%",
      flexShrink: 0,
      aspectRatio: "500 / 676",
      height: "auto",
    });
  });
});

describe("retainCardBackScale", () => {
  it("keeps the last valid scale when a resize reports zero dimensions", () => {
    const zeroMeasurement = calculateCardBackScale(0, 0, 618);

    expect(retainCardBackScale(0.62, zeroMeasurement)).toBe(0.62);
  });

  it("uses a non-zero stable fallback when a remounted side has not measured yet", () => {
    expect(retainCardBackScale(null, null)).toBe(1);
  });

  it("replaces the fallback once the remounted side has valid bounds", () => {
    const measuredScale = calculateCardBackScale(480, 618, 618);

    expect(retainCardBackScale(1, measuredScale)).toBeCloseTo(618 / 860);
  });
});
