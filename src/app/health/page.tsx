import type { Metadata } from "next";
import { SystemStatusDashboard } from "@/components/status/SystemStatusDashboard";

export const metadata: Metadata = {
  title: "Health & Status | OmniWatch",
  description: "Monitoramento em tempo real da disponibilidade, banco de dados, integrações e serviços do OmniWatch.",
};

export default function HealthPage() {
  return <SystemStatusDashboard />;
}
