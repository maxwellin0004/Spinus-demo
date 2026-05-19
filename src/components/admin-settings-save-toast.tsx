"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function AdminSettingsSaveToast({ show }: { show: boolean }) {
  useEffect(() => {
    if (show) toast.success("平台配置已保存");
  }, [show]);

  return null;
}
