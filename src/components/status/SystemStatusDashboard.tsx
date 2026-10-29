"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Activity,
  Server,
  Database,
  Globe2,
  Cpu,
  Layers,
  Clock,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Radio,
  Lock,
} from "lucide-react";
import {
  fetchSystemHealth,
  HealthSummaryResponse,
  ComponentHealth,
  ServiceStatusType,
  UptimeDay,
} from "@/services/healthService";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/useUserStore";

const ADMIN_EMAIL = "jvgf98@gmail.com";

const FALLBACK_COMPONENT_IDS = [
  {
    id: "api_gateway",
    name: "API Core & Gateway",
    description: "Servidor de aplicação FastAPI, roteamento assíncrono e controle de tráfego.",
    category: "Core Infrastructure",
  },
  {
    id: "database",
    name: "Banco de Dados (PostgreSQL)",
    description: "Armazenamento relacional primário de usuários, listas, progresso e universos.",
    category: "Core Infrastructure",
  },
  {
    id: "cache_engine",
    name: "Camada de Cache & SWR",
    description: "Cache de alta velocidade em memória com resiliência Stale-If-Error.",
    category: "Core Infrastructure",
  },
  {
    id: "tmdb_api",
    name: "Integração TMDB API",
    description: "Provedor global de metadados de filmes, séries, elenco, imagens e tendências.",
    category: "External Integrations",
  },
  {
    id: "recommendation_ai",
    name: "Motor de Recomendação & IA",
    description: "Pipeline de Machine Learning (LightGBM), clusterização de gosto e busca vetorial.",
    category: "Application Services",
  },
  {
    id: "background_workers",
    name: "Workers de Sincronização & Universos",
    description: "Rotinas em background de atualização de calendário, franquias e grafos Wikidata.",
    category: "Application Services",
  },
];

function getComponentIcon(id: string) {
  switch (id) {
    case "api_gateway":
      return Server;
    case "database":
      return Database;
    case "cache_engine":
      return Zap;
    case "tmdb_api":
      return Globe2;
    case "recommendation_ai":
      return Cpu;
    case "background_workers":
      return Layers;
    default:
      return Activity;
  }
}

function getStatusConfig(status: ServiceStatusType) {
  switch (status) {
    case "operational":
      return {
        label: "Operacional",
        bannerTitle: "Todos os Sistemas Operacionais",
        bannerSubtitle:
          "Todos os microsserviços, banco de dados e integrações externas estão operando normalmente sem interrupções.",
        color: "text-emerald-500",
        bgSoft: "bg-emerald-500/10 dark:bg-emerald-500/15",
        border: "border-emerald-500/30",
        dot: "bg-emerald-500",
        barColor: "bg-emerald-500 hover:bg-emerald-400",
        icon: CheckCircle2,
      };
    case "degraded":
      return {
        label: "Desempenho Degradado",
        bannerTitle: "Degradação Parcial de Serviço",
        bannerSubtitle:
          "Alguns componentes apresentam latência acima do normal ou estão operando em modo de contingência (Stale-If-Error).",
        color: "text-amber-500",
        bgSoft: "bg-amber-500/10 dark:bg-amber-500/15",
        border: "border-amber-500/30",
        dot: "bg-amber-500",
        barColor: "bg-amber-500 hover:bg-amber-400",
        icon: AlertTriangle,
      };
    case "outage":
      return {
        label: "Indisponível",
        bannerTitle: "Interrupção de Sistema Detectada",
        bannerSubtitle:
          "Não foi possível estabelecer comunicação estável com o servidor principal da API ou banco de dados primário.",
        color: "text-red-500",
        bgSoft: "bg-red-500/10 dark:bg-red-500/15",
        border: "border-red-500/30",
        dot: "bg-red-500",
        barColor: "bg-red-500 hover:bg-red-400",
        icon: XCircle,
      };
  }
}

function buildOfflineFallback(): HealthSummaryResponse {
  const today = new Date();
  const history: UptimeDay[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    history.push({
      date: dateStr,
      status: i === 0 ? "outage" : "operational",
      uptime_pct: i === 0 ? 0.0 : 100.0,
    });
  }

  return {
    overall_status: "outage",
    version: "Offline",
    timestamp: new Date().toISOString(),
    uptime_seconds: 0,
    uptime_formatted: "Indisponível",
    uptime_percentage_90d: 98.89,
    avg_latency_ms: 0,
    components: FALLBACK_COMPONENT_IDS.map((item) => ({
      ...item,
      status: "outage",
      latency_ms: 0,
      message: "Servidor inacessível (Connection Refused / Timeout)",
    })),
    history_90d: history,
  };
}

