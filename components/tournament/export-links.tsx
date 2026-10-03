import { Download } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExportLinks({ kind }: { kind: "players" | "teams" }) {
  return (
    <div aria-label={`Download all ${kind}`} className="flex flex-wrap gap-2" role="group">
      {(["csv", "pdf"] as const).map((format) => (
        <a
          aria-label={`Download all ${kind} as ${format.toUpperCase()}`}
          className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "min-h-11 rounded-xl px-4 text-sm font-bold")}
          href={`/admin/exports/${kind}/${format}`}
          key={format}
        >
          <Download aria-hidden="true" size={16} />
          {format.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
