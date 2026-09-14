import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <EmptyState
          icon={FileQuestion}
          title="404 · Entry not found"
          description="This record does not exist on the registry. The path may be mistyped or the entry removed."
        />
        <div className="flex justify-center">
          <Button asChild>
            <Link to="/dashboard">Return to the dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}