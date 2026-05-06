import type { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return <AppShell role={UserRole.CREATOR}>{children}</AppShell>;
}
