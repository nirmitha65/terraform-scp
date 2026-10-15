import { Choice, TRI } from "./Choice";
import { Bullets, Cites, EmptyState, EvidenceTag, Panel } from "./ui";
import { kb, record, recordsByCategory } from "@/lib/terraform/kb";
import type { Assessment, Observations } from "@/lib/terraform/types";
import { cn } from "@/lib/utils";

type SetObs = <K extends keyof Observations>(k: K, v: Observations[K]) => void;
type Errs = Record<string, string>;

export function ObserveStage({ obs, set, errors }: { obs: Observations; set: SetObs; errors: Errs }) {
  return (
    <div className="space-y-6">
      <Panel tag="observed" title="What you see on the plot">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="colour" className="text-sm font-medium">Soil appearance and colour <span className="text-muted-foreground">(optional)</span></label>
            <input id="colour" value={obs.soilColour} maxLength={120} onChange={(e) => set("soilColour", e.target.value)}
              placeholder="e.g. dark grey, shiny when wet, hard clods"
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground" />
            {errors["soilColour"] && <p className="text-xs text-destructive">{errors["soilColour"]}</p>}
          </div>
          <Choice label="Does the soil crack when dry?" value={obs.cracksWhenDry} options={TRI} onChange={(v) => set("cracksWhenDry", v as Observations["cracksWhenDry"])} error={errors["cracksWhenDry"]} />
          <Choice label="Does a hard crust form on the surface after rain?" value={obs.crustAfterRain} options={TRI} onChange={(v) => set("crustAfterRain", v as Observations["crustAfterRain"])} error={errors["crustAfterRain"]} />
          <Choice label="Does water pond on the surface after rain?" value={obs.pondingAfterRain} options={TRI} onChange={(v) => set("pondingAfterRain", v as Observations["pondingAfterRain"])} error={errors["pondingAfterRain"]} />
          <Choice label="How are plants growing?" value={obs.vegetation}
            options={[{ value: "none", label: "Nothing grows" }, { value: "sparse", label: "Sparse" }, { value: "patchy", label: "Patchy" }, { value: "healthy", label: "Healthy" }, { value: "unknown", label: "Unknown" }]}
            onChange={(v) => set("vegetation", v as Observations["vegetation"])} error={errors["vegetation"]} />
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="notes" className="text-sm font-medium">Anything else you noticed <span className="text-muted-foreground">(optional)</span></label>
            <textarea id="notes" rows={2} maxLength={400} value={obs.notes} onChange={(e) => set("notes", e.target.value)}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm" />
            <p className="text-xs text-muted-foreground">Notes are shown back to you but not used to guess a cause.</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function CheckCard({ id, children }: { id: string; children: React.ReactNode }) {
  const r = record(id);
  return (
    <Panel tag="next" title={r.title}>
      <p className="text-sm text-muted-foreground">{r.purpose}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div><h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">You need</h4><Bullets items={r.materials ?? []} /></div>
        <div><h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">How</h4>
          <ol className="list-decimal space-y-1 pl-4 text-sm">{(r.procedure ?? []).map((p) => <li key={p}>{p}</li>)}</ol></div>
      </div>
      {r.safety_note && <p className="mt-4 rounded-lg border border-caution/40 bg-caution/10 p-3 text-sm"><EvidenceTag tag="caution" /> <span className="ml-1">{r.safety_note}</span></p>}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">What this check cannot prove</summary>
        <Bullets className="mt-2" items={r.cannot_prove ?? []} />
      </details>
      <div className="mt-5 border-t pt-4">{children}</div>
    </Panel>
  );
}

const CK = { value: "unclear", label: "Unclear" };
const NC = { value: "not_checked", label: "Not checked" };

export function CheckStage({ obs, set, errors }: { obs: Observations; set: SetObs; errors: Errs }) {
  return (
    <div className="space-y-6">
      <CheckCard id="CHECK_001">
        <Choice label="Result" value={obs.ribbon} options={[{ value: "holds_ribbon", label: "Moulds / forms a ribbon" }, { value: "crumbles", label: "Crumbles" }, CK, NC]} onChange={(v) => set("ribbon", v as Observations["ribbon"])} error={errors["ribbon"]} />
      </CheckCard>
      <CheckCard id="CHECK_002">
        <Choice label="Result" value={obs.crumb} options={[{ value: "holds_together", label: "Mostly holds together" }, { value: "disperses", label: "Breaks apart / cloudy water" }, CK, NC]} onChange={(v) => set("crumb", v as Observations["crumb"])} error={errors["crumb"]} />
      </CheckCard>
      <CheckCard id="CHECK_003">
        <Choice label="Result" value={obs.drainage} options={[{ value: "drains", label: "Water soaks away" }, { value: "stays_ponded", label: "Water stays standing" }, CK, NC]} onChange={(v) => set("drainage", v as Observations["drainage"])} error={errors["drainage"]} />
      </CheckCard>
      <CheckCard id="CHECK_004">
        <Choice label="Result" value={obs.plateResidue} options={[{ value: "residue", label: "Residue left" }, { value: "no_residue", label: "No visible residue" }, CK, NC]} onChange={(v) => set("plateResidue", v as Observations["plateResidue"])} error={errors["plateResidue"]} />
      </CheckCard>
      <Panel tag="observed" title="Water source">
        <div className="grid gap-6 md:grid-cols-2">
          <Choice label="Is a water source available?" value={obs.waterAvailable} options={TRI} onChange={(v) => set("waterAvailable", v as Observations["waterAvailable"])} error={errors["waterAvailable"]} />
          <Choice label="Is its quality reliably known?" help="Only answer Yes if you have trustworthy information — the plate check cannot tell you this." value={obs.waterQualityKnown} options={TRI} onChange={(v) => set("waterQualityKnown", v as Observations["waterQualityKnown"])} error={errors["waterQualityKnown"]} />
        </div>
      </Panel>
    </div>
  );
}

export function InterpretStage({ a }: { a: Assessment }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-interpret/40 bg-interpret/5 p-6 sm:p-8">
        <EvidenceTag tag="interpret" />
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{a.primary.label}</h2>
        <p className="mt-2 max-w-prose text-muted-foreground">{a.primary.meaning}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-lg bg-muted px-3 py-1.5">Confidence: <strong className="capitalize">{a.confidence}</strong></span>
          <span className="rounded-lg bg-muted px-3 py-1.5">Cannot claim: <strong>{a.primary.mustNotClaim}</strong></span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{a.confidenceNote}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel tag="observed" title="What you reported">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {a.observedSummary.map((s) => (<><dt key={s.label + "t"} className="text-muted-foreground">{s.label}</dt><dd key={s.label + "d"} className={cn((s.value === "Unknown" || s.value === "Not checked" || s.value === "Unclear result") && "text-unknown")}>{s.value}</dd></>))}
          </dl>
        </Panel>
        <Panel tag="interpret" title="Clues considered">
          {a.supportingClues.length ? <Bullets items={a.supportingClues} /> : <p className="text-sm text-muted-foreground">No observation pointed clearly to any one cause.</p>}
          {a.alternatives.length > 0 && (<>
            <h4 className="mb-2 mt-5 text-sm font-semibold">Other possibilities</h4>
            <ul className="space-y-2 text-sm">{a.alternatives.map((x) => <li key={x.id} className="rounded-lg bg-surface p-3"><strong>{x.label}</strong><p className="text-muted-foreground">{x.reason}</p></li>)}</ul>
          </>)}
        </Panel>
      </div>

      {a.conflicts.length > 0 && <Panel tag="caution" title="Observations that disagree"><Bullets items={a.conflicts} /></Panel>}
      <Panel tag="unknown" title="Missing information">
        {a.missing.length ? (
          <ul className="space-y-2 text-sm">{a.missing.map((m) => <li key={m.field} className="rounded-lg bg-surface p-3"><strong>{m.field}</strong><p className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground"><EvidenceTag tag="next" />{m.nextCheck}</p></li>)}</ul>
        ) : <p className="text-sm text-muted-foreground">All household checks have a result.</p>}
      </Panel>
      {a.flags.length > 0 && <Panel tag="caution" title="Flags"><Bullets items={a.flags} /></Panel>}
      <details className="rounded-xl border bg-surface p-4 text-sm">
        <summary className="cursor-pointer font-medium">Reasoning rules applied ({a.firedRules.length})</summary>
        <ul className="mt-3 space-y-2">{a.firedRules.map((r) => <li key={r.id}><span className="font-mono text-xs text-accent">{r.id}</span> — {r.action}. <span className="text-muted-foreground">{r.explanation}</span></li>)}</ul>
      </details>
    </div>
  );
}

const STATUS = {
  recommended: { tag: "action" as const, text: "Recommended action" },
  conditional: { tag: "action" as const, text: "Conditional action" },
  not_recommended: { tag: "caution" as const, text: "Not recommended now" },
};

export function RepairStage({ a }: { a: Assessment }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Each step below comes from the knowledge base and is shown with why it applies to you and the conditions that must hold.</p>
      {a.repair.map((r) => (
        <Panel key={r.id} className={r.status === "not_recommended" ? "border-caution/40" : ""}>
          <div className="flex flex-wrap items-center gap-3"><EvidenceTag tag={STATUS[r.status].tag}>{STATUS[r.status].text}</EvidenceTag><h3 className="text-lg font-semibold">{r.title}</h3></div>
          <p className="mt-2 text-sm">{r.guidance}</p>
          <p className="mt-3 rounded-lg bg-surface p-3 text-sm"><span className="font-medium">Why for you: </span>{r.rationale}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><h4 className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Conditions</h4><Bullets items={r.conditions} /></div>
            <div><h4 className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Limitations</h4><Bullets items={r.limitations} /></div>
          </div>
          <Cites ids={[...r.recordIds, ...r.ruleIds, ...r.sourceIds]} />
        </Panel>
      ))}
    </div>
  );
}

const VERDICT = {
  proceed: "border-action/50 bg-action/10",
  repeat_checks: "border-next/50 bg-next/10",
  seek_advice: "border-caution/50 bg-caution/10",
};
const ICON = { met: "✓", not_met: "✕", unknown: "?" };

export function ReadinessStage({ a }: { a: Assessment }) {
  return (
    <div className="space-y-6">
      <section className={cn("rounded-2xl border p-6", VERDICT[a.readiness.verdict])}>
        <EvidenceTag tag="action" />
        <h2 className="mt-3 text-2xl font-semibold">{a.readiness.verdictText}</h2>
      </section>
      <Panel title={kb.readiness_gate.title}>
        <ul className="space-y-2 text-sm">
          {a.readiness.proceed.map((p) => (
            <li key={p.text} className="flex gap-3 rounded-lg bg-surface p-3">
              <span aria-label={p.status} className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs",
                p.status === "met" ? "bg-action/20 text-action" : p.status === "not_met" ? "bg-caution/20 text-caution" : "bg-unknown/20 text-unknown")}>{ICON[p.status]}</span>
              {p.text}
            </li>
          ))}
        </ul>
      </Panel>
      {a.readiness.pauseTriggers.length > 0 && <Panel tag="caution" title="Pause or reassess because"><Bullets items={a.readiness.pauseTriggers} /></Panel>}
      <Cites ids={kb.readiness_gate.source_ids} />
    </div>
  );
}

