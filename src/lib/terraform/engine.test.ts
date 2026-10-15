import { describe, expect, it } from "vitest";
import { assess, validate } from "./engine";
import { emptyObservations, type Observations } from "./types";

const base: Observations = {
  ...emptyObservations,
  cracksWhenDry: "yes",
  crustAfterRain: "yes",
  pondingAfterRain: "yes",
  vegetation: "sparse",
  ribbon: "holds_ribbon",
  crumb: "holds_together",
  drainage: "stays_ponded",
  plateResidue: "no_residue",
  waterAvailable: "yes",
  waterQualityKnown: "unknown",
};

describe("terraform reasoning engine", () => {
  it("treats 'Unknown' and 'Not checked' as valid answers but blank as missing", () => {
    expect(validate({ ...base, crumb: "not_checked" })).toEqual({});
    expect(validate({ ...base, crumb: "" })).toHaveProperty("crumb");
  });

  it("does not call hard crusted soil sodic when the crumb holds together", () => {
    const r = assess(base);
    expect(r.primary.id).toBe("possible_compaction_or_heavy_clay");
  });

  it("dispersing crumb gives only a possible sodicity interpretation, never confirmed", () => {
    const r = assess({ ...base, crumb: "disperses" });
    expect(r.primary.id).toBe("possible_sodicity");
    expect(r.firedRules.map((f) => f.id)).toContain("RULE_003");
  });

  it("missing crumb check yields insufficient evidence", () => {
    const r = assess({ ...base, crumb: "not_checked" });
    expect(r.primary.id).toBe("mixed_or_insufficient");
  });

  it("dispersion plus plate residue is mixed, not one diagnosis", () => {
    const r = assess({ ...base, crumb: "disperses", plateResidue: "residue" });
    expect(r.primary.id).toBe("mixed_or_insufficient");
  });

  it("never recommends flushing when water ponds or quality is unknown", () => {
    const r = assess(base);
    expect(r.repair.find((x) => x.id === "TREAT_004")?.status).toBe("not_recommended");
  });

  it("does not suggest a calcium amendment unless sodicity is the interpretation", () => {
    expect(assess(base).repair.find((x) => x.id === "TREAT_003")?.status).toBe("not_recommended");
    expect(assess({ ...base, crumb: "disperses" }).repair.find((x) => x.id === "TREAT_003")?.status).toBe("conditional");
  });

  it("contradictory drainage evidence forces repeat checks", () => {
    const r = assess({ ...base, drainage: "drains" });
    expect(r.conflicts.length).toBeGreaterThan(0);
    expect(r.readiness.verdict).toBe("repeat_checks");
  });
});
