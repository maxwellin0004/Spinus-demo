import type { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default function BrandLayout({ children }: { children: ReactNode }) {
  return <AppShell role={UserRole.BRAND}>{children}</AppShell>;
}