function RecordPanel({ id, tag = "action" }: { id: string; tag?: "action" | "caution" }) {
  const r = record(id);
  return (
    <Panel tag={tag} title={r.title}>
      <p className="text-sm">{r.general_guidance}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div><h4 className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Conditions</h4><Bullets items={r.conditions ?? []} /></div>
        <div><h4 className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Limitations</h4><Bullets items={r.limitations ?? []} /></div>
      </div>
      <Cites ids={[r.id, ...r.source_ids]} />
    </Panel>
  );
}

export function CropsStage({ a }: { a: Assessment }) {
  const crops = recordsByCategory("crop_candidate");
  return (
    <div className="space-y-6">
      {a.readiness.verdict !== "proceed" && <Panel tag="caution" title="Readiness not yet met"><p className="text-sm">{a.readiness.verdictText} Crop choice should wait until the readiness checks pass.</p></Panel>}
      {crops.length === 0 ? (
        <EmptyState title="No verified crop candidates yet">
          The knowledge base (v{kb.metadata.version}) intentionally contains no crop list until crops are verified for local conditions. Add locally verified crop records and they will appear here with tolerances and concerns.
        </EmptyState>
      ) : null}
      <RecordPanel id="CROP_001" />
    </div>
  );
}

export function PlanStage({ a }: { a: Assessment }) {
  const om = record("TREAT_001");
  return (
    <div className="space-y-6">
      <Panel tag="unknown" title="Crop maturity range">
        <p className="text-sm text-muted-foreground">Unknown — no verified crop with a maturity range is in the knowledge base yet. No timeline is invented here.</p>
      </Panel>
      <Panel tag="interpret" title="Soil repair time">
        <Bullets items={om.limitations ?? []} />
        <p className="mt-3 text-sm text-muted-foreground">Add repair time to any crop maturity range once crops are verified.</p>
        <Cites ids={[om.id, ...om.source_ids]} />
      </Panel>
      {a.readiness.pauseTriggers.length > 0 && <Panel tag="next" title="Before the clock starts"><Bullets items={a.readiness.pauseTriggers} /></Panel>}
    </div>
  );
}

export function PlantStage() {
  return (
    <div className="space-y-6">
      <RecordPanel id="CARE_001" />
      <Panel tag="caution" title="Watering">
        <Bullets items={[rule("RULE_002"), rule("RULE_005")].map((r) => `${r.then.action}. Avoid: ${(r.then.avoid ?? []).join("; ")}.`)} />
      </Panel>
      <EmptyState title="Planting arrangement depends on the chosen crop">Crop-specific spacing, intervals and treatments must be verified before use.</EmptyState>
    </div>
  );
}

export function HarvestStage() {
  return (
    <div className="space-y-6">
      <RecordPanel id="HARVEST_001" />
      <RecordPanel id="TREAT_001" />
      <EmptyState title="Visible ripeness signs depend on the crop">They will appear here once crop records are added to the knowledge base.</EmptyState>
    </div>
  );
}

import { rule } from "@/lib/terraform/kb";
