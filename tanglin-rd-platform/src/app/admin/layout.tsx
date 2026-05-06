import type { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell role={UserRole.ADMIN}>{children}</AppShell>;
}
