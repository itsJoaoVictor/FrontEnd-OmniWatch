import { api } from "@/lib/axios";

export type ServiceStatusType = "operational" | "degraded" | "outage";

export interface ComponentHealth {
  id: string;
  name: string;
  description: string;
  category: string;
  status: ServiceStatusType;
  latency_ms: number;
  message: string;
}

export interface UptimeDay {
  date: string;
  status: ServiceStatusType;
  uptime_pct: number;
}

export interface HealthSummaryResponse {
  overall_status: ServiceStatusType;
  version: string;
  timestamp: string;
  uptime_seconds: number;
  uptime_formatted: string;
  uptime_percentage_90d: number;
  avg_latency_ms: number;
  components: ComponentHealth[];
  history_90d: UptimeDay[];
}

export async function fetchSystemHealth(): Promise<HealthSummaryResponse> {
  const response = await api.get<HealthSummaryResponse>("/api/health", {
    timeout: 8000,
  });
  return response.data;
}
