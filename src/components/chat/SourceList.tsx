import type { ChatSource } from "@/components/chat/types";
import { ExternalLink, FileText, Package } from "lucide-react";

export function SourceList({ sources }: { sources: ChatSource[] }) {
  if (!sources?.length) return null;

  return (
    <div className="mt-3.5 space-y-2 border-t border-slate-200/80 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
        Doğrulanmış Kaynaklar
      </p>
      <ul className="flex flex-wrap gap-2">
        {sources.map((source) => {
          const isProduct = source.source_type === "urun";
          const label = `${isProduct ? "Ürün" : "Politika"}: ${source.source_title}`;
          const className =
            "group inline-flex max-w-full items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-xs text-indigo-700 backdrop-blur-md";

          const Icon = isProduct ? Package : FileText;

          if (source.urun_url) {
            return (
              <li key={`${source.source_type}-${source.source_id}`}>
                <a
                  href={source.urun_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${className} transition hover:border-indigo-300 hover:bg-indigo-600 hover:text-white shadow-sm`}
                  title={label}
                >
                  <Icon
                    className="h-3 w-3 shrink-0 text-indigo-600 group-hover:text-white"
                    aria-hidden
                  />
                  <span className="truncate">{label}</span>
                  <ExternalLink
                    className="h-3 w-3 shrink-0 opacity-70 group-hover:text-white"
                    aria-hidden
                  />
                </a>
              </li>
            );
          }

          return (
            <li key={`${source.source_type}-${source.source_id}`}>
              <span className={className} title={label}>
                <Icon className="h-3 w-3 shrink-0 text-indigo-600" aria-hidden />
                <span className="truncate">{label}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
