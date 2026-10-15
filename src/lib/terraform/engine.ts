import { category, kb, record, rule } from "./kb";
import type { Assessment, CategoryId, GateItem, Observations, Recommendation } from "./types";

const LABELS: Record<string, string> = {
  yes: "Yes",
  no: "No",
  unknown: "Unknown",
  not_checked: "Not checked",
  unclear: "Unclear result",
  holds_ribbon: "Moulds / forms a ribbon",
  crumbles: "Crumbles, no ribbon",
  holds_together: "Mostly holds together",
  disperses: "Breaks apart / water turns cloudy",
  drains: "Water soaks away",
  stays_ponded: "Water stays standing",
  residue: "Residue left",
  no_residue: "No visible residue",
  none: "No growth",
  sparse: "Sparse growth",
  patchy: "Patchy growth",
  healthy: "Healthy growth",
  "": "Not answered",
};
export const label = (v: string) => LABELS[v] ?? v;

const REQUIRED: (keyof Observations)[] = [
  "cracksWhenDry",
  "crustAfterRain",
  "pondingAfterRain",
  "vegetation",
  "ribbon",
  "crumb",
  "drainage",
  "plateResidue",
  "waterAvailable",
  "waterQualityKnown",
];

/** Returns field -> message for missing answers. "Unknown" and "Not checked" are valid answers. */
export function validate(o: Observations, fields: (keyof Observations)[] = REQUIRED): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) if (o[f] === "") errors[f] = "Choose an answer — 'Unknown' or 'Not checked' are fine.";
  if (o.soilColour.length > 120) errors["soilColour"] = "Keep the description under 120 characters.";
  return errors;
}

function cite(ruleIds: string[], recordIds: string[]) {
  const sourceIds = Array.from(new Set(recordIds.flatMap((id) => record(id).source_ids)));
  return { ruleIds, recordIds, sourceIds };
}

