import raw from "@/data/knowledge_base.json";

// Loose typing over the team's knowledge base JSON; the engine reads it, never hardcodes advice.
export interface KbRecord {
  id: string;
  category: string;
  title: string;
  fact?: string;
  purpose?: string;
  materials?: string[];
  procedure?: string[];
  possible_interpretation?: string;
  cannot_prove?: string[];
  next_step?: string;
  safety_note?: string;
  general_guidance?: string;
  use_in_reasoning?: string;
  conditions?: string[];
  limitations?: string[];
  evidence_status: string;
  source_ids: string[];
}
export interface KbRule {
  id: string;
  priority: number;
  if: string[];
  then: { assessment_category?: string; action: string; avoid?: string[]; allow_strong_diagnosis?: boolean };
  explanation: string;
  evidence_status: string;
}
export interface KbCategory { id: string; label: string; meaning: string; must_not_claim: string }
export interface KbSource { id: string; title: string; organization: string; url: string | null; note: string }

export interface KnowledgeBase {
  metadata: { project: string; scenario: string; version: string; purpose: string; limitations: string[] };
  assessment_categories: KbCategory[];
  knowledge_records: KbRecord[];
  reasoning_rules: KbRule[];
  readiness_gate: { title: string; proceed_when: string[]; pause_or_reassess_when: string[]; source_ids: string[] };
  sources: KbSource[];
  implementation_notes: { recommended_use: string[]; still_to_add: string[] };
}

export const kb = raw as unknown as KnowledgeBase;

export function record(id: string): KbRecord {
  const r = kb.knowledge_records.find((x) => x.id === id);
  if (!r) throw new Error(`Knowledge record ${id} missing from knowledge base`);
  return r;
}
export function rule(id: string): KbRule {
  const r = kb.reasoning_rules.find((x) => x.id === id);
  if (!r) throw new Error(`Rule ${id} missing from knowledge base`);
  return r;
}
export function category(id: string): KbCategory {
  const c = kb.assessment_categories.find((x) => x.id === id);
  if (!c) throw new Error(`Category ${id} missing from knowledge base`);
  return c;
}
export function source(id: string): KbSource | undefined {
  return kb.sources.find((s) => s.id === id);
}
export const recordsByCategory = (cat: string) => kb.knowledge_records.filter((r) => r.category === cat);
