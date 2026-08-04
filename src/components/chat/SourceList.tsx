import type { ChatSource } from "@/components/chat/types";
import { ExternalLink, FileText, Package } from "lucide-react";

export function SourceList({ sources }: { sources: ChatSource[] }) {
  if (!sources?.length) return null;

  return (
    <div className="mt-3 space-y-1.5 border-t border-[var(--line)] pt-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
        Kaynaklar
      </p>
      <ul className="flex flex-wrap gap-2">
        {sources.map((source) => {
          const isProduct = source.source_type === "urun";
          const label = `${isProduct ? "Ürün" : "Politika"}: ${source.source_title}`;
          const className =
            "inline-flex max-w-full items-center gap-1.5 rounded-md border border-[var(--line)] bg-white/70 px-2.5 py-1 text-xs text-ink";

          const Icon = isProduct ? Package : FileText;

          if (source.urun_url) {
            return (
              <li key={`${source.source_type}-${source.source_id}`}>
                <a
                  href={source.urun_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${className} transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]`}
                  title={label}
                >
                  <Icon className="h-3 w-3 shrink-0 text-[var(--accent)]" aria-hidden />
                  <span className="truncate">{label}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
                </a>
              </li>
            );
          }

          return (
            <li key={`${source.source_type}-${source.source_id}`}>
              <span className={className} title={label}>
                <Icon className="h-3 w-3 shrink-0 text-[var(--accent)]" aria-hidden />
                <span className="truncate">{label}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
