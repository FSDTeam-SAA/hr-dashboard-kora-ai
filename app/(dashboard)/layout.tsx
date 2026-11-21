import { Suspense } from "react";
import { AuthSessionGate } from "@/components/auth-session-gate";
import { HrShell } from "@/components/novya/shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="nv-loading">Loading your work…</div>}>
      <AuthSessionGate>
        <HrShell>{children}</HrShell>
      </AuthSessionGate>
    </Suspense>
  );
}
