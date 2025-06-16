import AuditTrail from "@/components/audit-trail";
import { SiteHeader } from "@/components/site-header";

export default function AuditTrailPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col gap-4 p-2 sm:p-4 md:gap-8 md:p-8">
        <AuditTrail />
      </main>
    </div>
  );
} 