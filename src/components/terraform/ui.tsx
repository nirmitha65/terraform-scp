import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { source } from "@/lib/terraform/kb";

export type Tag = "observed" | "interpret" | "unknown" | "next" | "action" | "caution";
const TAG_TEXT: Record<Tag, string> = {
  observed: "Observed",
  interpret: "Possible interpretation",
  unknown: "Unknown",
  next: "Next check",
  action: "Recommended action",
  caution: "Caution",
};
const TAG_CLASS: Record<Tag, string> = {
  observed: "text-observed border-observed/40 bg-observed/10",
  interpret: "text-interpret border-interpret/40 bg-interpret/10",
  unknown: "text-unknown border-unknown/40 bg-unknown/10",
  next: "text-next border-next/40 bg-next/10",
  action: "text-action border-action/40 bg-action/10",
  caution: "text-caution border-caution/40 bg-caution/10",
};

export function EvidenceTag({ tag, children }: { tag: Tag; children?: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider", TAG_CLASS[tag])}>
      {children ?? TAG_TEXT[tag]}
    </span>
  );
}

export function Panel({ tag, title, children, className }: { tag?: Tag; title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 sm:p-6", className)}>
      {(tag || title) && (
        <header className="mb-3 flex flex-wrap items-center gap-3">
          {tag && <EvidenceTag tag={tag} />}
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Cites({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const s = source(id);
        return (
          <span key={id} title={s?.title} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {s?.url ? <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-foreground underline-offset-2 hover:underline">{id}</a> : id}
          </span>
        );
      })}
    </div>
  );
}

export function Bullets({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-1.5 text-sm", className)}>
      {items.map((t, i) => (
        <li key={i} className="flex gap-2"><span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />{t}</li>
      ))}
    </ul>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed bg-surface p-6 text-center">
      <EvidenceTag tag="unknown">Not in knowledge base</EvidenceTag>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <div className="mx-auto mt-2 max-w-prose text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
