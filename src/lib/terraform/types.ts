// Observation model. "unknown" = user looked but can't tell; "not_checked" = not done yet.
export type TriState = "yes" | "no" | "unknown";
export type CheckResult<T extends string> = T | "unclear" | "not_checked";

export interface Observations {
  soilColour: string;
  cracksWhenDry: TriState | "";
  crustAfterRain: TriState | "";
  pondingAfterRain: TriState | "";
  vegetation: "none" | "sparse" | "patchy" | "healthy" | "unknown" | "";
  notes: string;
  ribbon: CheckResult<"holds_ribbon" | "crumbles"> | "";
  crumb: CheckResult<"holds_together" | "disperses"> | "";
  drainage: CheckResult<"drains" | "stays_ponded"> | "";
  plateResidue: CheckResult<"residue" | "no_residue"> | "";
  waterAvailable: TriState | "";
  waterQualityKnown: TriState | "";
}

export const emptyObservations: Observations = {
  soilColour: "",
  cracksWhenDry: "",
  crustAfterRain: "",
  pondingAfterRain: "",
  vegetation: "",
  notes: "",
  ribbon: "",
  crumb: "",
  drainage: "",
  plateResidue: "",
  waterAvailable: "",
  waterQualityKnown: "",
};

export type CategoryId =
  | "possible_sodicity"
  | "possible_salinity"
  | "possible_compaction_or_heavy_clay"
  | "mixed_or_insufficient";

export interface Citation {
  ruleIds: string[];
  recordIds: string[];
  sourceIds: string[];
}

export interface Recommendation extends Citation {
  id: string;
  title: string;
  status: "recommended" | "conditional" | "not_recommended";
  guidance: string;
  rationale: string;
  conditions: string[];
  limitations: string[];
}

export interface GateItem {
  text: string;
  status: "met" | "not_met" | "unknown";
}

export interface Assessment {
  primary: { id: CategoryId; label: string; meaning: string; mustNotClaim: string };
  alternatives: { id: CategoryId; label: string; reason: string }[];
  confidence: "low" | "moderate";
  confidenceNote: string;
  observedSummary: { label: string; value: string }[];
  supportingClues: string[];
  missing: { field: string; nextCheck: string }[];
  conflicts: string[];
  firedRules: { id: string; explanation: string; action: string }[];
  flags: string[];
  repair: Recommendation[];
  readiness: {
    verdict: "proceed" | "repeat_checks" | "seek_advice";
    verdictText: string;
    proceed: GateItem[];
    pauseTriggers: string[];
  };
}
