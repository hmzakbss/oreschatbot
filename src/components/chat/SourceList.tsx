import type { ChatSource } from "@/components/chat/types";

export function SourceList({ sources }: { sources: ChatSource[] }) {
  if (!sources?.length) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Kaynaklar
      </p>
      <ul className="flex flex-wrap gap-2">
        {sources.map((source) => {
          const label = `${source.source_type === "urun" ? "Ürün" : "Politika"}: ${source.source_title}`;
          const className =
            "inline-flex max-w-full items-center rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700";

          if (source.urun_url) {
            return (
              <li key={`${source.source_type}-${source.source_id}`}>
                <a
                  href={source.urun_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${className} hover:border-zinc-400 hover:text-zinc-900`}
                  title={label}
                >
                  <span className="truncate">{label}</span>
                </a>
              </li>
            );
          }

          return (
            <li key={`${source.source_type}-${source.source_id}`}>
              <span className={className} title={label}>
                <span className="truncate">{label}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
