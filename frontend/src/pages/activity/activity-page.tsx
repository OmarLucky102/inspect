import { ScrollText } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

export function ActivityPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Audit log"
        title="Activity"
        description="Every action taken against registry records."
      />

      <EmptyState
        icon={ScrollText}
        title="No activity recorded"
        description="An audit feed is not yet available from the API. Actions you take will appear here when it is."
      />
    </div>
  );
}