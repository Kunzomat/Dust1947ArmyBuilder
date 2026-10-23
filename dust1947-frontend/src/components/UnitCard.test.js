import { getUnitCardFrameStyle } from "./UnitCard";

describe("getUnitCardFrameStyle", () => {
  it("uses a responsive square 80x80 mm geometry", () => {
    expect(getUnitCardFrameStyle()).toEqual({
      width: "min(400px, 100%)",
      maxWidth: "100%",
      flexShrink: 0,
      aspectRatio: "400 / 400",
      height: "auto",
    });
  });
});
