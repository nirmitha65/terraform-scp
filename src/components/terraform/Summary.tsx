import type { Assessment } from "@/lib/terraform/types";
import { kb } from "@/lib/terraform/kb";
import { Bullets, EvidenceTag, Panel } from "./ui";

export function Summary({ a, isDemo }: { a: Assessment; isDemo: boolean }) {
  return (
    <div className="space-y-6">
      {isDemo && <p className="text-sm text-accent">Based on demonstration data.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-interpret/40 bg-interpret/5 p-6">
          <EvidenceTag tag="interpret" />
          <h3 className="mt-3 text-2xl font-semibold">{a.primary.label}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Confidence: <span className="capitalize">{a.confidence}</span> · not a confirmed diagnosis</p>
        </section>
        <section className="rounded-2xl border border-action/40 bg-action/5 p-6">
          <EvidenceTag tag="action">Readiness</EvidenceTag>
          <h3 className="mt-3 text-xl font-semibold">{a.readiness.verdictText}</h3>
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel tag="observed"><dl className="space-y-1 text-sm">{a.observedSummary.map((s) => <div key={s.label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{s.label}</dt><dd className="text-right">{s.value}</dd></div>)}</dl></Panel>
        <Panel tag="unknown">{a.missing.length ? <Bullets items={a.missing.map((m) => m.field)} /> : <p className="text-sm text-muted-foreground">Nothing missing.</p>}
          {a.conflicts.length > 0 && <p className="mt-3 text-sm text-caution">{a.conflicts.length} conflicting observation(s).</p>}</Panel>
        <Panel tag="action">
          <Bullets items={a.repair.map((r) => `${r.status === "not_recommended" ? "Hold: " : ""}${r.title}`)} />
        </Panel>
      </div>
      <Panel tag="next" title="Still to add to the knowledge base"><Bullets items={kb.implementation_notes.still_to_add} /></Panel>
    </div>
  );
}
