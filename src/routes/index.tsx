import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { assess, validate } from "@/lib/terraform/engine";
import { kb } from "@/lib/terraform/kb";
import { emptyObservations, type Assessment, type Observations } from "@/lib/terraform/types";
import { DEMO_OBSERVATIONS } from "@/lib/terraform/demo";
import {
  CheckStage, CropsStage, HarvestStage, InterpretStage, ObserveStage, PlanStage, PlantStage, ReadinessStage, RepairStage,
} from "@/components/terraform/Stages";
import { Summary } from "@/components/terraform/Summary";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TERRAFORM — Sodic Clay Soil Recovery Guide" },
      { name: "description", content: "Guided, evidence-aware soil assessment using only eyes, hands and household items." },
      { property: "og:title", content: "TERRAFORM — Sodic Clay Soil Recovery Guide" },
      { property: "og:description", content: "Observe, check, interpret and plan soil recovery without a laboratory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STAGES = [
  { key: "observe", title: "Observe", lead: "Describe what you see. Choose 'Unknown' when you can't tell — never guess." },
  { key: "check", title: "Check", lead: "Simple checks with household items. Each one has limits, shown below." },
  { key: "interpret", title: "Interpret", lead: "What your evidence may mean — and what it cannot tell us." },
  { key: "repair", title: "Repair", lead: "Conditional soil-structure and water steps, with reasons and safety conditions." },
  { key: "readiness", title: "Readiness", lead: "Should you proceed, repeat checks, or seek advice?" },
  { key: "crops", title: "Choose crops", lead: "Candidates appear only when supported by verified evidence." },
  { key: "plan", title: "Plan", lead: "Realistic time: crop maturity plus soil repair." },
  { key: "plant", title: "Plant & care", lead: "Care organized by growth stage, with careful watering." },
  { key: "harvest", title: "Harvest & restore", lead: "Harvest and give back to the soil." },
] as const;
const SUMMARY = STAGES.length;

const OBSERVE_FIELDS: (keyof Observations)[] = ["cracksWhenDry", "crustAfterRain", "pondingAfterRain", "vegetation", "soilColour"];
const CHECK_FIELDS: (keyof Observations)[] = ["ribbon", "crumb", "drainage", "plateResidue", "waterAvailable", "waterQualityKnown"];

function Index() {
  const [stage, setStage] = useState(0);
  const [obs, setObs] = useState<Observations>(emptyObservations);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Assessment | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const set = <K extends keyof Observations>(k: K, v: Observations[K]) => {
    setObs((o) => ({ ...o, [k]: v }));
    setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
    if (result) setResult(null); // results are stale once inputs change
    setIsDemo(false);
  };

  const go = (n: number) => { setStage(n); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); };

  const next = () => {
    if (stage === 0) {
      const e = validate(obs, OBSERVE_FIELDS);
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    if (stage === 1) {
      const e = validate(obs, CHECK_FIELDS);
      setErrors(e);
      if (Object.keys(e).length) return;
      try {
        setResult(assess(obs));
        setEngineError(null);
      } catch (err) {
        setEngineError(err instanceof Error ? err.message : "The reasoning engine failed.");
        return;
      }
    }
    go(stage + 1);
  };

  const loadDemo = () => { setObs(DEMO_OBSERVATIONS); setErrors({}); setResult(null); setIsDemo(true); go(0); };
  const reset = () => { setObs(emptyObservations); setErrors({}); setResult(null); setIsDemo(false); go(0); };

  const needsResult = stage >= 2;
  const errorCount = Object.keys(errors).length;
  const meta = STAGES[stage];

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">{kb.metadata.scenario}</p>
            <h1 className="text-xl font-bold">TERRAFORM <span className="font-normal text-muted-foreground">· Soil recovery guide</span></h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadDemo}>Load demo case</Button>
            <Button variant="ghost" size="sm" onClick={reset}>Start over</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Assessment progress" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <p className="mb-3 text-xs text-muted-foreground">Stage {Math.min(stage + 1, SUMMARY)} of {SUMMARY}</p>
          <div className="mb-4 h-1 overflow-hidden rounded-full bg-muted lg:hidden"><div className="h-full bg-primary transition-all" style={{ width: `${((stage + 1) / (SUMMARY + 1)) * 100}%` }} /></div>
          <ol className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {[...STAGES.map((s) => s.title), "Summary"].map((t, i) => {
              const locked = i >= 2 && !result;
              const active = i === stage;
              return (
                <li key={t} className="shrink-0">
                  <button disabled={locked} onClick={() => go(i)} aria-current={active ? "step" : undefined}
                    className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      locked && "cursor-not-allowed opacity-40 hover:bg-transparent")}>
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]",
                      active ? "border-primary bg-primary text-primary-foreground" : i < stage ? "border-primary text-primary" : "")}>{i + 1}</span>
                    <span className="whitespace-nowrap">{t}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <main className="min-w-0">
          {isDemo && <div role="status" className="mb-5 rounded-lg border border-accent/50 bg-accent/10 px-4 py-2.5 text-sm"><strong>Demonstration data</strong> — these are example observations, not a real plot. Change any answer to make it yours.</div>}

          <div className="mb-6">
            <h2 className="text-3xl font-bold sm:text-4xl">{meta ? meta.title : "Assessment summary"}</h2>
            <p className="mt-2 max-w-prose text-muted-foreground">{meta ? meta.lead : "A single view of your observations, interpretation and next steps."}</p>
          </div>

          {stage === 0 && <ObserveStage obs={obs} set={set} errors={errors} />}
          {stage === 1 && <CheckStage obs={obs} set={set} errors={errors} />}
          {needsResult && !result && (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-muted-foreground">Your answers changed. Re-run the assessment to see updated results.</p>
              <Button className="mt-4" onClick={() => go(1)}>Go to checks</Button>
            </div>
          )}
          {result && stage === 2 && <InterpretStage a={result} />}
          {result && stage === 3 && <RepairStage a={result} />}
          {result && stage === 4 && <ReadinessStage a={result} />}
          {result && stage === 5 && <CropsStage a={result} />}
          {result && stage === 6 && <PlanStage a={result} />}
          {result && stage === 7 && <PlantStage />}
          {result && stage === 8 && <HarvestStage />}
          {result && stage === SUMMARY && <Summary a={result} isDemo={isDemo} />}

          {errorCount > 0 && <p role="alert" className="mt-6 text-sm text-destructive">{errorCount} question{errorCount > 1 ? "s" : ""} still need an answer.</p>}
          {engineError && <p role="alert" className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">{engineError}</p>}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
            <Button variant="outline" onClick={() => go(stage - 1)} disabled={stage === 0}>Back</Button>
            <div className="flex flex-wrap gap-2">
              {stage >= 2 && <Button variant="ghost" onClick={() => go(0)}>Revise observations</Button>}
              {stage < SUMMARY && (
                <Button onClick={next} disabled={needsResult && !result}>
                  {stage === 1 ? "Run assessment" : stage === SUMMARY - 1 ? "View summary" : "Continue"}
                </Button>
              )}
              {stage === SUMMARY && <Button onClick={() => typeof window !== "undefined" && window.print()}>Print summary</Button>}
            </div>
          </div>
        </main>
      </div>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted-foreground">
        Team M-A-N Developers · Knowledge base v{kb.metadata.version}. Household checks are screening observations, not laboratory diagnoses.
      </footer>
    </div>
  );
}