export function SystemStatusDashboard() {
  const router = useRouter();
  const { user, fetchUser, isInitialized, isLoading: userLoading } = useUserStore();
  const [data, setData] = useState<HealthSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [clientPingMs, setClientPingMs] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [hoveredDay, setHoveredDay] = useState<UptimeDay | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [forbidden, setForbidden] = useState<boolean>(false);

  const isAdmin = user?.email?.trim().toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    if (!isInitialized && !userLoading) {
      fetchUser();
    }
  }, [isInitialized, userLoading, fetchUser]);

  const loadHealth = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    const startClient = performance.now();
    try {
      const res = await fetchSystemHealth();
      const elapsed = Math.round(performance.now() - startClient);
      setClientPingMs(elapsed);
      setData(res);
      setForbidden(false);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setForbidden(true);
      } else {
        setClientPingMs(null);
        setData(buildOfflineFallback());
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(30);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAdmin) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    loadHealth(false);
  }, [isInitialized, isAdmin, loadHealth]);

  useEffect(() => {
    if (!autoRefresh || !isAdmin || forbidden) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadHealth(false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, isAdmin, forbidden, loadHealth]);

  if (!isInitialized || userLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span>Verificando credenciais de administrador...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin || forbidden) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-card p-8 text-center space-y-5 shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Acesso Restrito ao Administrador
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta página de monitoramento e diagnóstico de infraestrutura é exclusiva para a conta{" "}
              <span className="font-mono font-semibold text-foreground">{ADMIN_EMAIL}</span>.
            </p>
          </div>
          <Button
            variant="default"
            className="w-full rounded-xl gap-2"
            onClick={() => router.replace("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  const overallStatus: ServiceStatusType = data?.overall_status || "operational";
  const bannerCfg = getStatusConfig(overallStatus);
  const BannerIcon = bannerCfg.icon;

  const formattedLastCheck = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  const formattedDate = data?.timestamp
    ? new Date(data.timestamp).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Header Corporativo da Status Page */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="relative w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                <Image
                  src="/logo_fundo_transparente.png"
                  alt="OmniWatch"
                  width={26}
                  height={26}
                  className="object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                  OmniWatch
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                  Status
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                autoRefresh
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-muted/40 text-muted-foreground"
              }`}
              title="Alternar atualização automática a cada 30 segundos"
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? "animate-pulse" : ""}`} />
              <span>{autoRefresh ? `Ao vivo (${countdown}s)` : "Auto-refresh pausado"}</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadHealth(true)}
              disabled={refreshing || loading}
              className="h-8 gap-1.5 text-xs rounded-full"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing || loading ? "animate-spin" : ""}`}
              />
              <span className="hidden xs:inline">Verificar Agora</span>
            </Button>

            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-full">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voltar ao App</span>
              </Button>
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Banner Global de Status (Estilo Atlassian / GitHub / Vercel Status) */}
        {loading ? (
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8 animate-pulse space-y-4">
            <div className="h-7 w-64 bg-muted rounded-lg" />
            <div className="h-4 w-96 max-w-full bg-muted rounded-lg" />
          </div>
        ) : (
          <section
            className={`relative overflow-hidden rounded-2xl border ${bannerCfg.border} ${bannerCfg.bgSoft} p-6 sm:p-8 transition-all duration-300 shadow-sm`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border ${bannerCfg.border} bg-background/80 shadow-sm`}
                >
                  <BannerIcon className={`w-7 h-7 sm:w-8 sm:h-8 ${bannerCfg.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      {bannerCfg.bannerTitle}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-background/80 border border-border/60 text-foreground">
                      <span
                        className={`w-2 h-2 rounded-full ${bannerCfg.dot} ${
                          overallStatus === "operational" ? "animate-ping" : ""
                        }`}
                      />
                      {data?.version || "v1.6.0"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    {bannerCfg.bannerSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-border/40 text-xs text-muted-foreground shrink-0">
                <span>Última checagem</span>
                <span className="font-mono font-semibold text-foreground text-sm mt-0.5">
                  {formattedLastCheck}
                </span>
                {formattedDate && <span className="text-[11px]">{formattedDate}</span>}
              </div>
            </div>
          </section>
        )}

        {/* Cards de Telemetria Rápida */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl border border-border/60 bg-card/50 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Uptime (90 dias)</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {loading ? "---" : `${data?.uptime_percentage_90d ?? 100}%`}
              </span>
              <span className="text-[11px] text-emerald-500 font-medium">SLA</span>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/50 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tempo Ativo da Sessão</span>
              <Clock className="w-4 h-4 text-sky-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground truncate">
                {loading ? "---" : data?.uptime_formatted || "0m"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/50 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Latência Média Interna</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {loading ? "---" : `${data?.avg_latency_ms ?? 0}`}
              </span>
              <span className="text-xs text-muted-foreground font-mono">ms</span>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/50 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Ping Cliente → API</span>
              <Activity className="w-4 h-4 text-purple-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {loading
                  ? "---"
                  : clientPingMs !== null
                  ? `${clientPingMs}`
                  : "Offline"}
              </span>
              {clientPingMs !== null && !loading && (
                <span className="text-xs text-muted-foreground font-mono">ms</span>
              )}
            </div>
          </div>
        </section>

        {/* Barra de Disponibilidade de 90 Dias (Estilo Statuspage.io / Cloudflare) */}
        <section className="rounded-2xl border border-border/60 bg-card/50 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                Histórico de Disponibilidade Global
              </h2>
              <p className="text-xs text-muted-foreground">
                Monitoramento contínuo de disponibilidade nos últimos 90 dias
              </p>
            </div>
            <div className="text-xs font-mono font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full self-start sm:self-auto">
              {data?.uptime_percentage_90d ?? 100}% de uptime
            </div>
          </div>

          {/* 90 Barras Verticais */}
          <div className="pt-2">
            <div className="flex items-center gap-[2px] sm:gap-[3px] h-10 w-full">
              {(data?.history_90d || []).map((day, idx) => {
                const dayCfg = getStatusConfig(day.status);
                return (
                  <div
                    key={day.date || idx}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`h-8 sm:h-9 flex-1 rounded-[2px] transition-all duration-150 cursor-pointer ${dayCfg.barColor} hover:scale-y-110`}
                    title={`${day.date}: ${dayCfg.label} (${day.uptime_pct}%)`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2.5">
              <span>90 dias atrás</span>
              {hoveredDay ? (
                <span className="font-mono text-foreground font-medium">
                  {hoveredDay.date} — {getStatusConfig(hoveredDay.status).label} (
                  {hoveredDay.uptime_pct}%)
                </span>
              ) : (
                <span className="hidden sm:inline">
                  Passe o mouse sobre uma barra para ver detalhes diários
                </span>
              )}
              <span>Hoje</span>
            </div>
          </div>
        </section>

        {/* Lista de Componentes do Sistema */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Status dos Componentes e Serviços
              </h2>
              <p className="text-xs text-muted-foreground">
                Verificação individual em tempo real de cada subsistema da arquitetura OmniWatch
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/40 divide-y divide-border/50 overflow-hidden">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 sm:p-5 flex items-center justify-between animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-muted rounded" />
                      <div className="h-3 w-72 bg-muted rounded" />
                    </div>
                    <div className="h-6 w-24 bg-muted rounded-full" />
                  </div>
                ))
              : (data?.components || []).map((comp: ComponentHealth) => {
                  const cfg = getStatusConfig(comp.status);
                  const CompIcon = getComponentIcon(comp.id);
                  const StatusIcon = cfg.icon;

                  return (
                    <div
                      key={comp.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center shrink-0 mt-0.5">
                          <CompIcon className="w-5 h-5 text-foreground/80" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base text-foreground">
                              {comp.name}
                            </h3>
                            <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {comp.category}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {comp.description}
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground/90 pt-0.5">
                            Diagnóstico: <span className="text-foreground/90">{comp.message}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.border} ${cfg.bgSoft} ${cfg.color}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{cfg.label}</span>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {comp.latency_ms > 0 ? `${comp.latency_ms} ms` : "0 ms"}
                        </span>
                      </div>
                    </div>
                  );
                })}
          </div>
        </section>

        {/* Histórico de Incidentes Recentes */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            Incidentes Recentes & Manutenções
          </h2>

          {overallStatus === "outage" ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-red-500 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Falha de Comunicação com a API Principal
                </span>
                <span className="text-xs font-mono text-red-400">Em andamento</span>
              </div>
              <p className="text-xs text-muted-foreground">
                O cliente web não conseguiu obter resposta da rota{" "}
                <code className="px-1.5 py-0.5 rounded bg-background/60 font-mono">
                  GET /api/health
                </code>
                . Verifique se o processo do FastAPI (Uvicorn) e o banco PostgreSQL estão em
                execução.
              </p>
            </div>
          ) : overallStatus === "degraded" ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-amber-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Alerta de Degradação Parcial
                </span>
                <span className="text-xs font-mono text-amber-400">Monitorando</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Um ou mais serviços secundários reportaram latência elevada ou modo de fallback. O
                sistema segue acessível para os usuários.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>
                Nenhum incidente reportado hoje. Todos os sistemas operam dentro dos parâmetros
                normais de SLA.
              </span>
            </div>
          )}
        </section>

        {/* Endpoint JSON Público Info */}
        <footer className="pt-4 pb-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>OmniWatch System Status Page</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>Endpoint: GET /api/health</span>
            <span>•</span>
            <span> Auto-refresh: 30s</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
