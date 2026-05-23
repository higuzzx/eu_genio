"use client";

import React, { useState, useCallback } from 'react';
import {
  Plus, Trash2, Play, RotateCcw, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, RefreshCw,
  CheckCircle2, GitBranch, BarChart3,
} from 'lucide-react';
import { useProject } from '@/context/project-context';
import { SimplexSolver } from '@/models/SimplexSolver';
import type { Constraint, ConstraintSign } from '@/models/SimplexSolver';
import type { SimplexResult, BranchNode } from '@/models/SimplexResult';
import type { ProblemData } from '@/models/ProblemData';
import type { Variable } from '@/models/Variable';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

type TabId = 'entrada' | 'simplex' | 'grafico' | 'dualidade' | 'inteiras';

const TABS: { id: TabId; label: string; num: string }[] = [
  { id: 'entrada',   label: 'Entrada',          num: '1' },
  { id: 'simplex',   label: 'Simplex',           num: '2' },
  { id: 'grafico',   label: 'Gráfico',           num: '3' },
  { id: 'dualidade', label: 'Dualidade',         num: '4' },
  { id: 'inteiras',  label: 'Soluções Inteiras', num: '5' },
];

// ═══════════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════

const fmt = (n: number, d = 4) =>
  Number.isInteger(n) ? String(n) : parseFloat(n.toFixed(d)).toString();

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
      {children}
    </p>
  );
}

function DarkCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl ${className}`}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 1 — ENTRADA
// ═══════════════════════════════════════════════════════════════

interface EntradaProps {
  variables: Variable[];
  problemData: ProblemData;
  onVariableAdd: () => void;
  onVariableRemove: (i: number) => void;
  onVariableRename: (i: number, name: string) => void;
  onTypeChange: (t: 'MAX' | 'MIN') => void;
  onObjChange: (i: number, v: string) => void;
  onConstraintAdd: () => void;
  onConstraintRemove: (i: number) => void;
  onCoeffChange: (ci: number, vi: number, v: string) => void;
  onSignChange: (ci: number, v: string) => void;
  onRhsChange: (ci: number, v: string) => void;
  onSolve: () => void;
  onClear: () => void;
  isSolving: boolean;
  error: string | null;
}

function EntradaTab(p: EntradaProps) {
  const valid =
    p.problemData.objective.length > 0 &&
    p.problemData.objective.every((v) => v.trim() !== '') &&
    p.problemData.constraints.length > 0 &&
    p.problemData.constraints.every(
      (c) => c.coeffs.every((x) => x.trim() !== '') && c.rhs.trim() !== ''
    );

  const inputCls =
    'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 ' +
    'focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:ring-1 ' +
    'h-9 text-sm text-center font-mono rounded-lg';

  return (
    <DarkCard>
      <div className="px-6 py-5 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-200">
          Entrada de Programação Linear
        </h2>
      </div>

      <div className="px-6 py-6 space-y-8">

        {/* ── Função Objetivo ────────────────────────────── */}
        <section>
          <SectionLabel>Função Objetivo</SectionLabel>
          <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-800/40 rounded-xl border border-slate-800">
            <select
              value={p.problemData.type}
              onChange={(e) => p.onTypeChange(e.target.value as 'MAX' | 'MIN')}
              className="h-9 px-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="MAX">Maximizar</option>
              <option value="MIN">Minimizar</option>
            </select>

            <span className="text-slate-500 font-mono font-bold text-sm px-1">Z =</span>

            {p.variables.map((v, i) => (
              <React.Fragment key={v.id}>
                {i > 0 && <span className="text-slate-600 font-bold select-none">+</span>}
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    className={`w-20 ${inputCls}`}
                    placeholder="coef"
                    value={p.problemData.objective[i] ?? ''}
                    onChange={(e) => p.onObjChange(i, e.target.value)}
                  />
                  <span className="text-sm font-bold text-blue-400 min-w-[28px]">
                    {v.name}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ── Variáveis ──────────────────────────────────── */}
        <section>
          <SectionLabel>Variáveis de Decisão</SectionLabel>
          <div className="flex flex-wrap items-center gap-2">
            {p.variables.map((v, i) => (
              <div
                key={v.id}
                className="flex items-center gap-1.5 bg-blue-950/60 border border-blue-800/50 rounded-lg px-3 py-1.5 group"
              >
                <input
                  value={v.name}
                  onChange={(e) => p.onVariableRename(i, e.target.value)}
                  className="w-14 text-xs font-bold text-blue-300 bg-transparent border-0 outline-none p-0"
                />
                {p.variables.length > 1 && (
                  <button
                    onClick={() => p.onVariableRemove(i)}
                    className="text-blue-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-1"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={p.onVariableAdd}
              className="flex items-center gap-1 h-8 px-3 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-xs font-medium transition-colors"
            >
              <Plus size={12} /> Variável
            </button>
          </div>
        </section>

        {/* ── Restrições ─────────────────────────────────── */}
        <section>
          <SectionLabel>Restrições</SectionLabel>
          <div className="space-y-2">
            {p.problemData.constraints.map((c, ci) => (
              <div
                key={ci}
                className="flex flex-wrap items-center gap-2 p-3 bg-slate-800/40 rounded-xl border border-slate-800 hover:border-slate-700 group transition-colors"
              >
                <span className="text-[11px] font-bold text-slate-600 w-7 shrink-0">
                  R{ci + 1}
                </span>

                {p.variables.map((v, vi) => (
                  <React.Fragment key={v.id}>
                    {vi > 0 && (
                      <span className="text-slate-600 font-bold select-none">+</span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        className={`w-20 ${inputCls}`}
                        placeholder="0"
                        value={c.coeffs[vi] ?? ''}
                        onChange={(e) => p.onCoeffChange(ci, vi, e.target.value)}
                      />
                      <span className="text-xs font-bold text-slate-400 min-w-[28px]">
                        {v.name}
                      </span>
                    </div>
                  </React.Fragment>
                ))}

                <select
                  value={c.sign}
                  onChange={(e) => p.onSignChange(ci, e.target.value)}
                  className="h-9 px-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="<=">≤</option>
                  <option value=">=">≥</option>
                  <option value="=">=</option>
                </select>

                <input
                  type="number"
                  className={`w-24 ${inputCls}`}
                  placeholder="RHS"
                  value={c.rhs}
                  onChange={(e) => p.onRhsChange(ci, e.target.value)}
                />

                {p.problemData.constraints.length > 1 && (
                  <button
                    onClick={() => p.onConstraintRemove(ci)}
                    className="ml-auto text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={p.onConstraintAdd}
            className="mt-2 flex items-center gap-1 h-8 px-3 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-xs font-medium transition-colors"
          >
            <Plus size={12} /> Adicionar Restrição
          </button>
        </section>

        {/* ── Erro ───────────────────────────────────────── */}
        {p.error && (
          <div className="flex items-center gap-2 p-3 bg-red-950/60 border border-red-800/50 rounded-xl text-red-400 text-sm">
            <AlertCircle size={14} className="shrink-0" />
            {p.error}
          </div>
        )}

        {/* ── Ações ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={p.onSolve}
            disabled={!valid || p.isSolving}
            className="flex items-center gap-2 h-9 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {p.isSolving ? (
              <><Loader2 size={14} className="animate-spin" /> Resolvendo…</>
            ) : (
              <><Play size={13} fill="currentColor" /> Resolver</>
            )}
          </button>

          <button
            onClick={p.onClear}
            className="flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 text-sm transition-colors"
          >
            <RotateCcw size={13} /> Limpar
          </button>
        </div>
      </div>
    </DarkCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 2 — SIMPLEX
// ═══════════════════════════════════════════════════════════════

function SimplexTab({ results }: { results: SimplexResult }) {
  const [idx, setIdx] = useState(0);
  const iters = results.iterations ?? [];
  const colHeaders = results.colHeaders ?? [];

  const headers: string[] = ['Base', ...colHeaders, 'LD'];

  const iter = iters[idx];

  if (!iter) {
    return (
      <DarkCard className="p-12 text-center text-slate-500">
        Nenhuma iteração disponível.
      </DarkCard>
    );
  }

  const cellCls = (colIdx: number, rowIdx: number) => {
    const isPivotCol = iter.pivotCol !== undefined && colIdx - 1 === iter.pivotCol;
    const isPivotRow = iter.pivotRow !== undefined && rowIdx === iter.pivotRow;
    const isIntersect = isPivotCol && isPivotRow;
    if (isIntersect) return 'bg-blue-600/70 text-white font-extrabold';
    if (isPivotCol)  return 'bg-blue-900/40 text-blue-300';
    if (isPivotRow)  return 'bg-amber-900/30 text-amber-300';
    return '';
  };

  return (
    <div className="space-y-4">
      {/* Controles */}
      <DarkCard className="px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Iteração
          </span>
          <span className="text-lg font-extrabold text-white font-mono">
            {idx + 1} / {iters.length}
          </span>
          {iter.enteringVar && (
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded-md border border-blue-800/50">
                Entrando: <strong>{iter.enteringVar}</strong>
              </span>
              {iter.leavingVar && (
                <span className="px-2 py-1 bg-amber-900/40 text-amber-300 rounded-md border border-amber-800/40">
                  Saindo: <strong>{iter.leavingVar}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIdx(0)}
            disabled={idx === 0}
            className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 transition-colors"
            title="Reiniciar"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 text-xs font-medium transition-colors"
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <button
            onClick={() => setIdx((i) => Math.min(iters.length - 1, i + 1))}
            disabled={idx === iters.length - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs font-semibold transition-colors"
          >
            Próximo <ChevronRight size={14} />
          </button>
        </div>
      </DarkCard>

      {/* Status bar */}
      {idx === iters.length - 1 && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium
          ${results.status === 'Otimizado'
            ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400'
            : 'bg-amber-950/60 border-amber-800/50 text-amber-400'}`}>
          <CheckCircle2 size={15} />
          {results.status ?? 'Concluído'} — Z* = {fmt(results.zValue)}
        </div>
      )}

      {/* Tableau */}
      <DarkCard className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-800">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center whitespace-nowrap
                    ${i === 0 ? 'text-slate-400 bg-slate-800/60 sticky left-0' : 'text-slate-500'}
                    ${iter.pivotCol !== undefined && i - 1 === iter.pivotCol ? 'text-blue-400' : ''}
                  `}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Z row */}
            <tr className="border-b border-slate-800/60 bg-slate-800/20">
              <td className="px-4 py-3 text-center font-bold text-emerald-400 bg-slate-800/60 sticky left-0">
                Z
              </td>
              {iter.zRow.map((val: number, i: number) => (
                <td
                  key={i}
                  className={`px-4 py-3 text-center font-mono text-emerald-400 ${cellCls(i + 1, -1)}`}
                >
                  {fmt(val)}
                </td>
              ))}
            </tr>

            {/* Constraint rows */}
            {iter.rows.map((row: number[], ri: number) => (
              <tr
                key={ri}
                className={`border-b border-slate-800/40 ${ri % 2 === 0 ? '' : 'bg-slate-800/10'} hover:bg-slate-800/30 transition-colors`}
              >
                <td className="px-4 py-3 text-center font-bold text-slate-300 bg-slate-800/60 sticky left-0">
                  {iter.base?.[ri] ?? `R${ri + 1}`}
                </td>
                {row.map((val: number, ci: number) => (
                  <td
                    key={ci}
                    className={`px-4 py-3 text-center font-mono text-slate-300 ${cellCls(ci + 1, ri)}`}
                  >
                    {fmt(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </DarkCard>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-600/70 inline-block" /> Elemento pivô
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-900/40 inline-block" /> Coluna pivô
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-900/30 inline-block" /> Linha pivô (var. saindo)
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 3 — GRÁFICO (SVG)
// ═══════════════════════════════════════════════════════════════

function GraficoTab({ results, variables }: { results: SimplexResult; variables: Variable[] }) {
  const gd = results.graphData;

  if (variables.length !== 2 || !gd) {
    return (
      <DarkCard className="py-20 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-600">
          <BarChart3 size={28} />
        </div>
        <p className="text-slate-500 text-sm max-w-xs">
          O método gráfico 2D requer exatamente <strong className="text-slate-300">2 variáveis de decisão</strong>.
        </p>
      </DarkCard>
    );
  }

  const { feasibleRegion, constraints, optimalPoint, objectiveLine, integerOptimalPoint } = gd;

  // SVG dimensions
  const W = 500, H = 440;
  const PAD = { top: 20, right: 30, bottom: 50, left: 55 };
  const pw = W - PAD.left - PAD.right;
  const ph = H - PAD.top - PAD.bottom;

  const allX = [
    ...feasibleRegion.map((p) => p.x),
    ...(constraints.flatMap((c) => c.points.map((p) => p.x))),
    optimalPoint.x, 0,
  ];
  const allY = [
    ...feasibleRegion.map((p) => p.y),
    ...(constraints.flatMap((c) => c.points.map((p) => p.y))),
    optimalPoint.y, 0,
  ];
  const domX = Math.max(...allX) * 1.18 + 1;
  const domY = Math.max(...allY) * 1.18 + 1;

  const sx = (x: number) => PAD.left + (x / domX) * pw;
  const sy = (y: number) => H - PAD.bottom - (y / domY) * ph;

  const ticksX = Array.from({ length: 6 }, (_, i) => Math.round((domX / 5) * i));
  const ticksY = Array.from({ length: 6 }, (_, i) => Math.round((domY / 5) * i));

  const polyPts = feasibleRegion.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ');

  return (
    <div className="grid lg:grid-cols-[1fr_260px] gap-5">
      {/* Graph */}
      <DarkCard className="overflow-hidden p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          Gráfico da Região Viável
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 420 }}>
          {/* Grid */}
          {ticksX.map((v) => (
            <line key={`gx${v}`} x1={sx(v)} y1={PAD.top} x2={sx(v)} y2={H - PAD.bottom}
              stroke="#1e293b" strokeWidth={1} />
          ))}
          {ticksY.map((v) => (
            <line key={`gy${v}`} x1={PAD.left} y1={sy(v)} x2={W - PAD.right} y2={sy(v)}
              stroke="#1e293b" strokeWidth={1} />
          ))}

          {/* Axes */}
          <line x1={sx(0)} y1={sy(0)} x2={sx(domX)} y2={sy(0)} stroke="#475569" strokeWidth={2} />
          <line x1={sx(0)} y1={sy(domY)} x2={sx(0)} y2={sy(0)} stroke="#475569" strokeWidth={2} />

          {/* Tick labels */}
          {ticksX.slice(1).map((v) => (
            <text key={`tx${v}`} x={sx(v)} y={H - PAD.bottom + 16} textAnchor="middle"
              className="fill-slate-500" fontSize={11}>{v}</text>
          ))}
          {ticksY.slice(1).map((v) => (
            <text key={`ty${v}`} x={PAD.left - 8} y={sy(v) + 4} textAnchor="end"
              className="fill-slate-500" fontSize={11}>{v}</text>
          ))}

          {/* Axis labels */}
          <text x={sx(domX / 2)} y={H - 4} textAnchor="middle"
            className="fill-slate-400" fontSize={12} fontWeight="bold">
            {variables[0]?.name ?? 'x₁'}
          </text>
          <text x={12} y={sy(domY / 2)} textAnchor="middle"
            className="fill-slate-400" fontSize={12} fontWeight="bold"
            transform={`rotate(-90, 12, ${sy(domY / 2)})`}>
            {variables[1]?.name ?? 'x₂'}
          </text>

          {/* Feasible region */}
          {feasibleRegion.length >= 3 && (
            <polygon points={polyPts} fill="rgba(59,130,246,0.14)" stroke="rgba(59,130,246,0.45)" strokeWidth={1.5} />
          )}

          {/* Objective line at optimal */}
          {objectiveLine && objectiveLine.points.length >= 2 && (
            <line
              x1={sx(objectiveLine.points[0].x)} y1={sy(objectiveLine.points[0].y)}
              x2={sx(objectiveLine.points[objectiveLine.points.length - 1].x)}
              y2={sy(objectiveLine.points[objectiveLine.points.length - 1].y)}
              stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="6 3" opacity={0.7}
            />
          )}

          {/* Constraint lines */}
          {constraints.map((c, i) =>
            c.points.length >= 2 ? (
              <line key={i}
                x1={sx(c.points[0].x)} y1={sy(c.points[0].y)}
                x2={sx(c.points[c.points.length - 1].x)} y2={sy(c.points[c.points.length - 1].y)}
                stroke={c.color} strokeWidth={2}
              />
            ) : null
          )}

          {/* Corner points */}
          {feasibleRegion.map((p, i) => (
            <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4}
              fill="#0f172a" stroke="#94a3b8" strokeWidth={2} />
          ))}

          {/* Integer optimal point */}
          {integerOptimalPoint && (
            <circle cx={sx(integerOptimalPoint.x)} cy={sy(integerOptimalPoint.y)} r={7}
              fill="#10b981" stroke="#064e3b" strokeWidth={2} />
          )}

          {/* Optimal point */}
          <circle cx={sx(optimalPoint.x)} cy={sy(optimalPoint.y)} r={8}
            fill="#f59e0b" stroke="#78350f" strokeWidth={2} />
          <text x={sx(optimalPoint.x) + 12} y={sy(optimalPoint.y) - 8}
            className="fill-amber-300" fontSize={11} fontWeight="bold">
            ({fmt(optimalPoint.x, 2)}, {fmt(optimalPoint.y, 2)})
          </text>
        </svg>
      </DarkCard>

      {/* Info panel */}
      <div className="space-y-4">
        <DarkCard className="p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Solução Ótima
          </p>
          {results.variables.map((v) => (
            <div key={v.name} className="flex justify-between items-center">
              <span className="text-sm font-semibold text-blue-400">{v.name}</span>
              <span className="font-mono text-sm text-slate-200">{fmt(v.value ?? 0)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <span className="text-sm font-bold text-slate-400">Z*</span>
            <span className="font-mono font-bold text-emerald-400 text-base">{fmt(results.zValue)}</span>
          </div>
        </DarkCard>

        <DarkCard className="p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Restrições
          </p>
          {constraints.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <span className="text-slate-400 font-mono">{c.equation}</span>
            </div>
          ))}
        </DarkCard>

        <DarkCard className="p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Legenda</p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/40 inline-block" /> Região Viável
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Ponto Ótimo (LP)
          </div>
          {integerOptimalPoint && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> Ponto Ótimo (Inteiro)
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" /> Pontos de Canto
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-5 border-t border-dashed border-purple-400" /> F. Objetivo
          </div>
        </DarkCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 4 — DUALIDADE
// ═══════════════════════════════════════════════════════════════

function DualidadeTab({
  results,
  variables,
  problemData,
}: {
  results: SimplexResult;
  variables: Variable[];
  problemData: ProblemData;
}) {
  const isPrimalMax = problemData.type === 'MAX';
  const dualType = isPrimalMax ? 'MIN' : 'MAX';
  const dualVarNames = problemData.constraints.map((_, i) => `y${i + 1}`);

  // Dual objective: sum(b_i * y_i)
  const dualObjTerms = problemData.constraints.map((c, i) => `${c.rhs}${dualVarNames[i]}`);
  // Dual constraints: for each primal variable j
  const dualConstraints = variables.map((v, j) => {
    const terms = problemData.constraints.map(
      (c, i) => `${c.coeffs[j]}${dualVarNames[i]}`
    );
    const sign = isPrimalMax ? '≥' : '≤';
    return { terms, sign, rhs: problemData.objective[j] };
  });

  // Dual solution values = shadow prices
  const dualSolValues = results.shadowPrices ?? [];

  // Reduced costs from final Z row
  const lastIter = results.iterations?.[results.iterations.length - 1];
  const reducedCosts = variables.map((v, i) => {
    if (!lastIter) return 0;
    const inBase = lastIter.base?.includes(v.name);
    if (inBase) return 0;
    const rc = lastIter.zRow?.[i] ?? 0;
    return isPrimalMax ? rc : -rc;
  });

  return (
    <div className="space-y-5">
      {/* Primal / Dual side by side */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Primal */}
        <DarkCard className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            Problema Primal
          </p>
          <div className="font-mono text-sm space-y-2">
            <div className="text-blue-400 font-bold">
              {problemData.type} Z = {variables.map((v, i) => `${problemData.objective[i] || 0}${v.name}`).join(' + ')}
            </div>
            <div className="text-slate-500 text-xs mt-1 mb-2">Sujeito a:</div>
            {problemData.constraints.map((c, i) => (
              <div key={i} className="text-slate-300 text-xs">
                {variables.map((v, j) => `${c.coeffs[j] || 0}${v.name}`).join(' + ')}{' '}
                {c.sign === '<=' ? '≤' : c.sign === '>=' ? '≥' : '='} {c.rhs}
              </div>
            ))}
            <div className="text-slate-500 text-xs">{variables.map((v) => v.name).join(', ')} ≥ 0</div>
          </div>
        </DarkCard>

        {/* Dual */}
        <DarkCard className="p-5 border-purple-800/30">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-4">
            Problema Dual
          </p>
          <div className="font-mono text-sm space-y-2">
            <div className="text-purple-400 font-bold">
              {dualType} W = {dualObjTerms.join(' + ')}
            </div>
            <div className="text-slate-500 text-xs mt-1 mb-2">Sujeito a:</div>
            {dualConstraints.map((dc, i) => (
              <div key={i} className="text-slate-300 text-xs">
                {dc.terms.join(' + ')} {dc.sign} {dc.rhs}
              </div>
            ))}
            <div className="text-slate-500 text-xs">{dualVarNames.join(', ')} ≥ 0</div>
          </div>
        </DarkCard>
      </div>

      {/* Optimal values */}
      <DarkCard className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Soluções Ótimas</p>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-2">Primal</p>
            {results.variables.map((v) => (
              <div key={v.name} className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-blue-400 font-mono text-sm">{v.name}* =</span>
                <span className="text-slate-200 font-mono text-sm">{fmt(v.value ?? 0)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1">
              <span className="text-emerald-400 font-bold font-mono text-sm">Z* =</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">{fmt(results.zValue)}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">Dual</p>
            {dualVarNames.map((name, i) => (
              <div key={name} className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-purple-400 font-mono text-sm">{name}* =</span>
                <span className="text-slate-200 font-mono text-sm">{fmt(dualSolValues[i] ?? 0)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1">
              <span className="text-purple-400 font-bold font-mono text-sm">W* =</span>
              <span className="text-purple-400 font-bold font-mono text-sm">{fmt(results.zValue)}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-center text-slate-600 mt-3 italic">
          Teorema da Dualidade Forte: Z* = W*
        </p>
      </DarkCard>

      {/* Sensitivity */}
      <DarkCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Análise de Sensibilidade
          </p>
        </div>

        {/* Decision variables table */}
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-3">Variáveis de Decisão</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Variável', 'Valor Atual', 'Custo Reduzido', 'Status'].map((h) => (
                    <th key={h} className="pb-2 px-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.variables.map((v, i) => (
                  <tr key={v.name} className="border-b border-slate-800/50">
                    <td className="py-2.5 px-3 font-mono text-blue-400 font-semibold">{v.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-200">{fmt(v.value ?? 0)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{fmt(reducedCosts[i] ?? 0)}</td>
                    <td className="py-2.5 px-3">
                      {(v.value ?? 0) > 1e-5
                        ? <span className="text-xs font-medium text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-md">Básica</span>
                        : <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">Não-básica</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Constraints / shadow prices table */}
        <div className="px-5 pb-5">
          <p className="text-xs text-slate-500 mb-3">Restrições — Preços Sombra</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Restrição', 'Preço Sombra', 'RHS Atual', 'Interpretação'].map((h) => (
                    <th key={h} className="pb-2 px-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {problemData.constraints.map((c, i) => {
                  const sp = results.shadowPrices?.[i] ?? 0;
                  return (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td className="py-2.5 px-3 font-mono text-slate-300">R{i + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-purple-400">{fmt(sp)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{c.rhs}</td>
                      <td className="py-2.5 px-3 text-xs text-slate-500">
                        {Math.abs(sp) > 1e-5
                          ? `+1 unidade em R${i + 1} → Z ${sp > 0 ? '+' : ''}${fmt(sp)}`
                          : 'Restrição inativa (folga)'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </DarkCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 5 — SOLUÇÕES INTEIRAS
// ═══════════════════════════════════════════════════════════════

const NODE_COLORS: Record<BranchNode['status'], { bg: string; border: string; text: string; badge: string }> = {
  branched: { bg: 'bg-blue-950/70',    border: 'border-blue-800/60',   text: 'text-blue-300',   badge: 'bg-blue-900 text-blue-300' },
  integer:  { bg: 'bg-emerald-950/70', border: 'border-emerald-800/60',text: 'text-emerald-300',badge: 'bg-emerald-900 text-emerald-300' },
  infeasible:{ bg: 'bg-red-950/60',    border: 'border-red-900/50',    text: 'text-red-400',    badge: 'bg-red-900 text-red-400' },
  pruned:   { bg: 'bg-amber-950/60',   border: 'border-amber-900/50',  text: 'text-amber-400',  badge: 'bg-amber-900 text-amber-400' },
};
const STATUS_LABELS: Record<BranchNode['status'], string> = {
  branched: 'Ramificado', integer: 'Inteiro ✓', infeasible: 'Inviável ✗', pruned: 'Podado',
};

function SolucoesInteirasTab({
  results,
  variables,
  problemData,
}: {
  results: SimplexResult;
  variables: Variable[];
  problemData: ProblemData;
}) {
  const [intResult, setIntResult] = useState<{
    result: SimplexResult | null;
    nodes: BranchNode[];
  } | null>(null);
  const [running, setRunning] = useState(false);

  const runBnB = useCallback(() => {
    setRunning(true);
    try {
      const constraints: Constraint[] = problemData.constraints.map((c) => ({
        coeffs: c.coeffs.map(Number),
        sign: c.sign as ConstraintSign,
        rhs: Number(c.rhs),
      }));
      const solver = new SimplexSolver(
        problemData.type,
        variables.map((v) => v.name),
        problemData.objective.map(Number),
        constraints
      );
      const out = solver.solveIntegerWithTree();
      setIntResult(out);
    } catch (e: any) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  }, [problemData, variables]);

  return (
    <div className="space-y-5">
      {/* Original problem */}
      <DarkCard className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
          Problema Original (Relaxação LP)
        </p>
        <div className="font-mono text-xs text-slate-400 mb-3">
          {problemData.type} Z = {variables.map((v, i) => `${problemData.objective[i] || 0}${v.name}`).join(' + ')}
          &nbsp;· Sujeito a:&nbsp;
          {problemData.constraints.map((c, i) =>
            `${variables.map((v, j) => `${c.coeffs[j]}${v.name}`).join('+')} ${c.sign} ${c.rhs}`
          ).join(' ; ')}&nbsp;·&nbsp;
          {variables.map((v) => v.name).join(', ')} ≥ 0, inteiros
        </div>
        <div className="flex items-center gap-4 pt-3 border-t border-slate-800">
          {results.variables.map((v) => (
            <div key={v.name} className="text-center">
              <div className="text-xs text-slate-500">{v.name} (LP)</div>
              <div className="font-mono font-bold text-blue-400">{fmt(v.value ?? 0)}</div>
            </div>
          ))}
          <div className="text-center ml-auto">
            <div className="text-xs text-slate-500">Z* (LP)</div>
            <div className="font-mono font-bold text-blue-400">{fmt(results.zValue)}</div>
          </div>
        </div>
      </DarkCard>

      {/* Trigger button */}
      {!intResult && (
        <div className="text-center py-4">
          <button
            onClick={runBnB}
            disabled={running}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
          >
            {running
              ? <><Loader2 size={16} className="animate-spin" /> Calculando Branch & Bound…</>
              : <><GitBranch size={16} /> Calcular Solução Inteira</>
            }
          </button>
        </div>
      )}

      {/* Results */}
      {intResult && (
        <>
          {/* LP vs Integer comparison */}
          <DarkCard className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Comparativo LP Relaxada × Solução Inteira
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Tipo', 'Z', ...variables.map((v) => v.name), 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800/50">
                  <td className="px-5 py-3 text-blue-400 font-medium">LP Relaxada</td>
                  <td className="px-5 py-3 font-mono text-blue-400 font-bold">{fmt(results.zValue)}</td>
                  {results.variables.map((v) => (
                    <td key={v.name} className="px-5 py-3 font-mono text-slate-300">{fmt(v.value ?? 0)}</td>
                  ))}
                  <td className="px-5 py-3">
                    <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-md">Ótimo LP</span>
                  </td>
                </tr>
                {intResult.result ? (
                  <tr>
                    <td className="px-5 py-3 text-emerald-400 font-bold">Solução Inteira</td>
                    <td className="px-5 py-3 font-mono text-emerald-400 font-bold">{fmt(intResult.result.zValue)}</td>
                    {intResult.result.variables.map((v) => (
                      <td key={v.name} className="px-5 py-3 font-mono text-slate-200">{fmt(v.value ?? 0)}</td>
                    ))}
                    <td className="px-5 py-3">
                      <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
                        <CheckCircle2 size={11} /> Ótimo IP
                      </span>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={variables.length + 3} className="px-5 py-3 text-red-400 text-sm">
                      Nenhuma solução inteira viável encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </DarkCard>

          {/* B&B Tree */}
          <DarkCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Árvore Branch &amp; Bound ({intResult.nodes.length} nós explorados)
              </p>
              <button
                onClick={() => { setIntResult(null); }}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={11} /> Recalcular
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-5">
              {(Object.entries(STATUS_LABELS) as [BranchNode['status'], string][]).map(([st, lbl]) => (
                <span key={st} className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${NODE_COLORS[st].badge}`}>
                  {lbl}
                </span>
              ))}
            </div>

            {/* Tree nodes (indented list) */}
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-2">
              {intResult.nodes.map((node) => {
                const c = NODE_COLORS[node.status];
                return (
                  <div
                    key={node.id}
                    className={`flex items-start gap-3 px-3 py-2 rounded-lg border ${c.bg} ${c.border} transition-all`}
                    style={{ marginLeft: `${node.depth * 20}px` }}
                  >
                    {/* Connector line indicator */}
                    {node.depth > 0 && (
                      <span className="text-slate-700 font-bold text-base leading-tight select-none shrink-0">└</span>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {node.depth === 0 ? (
                          <span className={`text-xs font-bold ${c.text}`}>Nó 0 — Raiz (LP Relaxada)</span>
                        ) : (
                          <span className={`text-xs font-bold ${c.text}`}>
                            Nó {node.id} — {node.branchVar} {node.branchDir} {node.branchVal}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.badge}`}>
                          {STATUS_LABELS[node.status]}
                        </span>
                      </div>
                      {node.zValue !== undefined && (
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-[11px] font-mono text-slate-500">
                            Z = {fmt(node.zValue)}
                          </span>
                          {node.varValues?.map((vv) => (
                            <span key={vv.name} className="text-[11px] font-mono text-slate-600">
                              {vv.name}={fmt(vv.value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </DarkCard>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function EuGenioSolver() {
  const {
    variables, setVariables,
    problemData, setProblemData, updateProblemData,
    results, setResults,
    resetProject,
  } = useProject();

  const [activeTab, setActiveTab] = useState<TabId>('entrada');
  const [isSolving, setIsSolving]  = useState(false);
  const [error, setError]          = useState<string | null>(null);

  const solved = results !== null;

  // ── Variable handlers ──────────────────────────────────────

  const handleVariableAdd = () => {
    const id = variables.length + 1;
    setVariables([...variables, { id, name: `x${id}`, description: '' }]);
    updateProblemData((p) => ({
      ...p,
      objective: [...p.objective, ''],
      constraints: p.constraints.map((c) => ({ ...c, coeffs: [...c.coeffs, ''] })),
    }));
  };

  const handleVariableRemove = (idx: number) => {
    if (variables.length <= 1) return;
    setVariables(variables.filter((_, i) => i !== idx).map((v, i) => ({ ...v, id: i + 1 })));
    updateProblemData((p) => ({
      ...p,
      objective: p.objective.filter((_, i) => i !== idx),
      constraints: p.constraints.map((c) => ({
        ...c,
        coeffs: c.coeffs.filter((_, i) => i !== idx),
      })),
    }));
  };

  const handleVariableRename = (idx: number, name: string) => {
    const updated = [...variables];
    updated[idx] = { ...updated[idx], name };
    setVariables(updated);
  };

  // ── Objective / constraint handlers ────────────────────────

  const handleObjChange = (idx: number, val: string) => {
    const obj = [...problemData.objective];
    obj[idx] = val;
    setProblemData({ ...problemData, objective: obj });
  };

  const handleConstraintAdd = () =>
    updateProblemData((p) => ({
      ...p,
      constraints: [...p.constraints, { coeffs: Array(variables.length).fill(''), sign: '<=', rhs: '' }],
    }));

  const handleConstraintRemove = (idx: number) => {
    if (problemData.constraints.length <= 1) return;
    updateProblemData((p) => ({ ...p, constraints: p.constraints.filter((_, i) => i !== idx) }));
  };

  const handleCoeffChange = (ci: number, vi: number, val: string) =>
    updateProblemData((p) => ({
      ...p,
      constraints: p.constraints.map((c, i) =>
        i === ci ? { ...c, coeffs: c.coeffs.map((x, j) => (j === vi ? val : x)) } : c
      ),
    }));

  const handleSignChange = (ci: number, val: string) =>
    updateProblemData((p) => ({
      ...p,
      constraints: p.constraints.map((c, i) => (i === ci ? { ...c, sign: val } : c)),
    }));

  const handleRhsChange = (ci: number, val: string) =>
    updateProblemData((p) => ({
      ...p,
      constraints: p.constraints.map((c, i) => (i === ci ? { ...c, rhs: val } : c)),
    }));

  // ── Solve ──────────────────────────────────────────────────

  const handleSolve = () => {
    setError(null);
    setIsSolving(true);
    try {
      const constraints: Constraint[] = problemData.constraints.map((c) => ({
        coeffs: c.coeffs.map(Number),
        sign: c.sign as ConstraintSign,
        rhs: Number(c.rhs),
      }));
      const solver = new SimplexSolver(
        problemData.type,
        variables.map((v: Variable) => v.name),
        problemData.objective.map(Number),
        constraints
      );
      const result = solver.solve();
      setResults({ ...result, problemData } as any);
      setActiveTab('simplex');
    } catch (e: any) {
      setError(e.message || 'Erro ao resolver o problema.');
    } finally {
      setIsSolving(false);
    }
  };

  const handleClear = () => {
    resetProject();
    setError(null);
    setActiveTab('entrada');
  };

  const handleTabClick = (id: TabId) => {
    if (id === 'entrada' || solved) setActiveTab(id);
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-5">

          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src="/logo-eu-genio.png"
              alt="Eu Gênio"
              className="h-9 w-9 rounded-lg object-cover"
            />
            <span className="text-base font-extrabold tracking-tight text-white">
              Eu <span className="text-blue-400">Gênio</span>
            </span>
          </div>

          <div className="w-px h-5 bg-slate-700 shrink-0" />

          {/* Tabs */}
          <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => {
              const isActive     = activeTab === tab.id;
              const accessible   = tab.id === 'entrada' || solved;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  disabled={!accessible}
                  className={[
                    'whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-all',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                      : accessible
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        : 'text-slate-700 cursor-not-allowed',
                  ].join(' ')}
                >
                  {tab.num}. {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Solution badge */}
          {solved && results && (
            <div className="ml-auto shrink-0 hidden sm:flex items-center gap-2 text-xs font-semibold">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border
                ${results.status === 'Otimizado'
                  ? 'bg-emerald-950/80 border-emerald-800/50 text-emerald-400'
                  : 'bg-amber-950/80 border-amber-800/50 text-amber-400'}`}>
                <CheckCircle2 size={11} />
                {results.status ?? 'Resolvido'} — Z = {fmt(results.zValue)}
              </span>
              {results.multipleSolutions && (
                <span className="px-2 py-1 rounded-full bg-purple-950/70 border border-purple-800/50 text-purple-400">
                  Soluções múltiplas
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-5 py-8">
        {activeTab === 'entrada' && (
          <EntradaTab
            variables={variables}
            problemData={problemData}
            onVariableAdd={handleVariableAdd}
            onVariableRemove={handleVariableRemove}
            onVariableRename={handleVariableRename}
            onTypeChange={(t) => setProblemData({ ...problemData, type: t })}
            onObjChange={handleObjChange}
            onConstraintAdd={handleConstraintAdd}
            onConstraintRemove={handleConstraintRemove}
            onCoeffChange={handleCoeffChange}
            onSignChange={handleSignChange}
            onRhsChange={handleRhsChange}
            onSolve={handleSolve}
            onClear={handleClear}
            isSolving={isSolving}
            error={error}
          />
        )}

        {activeTab === 'simplex' && solved && results && (
          <SimplexTab results={results} />
        )}

        {activeTab === 'grafico' && solved && results && (
          <GraficoTab results={results} variables={variables} />
        )}

        {activeTab === 'dualidade' && solved && results && (
          <DualidadeTab
            results={results}
            variables={variables}
            problemData={(results as any).problemData ?? problemData}
          />
        )}

        {activeTab === 'inteiras' && solved && results && (
          <SolucoesInteirasTab
            results={results}
            variables={variables}
            problemData={(results as any).problemData ?? problemData}
          />
        )}
      </main>
    </div>
  );
}