export function assess(o: Observations): Assessment {
  const errors = validate(o);
  if (Object.keys(errors).length) throw new Error("Assessment requires every question to be answered.");

  const fired = new Set<string>();
  const candidates = new Map<CategoryId, string>();
  const clues: string[] = [];
  const conflicts: string[] = [];
  const missing: Assessment["missing"] = [];
  const flags: string[] = [];

  const unresolved = (v: string) => v === "not_checked" || v === "unclear";

  // Missing evidence -> next checks (from the household check records)
  if (unresolved(o.crumb)) missing.push({ field: "Dry crumb in still water", nextCheck: record("CHECK_002").next_step ?? record("CHECK_002").title });
  if (unresolved(o.drainage)) missing.push({ field: "Dig-and-fill drainage", nextCheck: record("CHECK_003").purpose ?? "" });
  if (unresolved(o.ribbon)) missing.push({ field: "Moist squeeze / ribbon", nextCheck: record("CHECK_001").next_step ?? "" });
  if (unresolved(o.plateResidue)) missing.push({ field: "Water on a dark plate", nextCheck: record("CHECK_004").purpose ?? "" });
  if (o.pondingAfterRain === "unknown") missing.push({ field: "Ponding after rain", nextCheck: "Look at the plot after the next rain and note whether water stays on the surface." });

  // RULE_003 crumb dispersion
  if (o.crumb === "disperses") {
    fired.add("RULE_003");
    candidates.set("possible_sodicity", "Dry crumb broke apart or clouded still water.");
    clues.push("Crumb dispersed in still water — a clue of unstable structure, not confirmation of sodium.");
  }
  // RULE_004 plate residue
  if (o.plateResidue === "residue") {
    fired.add("RULE_004");
    candidates.set("possible_salinity", "Residue remained after the water sample evaporated.");
    clues.push("Residue on the plate shows dissolved material in the water — it does not prove the soil is saline.");
  }
  // Heavy clay / compaction (SOIL_003): clay-like behaviour + poor water entry, crumb stable
  const poorWater = o.pondingAfterRain === "yes" || o.drainage === "stays_ponded";
  if (o.ribbon === "holds_ribbon") clues.push("Moist soil moulds into a ribbon — suggests clay-rich soil.");
  if (o.cracksWhenDry === "yes") clues.push("Cracks when dry — common in clay-rich soils; not specific to any one cause.");
  if (o.crustAfterRain === "yes") clues.push("Surface crust after rain — can come from sealing, compaction or unstable structure.");
  if (o.ribbon === "holds_ribbon" && poorWater && o.crumb === "holds_together") {
    candidates.set("possible_compaction_or_heavy_clay", "Clay-like soil with poor water entry, while the crumb stayed intact.");
  }

  // RULE_002 drainage
  if (poorWater) {
    fired.add("RULE_002");
    flags.push("Drainage concern: water stays on or in the soil.");
  }
  // RULE_005 water quality
  if (o.waterQualityKnown !== "yes") {
    fired.add("RULE_005");
    flags.push("Water quality is unknown — do not assume the water is safe for irrigation.");
  }

  // Conflicts
  if (o.pondingAfterRain === "yes" && o.drainage === "drains") conflicts.push("Ponding is reported after rain, but the dug hole drained. The plot may vary from spot to spot — repeat the drainage check in the ponded area.");
  if (o.pondingAfterRain === "no" && o.drainage === "stays_ponded") conflicts.push("No ponding after rain, but water stood in the dug hole. Water may enter the surface but drain slowly below.");
  if (o.crumb === "disperses" && o.ribbon === "crumbles") conflicts.push("The crumb dispersed, yet moist soil would not form a ribbon. Repeat both checks with fresh samples.");
  if (o.vegetation === "healthy" && poorWater && o.crumb === "disperses") conflicts.push("Healthy growth is reported alongside dispersion and ponding. Check whether observations came from the same area.");

  // RULE_001 insufficient / contradictory
  const coreMissing = unresolved(o.crumb) || unresolved(o.drainage);
  let primaryId: CategoryId;
  const alternatives: Assessment["alternatives"] = [];
  if (coreMissing || conflicts.length) {
    fired.add("RULE_001");
    primaryId = "mixed_or_insufficient";
    candidates.forEach((reason, id) => alternatives.push({ id, label: category(id).label, reason }));
  } else if (candidates.size === 1) {
    primaryId = Array.from(candidates.keys())[0]!;
  } else {
    if (candidates.size === 0) fired.add("RULE_001");
    primaryId = "mixed_or_insufficient";
    candidates.forEach((reason, id) => alternatives.push({ id, label: category(id).label, reason }));
  }
  // Always keep compaction as an alternative when water entry is poor (SOIL_003)
  if (poorWater && primaryId !== "possible_compaction_or_heavy_clay" && !alternatives.some((a) => a.id === "possible_compaction_or_heavy_clay")) {
    alternatives.push({ id: "possible_compaction_or_heavy_clay", label: category("possible_compaction_or_heavy_clay").label, reason: record("SOIL_003").fact ?? "" });
  }
  if (primaryId === "possible_sodicity" && !candidates.has("possible_salinity") && o.plateResidue !== "no_residue") {
    alternatives.push({ id: "possible_salinity", label: category("possible_salinity").label, reason: record("SOIL_002").use_in_reasoning ?? "" });
  }

  const sodicitySupported = primaryId === "possible_sodicity";
  if (!sodicitySupported) fired.add("RULE_006");

  const supportCount = clues.length;
  const confidence: Assessment["confidence"] =
    primaryId !== "mixed_or_insufficient" && supportCount >= 3 && missing.length === 0 ? "moderate" : "low";

  const cat = category(primaryId);
  const repair = buildRepair(o, { poorWater, sodicitySupported });
  const readiness = buildReadiness(o, { poorWater, conflicts: conflicts.length > 0, primaryId, missingCount: missing.length });

  return {
    primary: { id: primaryId, label: cat.label, meaning: cat.meaning, mustNotClaim: cat.must_not_claim },
    alternatives,
    confidence,
    confidenceNote:
      "Household checks are screening observations, not laboratory diagnoses. This system never issues a confirmed diagnosis.",
    observedSummary: summarise(o),
    supportingClues: clues,
    missing,
    conflicts,
    firedRules: kb.reasoning_rules
      .filter((r) => fired.has(r.id))
      .sort((a, b) => b.priority - a.priority)
      .map((r) => ({ id: r.id, explanation: r.explanation, action: r.then.action + (r.then.avoid ? ` — avoid: ${r.then.avoid.join("; ")}` : "") })),
    flags,
    repair,
    readiness,
  };
}

function summarise(o: Observations) {
  return [
    { label: "Soil appearance", value: o.soilColour.trim() || "Not described" },
    { label: "Cracks when dry", value: label(o.cracksWhenDry) },
    { label: "Crust after rain", value: label(o.crustAfterRain) },
    { label: "Ponding after rain", value: label(o.pondingAfterRain) },
    { label: "Vegetation", value: label(o.vegetation) },
    { label: "Ribbon check", value: label(o.ribbon) },
    { label: "Crumb in water", value: label(o.crumb) },
    { label: "Drainage hole", value: label(o.drainage) },
    { label: "Plate residue", value: label(o.plateResidue) },
    { label: "Water source available", value: label(o.waterAvailable) },
    { label: "Water quality known", value: label(o.waterQualityKnown) },
    ...(o.notes.trim() ? [{ label: "Your notes", value: o.notes.trim() }] : []),
  ];
}

