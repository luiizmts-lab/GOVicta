"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";

const STATUS_COLORS: Record<string, string> = {
  RASCUNHO: "#94a3b8",
  EM_VALIDACAO: "#f59e0b",
  VALIDADO: "#10b981",
  ENVIADO_SUPRIMENTOS: "#0ea5e9",
  EM_COTACAO: "#6366f1",
  CONTRATADO: "#047857",
  DEVOLVIDO: "#ef4444",
  CANCELADO: "#64748b",
  SUBSTITUIDO: "#a855f7",
};

export function OrcamentoPorGrupoChart({ data }: { data: { grupo: string; valor: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="grupo" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis tickFormatter={(v) => formatCurrency(v)} width={100} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Bar dataKey="valor" fill="#047857" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function QqpPorStatusChart({ data }: { data: { status: string; quantidade: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        Nenhum QQP criado ainda.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="quantidade" nameKey="status" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#047857"} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