function fromRecord(id: string, status: Recommendation["status"], rationale: string, ruleIds: string[]): Recommendation {
  const r = record(id);
  return {
    id,
    title: r.title,
    status,
    guidance: r.general_guidance ?? "",
    rationale,
    conditions: r.conditions ?? [],
    limitations: r.limitations ?? [],
    ...cite(ruleIds, [id]),
  };
}

function buildRepair(o: Observations, ctx: { poorWater: boolean; sodicitySupported: boolean }): Recommendation[] {
  const out: Recommendation[] = [];
  const structureConcern = o.crustAfterRain === "yes" || o.cracksWhenDry === "yes" || ctx.poorWater || o.crumb === "disperses";
  if (structureConcern) {
    out.push(fromRecord("TREAT_001", "conditional", "You reported crusting, cracking, poor water entry or an unstable crumb; organic matter may support structure over time.", []));
    out.push(fromRecord("TREAT_002", "conditional", "A protected surface may reduce crusting from rain impact and rapid drying.", []));
  }
  if (ctx.sodicitySupported) {
    out.push(fromRecord("TREAT_003", "conditional", "Evidence points to possible sodium-affected soil. A calcium-rich amendment may be considered only with local expert guidance — no amount can be given here.", []));
  } else {
    out.push(fromRecord("TREAT_003", "not_recommended", rule("RULE_006").then.action + ". " + rule("RULE_006").explanation, ["RULE_006"]));
  }
  if (ctx.poorWater || o.waterQualityKnown !== "yes") {
    const reasons = [ctx.poorWater && "water stays ponded", o.waterQualityKnown !== "yes" && "water quality is unknown"].filter(Boolean).join(" and ");
    out.push(fromRecord("TREAT_004", "not_recommended", `Heavy flushing is held back because ${reasons}.`, ["RULE_002", "RULE_005"].filter((id) => (id === "RULE_002" ? ctx.poorWater : o.waterQualityKnown !== "yes"))));
  }
  return out;
}

function buildReadiness(
  o: Observations,
  ctx: { poorWater: boolean; conflicts: boolean; primaryId: CategoryId; missingCount: number },
): Assessment["readiness"] {
  const g = kb.readiness_gate;
  const checksDone = [o.ribbon, o.crumb, o.drainage, o.plateResidue].every((v) => v !== "not_checked" && v !== "unclear");
  const status: GateItem["status"][] = [
    checksDone ? "met" : "not_met",
    o.drainage === "drains" && o.pondingAfterRain === "no" ? "met" : ctx.poorWater ? "not_met" : "unknown",
    o.crumb !== "not_checked" && o.crustAfterRain !== "unknown" ? (ctx.conflicts ? "not_met" : "met") : "unknown",
    o.waterQualityKnown === "yes" ? "met" : "unknown", // uncertainty is flagged in the UI
    ctx.primaryId === "possible_sodicity" ? "unknown" : "met", // no amendment is proposed otherwise
  ];
  const proceed = g.proceed_when.map((text, i) => ({ text, status: status[i] ?? "unknown" }));
  const triggers: string[] = [];
  if (o.drainage === "stays_ponded") triggers.push(g.pause_or_reassess_when[0]!);
  if (ctx.conflicts) triggers.push(g.pause_or_reassess_when[1]!);
  if (o.waterQualityKnown !== "yes") triggers.push(g.pause_or_reassess_when[2]!);
  if (ctx.primaryId === "possible_sodicity") triggers.push(g.pause_or_reassess_when[3]!);
  if (ctx.primaryId === "mixed_or_insufficient") triggers.push(g.pause_or_reassess_when[4]!);

  let verdict: Assessment["readiness"]["verdict"];
  let verdictText: string;
  if (!checksDone || ctx.conflicts || ctx.missingCount > 0) {
    verdict = "repeat_checks";
    verdictText = "Repeat or complete the household checks before planting.";
  } else if (ctx.poorWater || ctx.primaryId === "possible_sodicity" || ctx.primaryId === "mixed_or_insufficient") {
    verdict = "seek_advice";
    verdictText = "Pause. Seek local agricultural advice before planting or intensifying irrigation.";
  } else if (triggers.length) {
    verdict = "seek_advice";
    verdictText = "Proceed only with care — open questions remain. Local advice is recommended.";
  } else {
    verdict = "proceed";
    verdictText = "The readiness conditions in the knowledge base are met. Proceed carefully and keep observing.";
  }
  return { verdict, verdictText, proceed, pauseTriggers: triggers };
}
