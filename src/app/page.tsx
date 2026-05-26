"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Play, RotateCcw, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, RefreshCw,
  CheckCircle2, GitBranch, BarChart3,
  Share2, Printer, BookOpen, ChevronDown, Info,
  FlaskConical,
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

const EXAMPLES = [
  {
    label: 'Produção Clássica (MAX, 2 var.)',
    type: 'MAX' as const,
    varNames: ['x1', 'x2'],
    objective: ['5', '4'],
    constraints: [
      { coeffs: ['6', '4'], sign: '<=', rhs: '24' },
      { coeffs: ['1', '2'], sign: '<=', rhs: '6' },
    ],
  },
  {
    label: 'Hillier & Lieberman (MAX, 2 var.)',
    type: 'MAX' as const,
    varNames: ['x1', 'x2'],
    objective: ['3', '5'],
    constraints: [
      { coeffs: ['1', '0'], sign: '<=', rhs: '4' },
      { coeffs: ['0', '2'], sign: '<=', rhs: '12' },
      { coeffs: ['3', '2'], sign: '<=', rhs: '18' },
    ],
  },
  {
    label: 'Minimização de Custos (MIN, 2 var.)',
    type: 'MIN' as const,
    varNames: ['x1', 'x2'],
    objective: ['2', '3'],
    constraints: [
      { coeffs: ['1', '1'], sign: '>=', rhs: '4' },
      { coeffs: ['2', '1'], sign: '>=', rhs: '6' },
    ],
  },
  {
    label: 'Mix de Produção (MAX, 3 var.)',
    type: 'MAX' as const,
    varNames: ['x1', 'x2', 'x3'],
    objective: ['3', '5', '4'],
    constraints: [
      { coeffs: ['2', '3', '1'], sign: '<=', rhs: '14' },
      { coeffs: ['4', '1', '2'], sign: '<=', rhs: '14' },
      { coeffs: ['3', '4', '2'], sign: '<=', rhs: '14' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// TOAST SYSTEM
// ═══════════════════════════════════════════════════════════════

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            'flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium shadow-2xl',
            'animate-in slide-in-from-bottom-4 fade-in duration-300',
            t.type === 'success'
              ? 'bg-emerald-900/95 border border-emerald-700/60 text-emerald-200'
              : t.type === 'error'
                ? 'bg-red-900/95 border border-red-700/60 text-red-200'
                : 'bg-slate-800/95 border border-slate-600/60 text-slate-200',
          ].join(' ')}
          style={{ backdropFilter: 'blur(12px)' }}
        >
          {t.type === 'success' && <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />}
          {t.type === 'error'   && <AlertCircle  size={14} className="shrink-0 text-red-400" />}
          {t.type === 'info'    && <Info          size={14} className="shrink-0 text-blue-400" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════

function toFraction(x: number): string {
  if (Math.abs(x) < 1e-8) return '0';
  const sign = x < 0 ? '-' : '';
  const abs = Math.abs(x);
  if (Math.abs(abs - Math.round(abs)) < 1e-8) return sign + Math.round(abs).toString();
  let bestN = 1, bestD = 1, bestErr = Infinity;
  for (let d = 1; d <= 128; d++) {
    const n = Math.round(abs * d);
    const err = Math.abs(abs - n / d);
    if (err < bestErr) { bestErr = err; bestN = n; bestD = d; }
    if (err < 1e-9) break;
  }
  if (bestErr > 0.0005) return sign + abs.toFixed(4);
  if (bestD === 1) return sign + bestN.toString();
  return `${sign}${bestN}/${bestD}`;
}

const fmt = (n: number, d = 4, fractions = false): string => {
  if (fractions) return toFraction(n);
  return Number.isInteger(n) ? String(n) : parseFloat(n.toFixed(d)).toString();
};

function getIterExplanation(iter: any, isLast: boolean, status: string): string {
  if (!iter.enteringVar && !iter.leavingVar) {
    return 'Tableau inicial na forma canônica. Variáveis básicas são as de folga; variáveis de decisão fora da base com custo reduzido igual ao coeficiente da função objetivo.';
  }
  if (isLast && status === 'Otimizado') {
    return 'Todos os custos reduzidos são não-negativos (MAX) — solução ótima encontrada. Nenhuma variável pode melhorar Z sem piorar outra.';
  }
  if (isLast) {
    return `Processo concluído com status "${status}".`;
  }
  const parts: string[] = [];
  if (iter.enteringVar) parts.push(`${iter.enteringVar} entra na base (coeficiente mais negativo na linha Z)`);
  if (iter.leavingVar)  parts.push(`${iter.leavingVar} sai pela razão mínima — teste da razão de Bland`);
  return parts.join(' · ') + '.';
}

function printReport(variables: Variable[], problemData: ProblemData, results: SimplexResult) {
  const obj = variables.map((v, i) => `${problemData.objective[i] || 0}${v.name}`).join(' + ');
  const constRows = problemData.constraints.map((c, i) => {
    const lhs = variables.map((v, j) => `${c.coeffs[j] || 0}${v.name}`).join(' + ');
    const sp = results.shadowPrices?.[i] ?? 0;
    return `<tr>
      <td>R${i + 1}</td>
      <td>${lhs} ${c.sign === '<=' ? '≤' : c.sign === '>=' ? '≥' : '='} ${c.rhs}</td>
      <td style="color:#6d28d9;font-weight:bold">${fmt(sp)}</td>
    </tr>`;
  }).join('');
  const varRows = results.variables.map(v =>
    `<tr><td style="font-weight:bold">${v.name}</td><td>${fmt(v.value ?? 0)}</td></tr>`
  ).join('');
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
  <title>Eu Gênio — Relatório</title>
  <style>
    body { font-family: 'Courier New', monospace; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 22px; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 4px; }
    .sub { font-size: 12px; color: #64748b; margin-bottom: 28px; }
    h2 { font-size: 14px; color: #1e40af; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: .08em; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
    th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 7px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
    td { border: 1px solid #e2e8f0; padding: 7px 12px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; background: #dcfce7; color: #166534; font-weight: bold; font-size: 12px; border: 1px solid #bbf7d0; }
    .zval { font-size: 28px; font-weight: 900; color: #1e40af; margin: 8px 0; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print { button { display: none; } }
  </style>
</head><body>
  <h1>Eu Gênio — Relatório de Otimização</h1>
  <div class="sub">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
  <h2>Problema</h2>
  <table><thead><tr><th>Tipo</th><th>Função Objetivo</th></tr></thead>
    <tbody><tr><td>${problemData.type}</td><td>Z = ${obj}</td></tr></tbody></table>
  <h2>Status &amp; Resultado</h2>
  <div><span class="badge">${results.status ?? 'Otimizado'}</span></div>
  <div class="zval">Z* = ${fmt(results.zValue)}</div>
  <h2>Solução das Variáveis</h2>
  <table><thead><tr><th>Variável</th><th>Valor Ótimo</th></tr></thead>
    <tbody>${varRows}</tbody></table>
  <h2>Restrições &amp; Preços Sombra</h2>
  <table><thead><tr><th>Restrição</th><th>Expressão</th><th>Preço Sombra</th></tr></thead>
    <tbody>${constRows}</tbody></table>
  <div class="footer">
    <span>Eu Gênio — Solucionador Simplex</span>
    <span>linkedin.com/in/higuzx</span>
  </div>
  <script>window.onload = () => { setTimeout(() => window.print(), 300); }</script>
</body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="w-1 h-3.5 rounded-full bg-blue-500/70 shrink-0" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {children}
      </p>
    </div>
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
    <div
      data-printcard
      className={`relative bg-slate-900/80 border border-slate-800/70 rounded-2xl overflow-hidden ${className}`}
      style={{ boxShadow: '0 1px 0 0 rgba(148,163,184,0.04) inset, 0 4px 24px rgba(0,0,0,0.3)' }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent pointer-events-none" />
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
  onLoadExample: (ex: typeof EXAMPLES[0]) => void;
  isSolving: boolean;
  error: string | null;
}

function EntradaTab(p: EntradaProps) {
  const [exOpen, setExOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setExOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const valid =
    p.problemData.objective.length > 0 &&
    p.problemData.objective.every((v) => v.trim() !== '') &&
    p.problemData.constraints.length > 0 &&
    p.problemData.constraints.every(
      (c) => c.coeffs.every((x) => x.trim() !== '') && c.rhs.trim() !== ''
    );

  const inputCls =
    'bg-slate-800/80 border border-slate-700/80 text-slate-100 placeholder:text-slate-600 ' +
    'focus:outline-none focus:ring-1 focus:ring-blue-500/70 focus:border-blue-500/50 ' +
    'h-9 text-sm text-center font-mono rounded-xl transition-colors';

  return (
    <DarkCard>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800/70 bg-slate-800/20 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide">Entrada de Programação Linear</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Defina a função objetivo, variáveis e restrições</p>
        </div>

        {/* Examples dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setExOpen(!exOpen)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-700/70 text-slate-400 hover:text-slate-200 hover:border-slate-600 text-xs font-medium transition-all"
          >
            <BookOpen size={13} /> Exemplos <ChevronDown size={12} className={`transition-transform ${exOpen ? 'rotate-180' : ''}`} />
          </button>
          {exOpen && (
            <div
              className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-slate-700/70 bg-slate-900 shadow-2xl overflow-hidden"
              style={{ backdropFilter: 'blur(16px)' }}
            >
              <div className="px-4 py-2.5 border-b border-slate-800/70">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Carregar Problema</p>
              </div>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { p.onLoadExample(ex); setExOpen(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors flex items-center gap-3 group"
                >
                  <FlaskConical size={13} className="text-blue-500/60 group-hover:text-blue-400 shrink-0" />
                  {ex.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-7 space-y-8">

        {/* Função Objetivo */}
        <section>
          <SectionLabel>Função Objetivo</SectionLabel>
          <div
            className="flex flex-wrap items-center gap-2.5 p-4 rounded-2xl border border-slate-700/50 bg-slate-800/30"
            style={{ boxShadow: '0 0 0 1px rgba(59,130,246,0.06) inset' }}
          >
            <select
              value={p.problemData.type}
              onChange={(e) => p.onTypeChange(e.target.value as 'MAX' | 'MIN')}
              className="h-9 px-3 rounded-xl border border-slate-700/80 bg-slate-800 text-slate-200 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/70 cursor-pointer transition-colors"
            >
              <option value="MAX">Maximizar</option>
              <option value="MIN">Minimizar</option>
            </select>
            <span className="text-slate-500 font-mono font-bold text-sm px-1 select-none">Z =</span>
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
                  <span className="text-sm font-bold text-blue-400 min-w-[28px]">{v.name}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Variáveis */}
        <section>
          <SectionLabel>Variáveis de Decisão</SectionLabel>
          <div className="flex flex-wrap items-center gap-2">
            {p.variables.map((v, i) => (
              <div
                key={v.id}
                className="flex items-center gap-1.5 bg-blue-950/40 border border-blue-700/30 rounded-xl px-3 py-1.5 group hover:border-blue-600/50 hover:bg-blue-950/60 transition-all"
              >
                <input
                  value={v.name}
                  onChange={(e) => p.onVariableRename(i, e.target.value)}
                  className="w-14 text-xs font-bold text-blue-300 bg-transparent border-0 outline-none p-0"
                />
                {p.variables.length > 1 && (
                  <button
                    onClick={() => p.onVariableRemove(i)}
                    className="text-blue-700/60 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-0.5"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={p.onVariableAdd}
              className="flex items-center gap-1 h-8 px-3 rounded-xl border border-dashed border-slate-700/70 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-xs font-medium transition-all"
            >
              <Plus size={12} /> Variável
            </button>
          </div>
        </section>

        {/* Restrições */}
        <section>
          <SectionLabel>Restrições</SectionLabel>
          <div className="space-y-2">
            {p.problemData.constraints.map((c, ci) => (
              <div
                key={ci}
                className="flex flex-wrap items-center gap-2 p-3 bg-slate-800/25 rounded-2xl border border-slate-700/40 hover:border-slate-600/60 group transition-all"
              >
                <span className="text-[10px] font-bold text-slate-600 w-7 shrink-0 font-mono">R{ci + 1}</span>
                {p.variables.map((v, vi) => (
                  <React.Fragment key={v.id}>
                    {vi > 0 && <span className="text-slate-600 font-bold select-none">+</span>}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        className={`w-20 ${inputCls}`}
                        placeholder="0"
                        value={c.coeffs[vi] ?? ''}
                        onChange={(e) => p.onCoeffChange(ci, vi, e.target.value)}
                      />
                      <span className="text-xs font-bold text-slate-400 min-w-[28px]">{v.name}</span>
                    </div>
                  </React.Fragment>
                ))}
                <select
                  value={c.sign}
                  onChange={(e) => p.onSignChange(ci, e.target.value)}
                  className="h-9 px-2 rounded-xl border border-slate-700/80 bg-slate-800 text-slate-200 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/70 cursor-pointer"
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
            className="mt-2.5 flex items-center gap-1.5 h-8 px-3 rounded-xl border border-dashed border-slate-700/70 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-xs font-medium transition-all"
          >
            <Plus size={12} /> Adicionar Restrição
          </button>
        </section>

        {/* Erro */}
        {p.error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-950/50 border border-red-800/40 rounded-2xl text-red-400 text-sm">
            <AlertCircle size={14} className="shrink-0 text-red-500" />
            {p.error}
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-800/60">
          <button
            onClick={p.onSolve}
            disabled={!valid || p.isSolving}
            className="flex items-center gap-2 h-10 px-7 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: valid && !p.isSolving ? '0 0 20px rgba(37,99,235,0.35), 0 4px 12px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {p.isSolving
              ? <><Loader2 size={14} className="animate-spin" /> Resolvendo…</>
              : <><Play size={13} fill="currentColor" /> Resolver</>
            }
          </button>
          <button
            onClick={p.onClear}
            className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-700/70 text-slate-400 hover:text-slate-200 hover:border-slate-600 text-sm transition-all"
          >
            <RotateCcw size={13} /> Limpar
          </button>
          <p className="ml-auto text-[11px] text-slate-600 hidden sm:block">
            Problema salvo automaticamente
          </p>
        </div>
      </div>
    </DarkCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 2 — SIMPLEX
// ═══════════════════════════════════════════════════════════════

function SimplexTab({ results, showFractions }: { results: SimplexResult; showFractions: boolean }) {
  const [idx, setIdx] = useState(0);
  const iters = results.iterations ?? [];
  const colHeaders = results.colHeaders ?? [];
  const headers: string[] = ['Base', ...colHeaders, 'LD'];
  const iter = iters[idx];
  const isLast = idx === iters.length - 1;

  const f = (n: number) => fmt(n, 4, showFractions);

  if (!iter) {
    return <DarkCard className="p-12 text-center text-slate-500">Nenhuma iteração disponível.</DarkCard>;
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
      <DarkCard className="px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Iteração</span>
          <span className="text-lg font-extrabold text-white font-mono">
            {idx + 1}<span className="text-slate-600 text-sm font-normal"> / {iters.length}</span>
          </span>
          {iter.enteringVar && (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="px-2.5 py-1 bg-blue-950/60 text-blue-300 rounded-lg border border-blue-800/40">
                Entrando: <strong>{iter.enteringVar}</strong>
              </span>
              {iter.leavingVar && (
                <span className="px-2.5 py-1 bg-amber-950/50 text-amber-300 rounded-lg border border-amber-800/30">
                  Saindo: <strong>{iter.leavingVar}</strong>
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIdx(0)} disabled={idx === 0}
            className="p-2 rounded-xl border border-slate-700/70 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 transition-all">
            <RefreshCw size={13} />
          </button>
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-700/70 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 text-xs font-medium transition-all">
            <ChevronLeft size={14} /> Anterior
          </button>
          <button onClick={() => setIdx((i) => Math.min(iters.length - 1, i + 1))} disabled={isLast}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs font-semibold transition-all">
            Próximo <ChevronRight size={14} />
          </button>
        </div>
      </DarkCard>

      {/* Explanation */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400">
        <Info size={13} className="text-blue-500/70 shrink-0 mt-0.5" />
        <span>{getIterExplanation(iter, isLast, results.status ?? '')}</span>
      </div>

      {/* Status */}
      {isLast && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-medium
          ${results.status === 'Otimizado'
            ? 'bg-emerald-950/50 border-emerald-800/40 text-emerald-400'
            : 'bg-amber-950/50 border-amber-800/40 text-amber-400'}`}>
          <CheckCircle2 size={15} />
          {results.status ?? 'Concluído'} — Z* = {f(results.zValue)}
          {results.multipleSolutions && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-lg bg-purple-950/60 border border-purple-700/40 text-purple-400 font-semibold">
              Múltiplas soluções ótimas
            </span>
          )}
        </div>
      )}

      {/* Tableau */}
      <DarkCard className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-800/70">
              {headers.map((h, i) => (
                <th key={i}
                  className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center whitespace-nowrap
                    ${i === 0 ? 'text-slate-400 bg-slate-800/50 sticky left-0' : 'text-slate-500'}
                    ${iter.pivotCol !== undefined && i - 1 === iter.pivotCol ? 'text-blue-400' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-800/50 bg-slate-800/20">
              <td className="px-4 py-3 text-center font-bold text-emerald-400 bg-slate-800/50 sticky left-0">Z</td>
              {iter.zRow.map((val: number, i: number) => (
                <td key={i} className={`px-4 py-3 text-center font-mono text-emerald-400 ${cellCls(i + 1, -1)}`}>
                  {f(val)}
                </td>
              ))}
            </tr>
            {iter.rows.map((row: number[], ri: number) => (
              <tr key={ri}
                className={`border-b border-slate-800/30 ${ri % 2 === 0 ? '' : 'bg-slate-800/10'} hover:bg-slate-800/25 transition-colors`}>
                <td className="px-4 py-3 text-center font-bold text-slate-300 bg-slate-800/50 sticky left-0">
                  {iter.base?.[ri] ?? `R${ri + 1}`}
                </td>
                {row.map((val: number, ci: number) => (
                  <td key={ci} className={`px-4 py-3 text-center font-mono text-slate-300 ${cellCls(ci + 1, ri)}`}>
                    {f(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </DarkCard>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 px-1">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600/70 inline-block" /> Elemento pivô</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-900/40 inline-block" /> Coluna pivô</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-900/30 inline-block" /> Linha pivô (var. saindo)</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 3 — GRÁFICO (SVG)
// ═══════════════════════════════════════════════════════════════

function GraficoTab({ results, variables }: { results: SimplexResult; variables: Variable[] }) {
  const gd = results.graphData;
  const [hovering, setHovering] = useState(false);

  if (variables.length !== 2 || !gd) {
    return (
      <DarkCard className="py-24 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-600">
          <BarChart3 size={28} />
        </div>
        <div>
          <p className="text-slate-300 font-semibold text-sm">Método Gráfico Indisponível</p>
          <p className="text-slate-500 text-xs mt-1 max-w-xs">
            Requer exatamente <strong className="text-slate-300">2 variáveis de decisão</strong>.
          </p>
        </div>
      </DarkCard>
    );
  }

  const { feasibleRegion, constraints, optimalPoint, objectiveLine, integerOptimalPoint } = gd;

  const W = 500, H = 440;
  const PAD = { top: 20, right: 30, bottom: 50, left: 55 };
  const pw = W - PAD.left - PAD.right;
  const ph = H - PAD.top - PAD.bottom;

  const allX = [...feasibleRegion.map((p) => p.x), ...(constraints.flatMap((c) => c.points.map((p) => p.x))), optimalPoint.x, 0];
  const allY = [...feasibleRegion.map((p) => p.y), ...(constraints.flatMap((c) => c.points.map((p) => p.y))), optimalPoint.y, 0];
  const domX = Math.max(...allX) * 1.18 + 1;
  const domY = Math.max(...allY) * 1.18 + 1;

  const sx = (x: number) => PAD.left + (x / domX) * pw;
  const sy = (y: number) => H - PAD.bottom - (y / domY) * ph;
  const ticksX = Array.from({ length: 6 }, (_, i) => Math.round((domX / 5) * i));
  const ticksY = Array.from({ length: 6 }, (_, i) => Math.round((domY / 5) * i));
  const polyPts = feasibleRegion.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ');

  return (
    <div className="grid lg:grid-cols-[1fr_260px] gap-5">
      <DarkCard className="p-4">
        <SectionLabel>Gráfico da Região Viável</SectionLabel>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 420 }}>
          {ticksX.map((v) => (
            <line key={`gx${v}`} x1={sx(v)} y1={PAD.top} x2={sx(v)} y2={H - PAD.bottom} stroke="#1e293b" strokeWidth={1} />
          ))}
          {ticksY.map((v) => (
            <line key={`gy${v}`} x1={PAD.left} y1={sy(v)} x2={W - PAD.right} y2={sy(v)} stroke="#1e293b" strokeWidth={1} />
          ))}
          <line x1={sx(0)} y1={sy(0)} x2={sx(domX)} y2={sy(0)} stroke="#475569" strokeWidth={2} />
          <line x1={sx(0)} y1={sy(domY)} x2={sx(0)} y2={sy(0)} stroke="#475569" strokeWidth={2} />
          {ticksX.slice(1).map((v) => (
            <text key={`tx${v}`} x={sx(v)} y={H - PAD.bottom + 16} textAnchor="middle" className="fill-slate-500" fontSize={11}>{v}</text>
          ))}
          {ticksY.slice(1).map((v) => (
            <text key={`ty${v}`} x={PAD.left - 8} y={sy(v) + 4} textAnchor="end" className="fill-slate-500" fontSize={11}>{v}</text>
          ))}
          <text x={sx(domX / 2)} y={H - 4} textAnchor="middle" className="fill-slate-400" fontSize={12} fontWeight="bold">
            {variables[0]?.name ?? 'x₁'}
          </text>
          <text x={12} y={sy(domY / 2)} textAnchor="middle" className="fill-slate-400" fontSize={12} fontWeight="bold" transform={`rotate(-90, 12, ${sy(domY / 2)})`}>
            {variables[1]?.name ?? 'x₂'}
          </text>
          {feasibleRegion.length >= 3 && (
            <polygon points={polyPts} fill="rgba(59,130,246,0.14)" stroke="rgba(59,130,246,0.45)" strokeWidth={1.5} />
          )}
          {objectiveLine && objectiveLine.points.length >= 2 && (
            <line
              x1={sx(objectiveLine.points[0].x)} y1={sy(objectiveLine.points[0].y)}
              x2={sx(objectiveLine.points[objectiveLine.points.length - 1].x)}
              y2={sy(objectiveLine.points[objectiveLine.points.length - 1].y)}
              stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="6 3" opacity={0.7}
            />
          )}
          {constraints.map((c, i) =>
            c.points.length >= 2 ? (
              <line key={i}
                x1={sx(c.points[0].x)} y1={sy(c.points[0].y)}
                x2={sx(c.points[c.points.length - 1].x)} y2={sy(c.points[c.points.length - 1].y)}
                stroke={c.color} strokeWidth={2} />
            ) : null
          )}
          {feasibleRegion.map((p, i) => (
            <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4} fill="#0f172a" stroke="#94a3b8" strokeWidth={2} />
          ))}
          {integerOptimalPoint && (
            <circle cx={sx(integerOptimalPoint.x)} cy={sy(integerOptimalPoint.y)} r={7} fill="#10b981" stroke="#064e3b" strokeWidth={2} />
          )}
          {/* Optimal point with hover tooltip */}
          <circle
            cx={sx(optimalPoint.x)} cy={sy(optimalPoint.y)} r={hovering ? 11 : 8}
            fill="#f59e0b" stroke="#78350f" strokeWidth={2}
            style={{ cursor: 'pointer', transition: 'r 0.15s' }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          />
          {hovering && (
            <g>
              <rect x={sx(optimalPoint.x) + 14} y={sy(optimalPoint.y) - 36} width={140} height={40} rx={6} fill="#0f172a" stroke="#475569" strokeWidth={1} />
              <text x={sx(optimalPoint.x) + 22} y={sy(optimalPoint.y) - 18} className="fill-amber-300" fontSize={11} fontWeight="bold">
                Ótimo: ({fmt(optimalPoint.x, 3)}, {fmt(optimalPoint.y, 3)})
              </text>
              <text x={sx(optimalPoint.x) + 22} y={sy(optimalPoint.y) - 5} className="fill-emerald-400" fontSize={11} fontWeight="bold">
                Z* = {fmt(results.zValue)}
              </text>
            </g>
          )}
          {!hovering && (
            <text x={sx(optimalPoint.x) + 12} y={sy(optimalPoint.y) - 8} className="fill-amber-300" fontSize={11} fontWeight="bold">
              ({fmt(optimalPoint.x, 2)}, {fmt(optimalPoint.y, 2)})
            </text>
          )}
        </svg>
      </DarkCard>

      <div className="space-y-4">
        <DarkCard className="p-4 space-y-3">
          <SectionLabel>Solução Ótima</SectionLabel>
          {results.variables.map((v) => (
            <div key={v.name} className="flex justify-between items-center py-0.5">
              <span className="text-sm font-semibold text-blue-400">{v.name}</span>
              <span className="font-mono text-sm text-slate-200">{fmt(v.value ?? 0)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 border-t border-slate-800/60 mt-1">
            <span className="text-sm font-bold text-slate-400">Z*</span>
            <span className="font-mono font-bold text-emerald-400 text-base">{fmt(results.zValue)}</span>
          </div>
        </DarkCard>
        <DarkCard className="p-4 space-y-2">
          <SectionLabel>Restrições</SectionLabel>
          {constraints.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <span className="text-slate-400 font-mono">{c.equation}</span>
            </div>
          ))}
        </DarkCard>
        <DarkCard className="p-4 space-y-2.5">
          <SectionLabel>Legenda</SectionLabel>
          {[
            { color: 'bg-blue-500/20 border border-blue-500/40', label: 'Região Viável' },
            { color: 'bg-amber-400', label: 'Ponto Ótimo (LP) — hover' },
            ...(integerOptimalPoint ? [{ color: 'bg-emerald-400', label: 'Ponto Ótimo (Inteiro)' }] : []),
            { color: 'bg-slate-400', label: 'Pontos de Canto' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-slate-400">
              <span className={`w-3 h-3 rounded-full ${color} inline-block shrink-0`} />
              {label}
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-5 border-t border-dashed border-purple-400 shrink-0" /> F. Objetivo
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
  results, variables, problemData, showFractions,
}: {
  results: SimplexResult; variables: Variable[]; problemData: ProblemData; showFractions: boolean;
}) {
  const f = (n: number) => fmt(n, 4, showFractions);
  const isPrimalMax = problemData.type === 'MAX';
  const dualType = isPrimalMax ? 'MIN' : 'MAX';
  const dualVarNames = problemData.constraints.map((_, i) => `y${i + 1}`);
  const dualObjTerms = problemData.constraints.map((c, i) => `${c.rhs}${dualVarNames[i]}`);
  const dualConstraints = variables.map((v, j) => ({
    terms: problemData.constraints.map((c, i) => `${c.coeffs[j]}${dualVarNames[i]}`),
    sign: isPrimalMax ? '≥' : '≤',
    rhs: problemData.objective[j],
  }));
  const dualSolValues = results.shadowPrices ?? [];
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
      <div className="grid md:grid-cols-2 gap-5">
        <DarkCard className="p-5">
          <SectionLabel>Problema Primal</SectionLabel>
          <div className="font-mono text-sm space-y-2 mt-1">
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
        <DarkCard className="p-5" style={{ borderColor: 'rgba(147,51,234,0.25)' }}>
          <SectionLabel>Problema Dual</SectionLabel>
          <div className="font-mono text-sm space-y-2 mt-1">
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

      <DarkCard className="p-5">
        <SectionLabel>Soluções Ótimas</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-6 mt-2">
          <div>
            <p className="text-xs text-slate-500 mb-2">Primal</p>
            {results.variables.map((v) => (
              <div key={v.name} className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-blue-400 font-mono text-sm">{v.name}* =</span>
                <span className="text-slate-200 font-mono text-sm">{f(v.value ?? 0)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5">
              <span className="text-emerald-400 font-bold font-mono text-sm">Z* =</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">{f(results.zValue)}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">Dual</p>
            {dualVarNames.map((name, i) => (
              <div key={name} className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-purple-400 font-mono text-sm">{name}* =</span>
                <span className="text-slate-200 font-mono text-sm">{f(dualSolValues[i] ?? 0)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5">
              <span className="text-purple-400 font-bold font-mono text-sm">W* =</span>
              <span className="text-purple-400 font-bold font-mono text-sm">{f(results.zValue)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <p className="text-xs text-slate-500 italic">Teorema da Dualidade Forte verificado: Z* = W* = {f(results.zValue)}</p>
        </div>
      </DarkCard>

      <DarkCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/70 bg-slate-800/20">
          <SectionLabel>Análise de Sensibilidade</SectionLabel>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-3">Variáveis de Decisão</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  {['Variável', 'Valor Atual', 'Custo Reduzido', 'Status'].map((h) => (
                    <th key={h} className="pb-2 px-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.variables.map((v, i) => (
                  <tr key={v.name} className="border-b border-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-blue-400 font-semibold">{v.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-200">{f(v.value ?? 0)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{f(reducedCosts[i] ?? 0)}</td>
                    <td className="py-2.5 px-3">
                      {(v.value ?? 0) > 1e-5
                        ? <span className="text-xs font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-lg">Básica</span>
                        : <span className="text-xs font-medium text-slate-500 bg-slate-800/60 border border-slate-700/50 px-2 py-0.5 rounded-lg">Não-básica</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="px-5 pb-5">
          <p className="text-xs text-slate-500 mb-3">Restrições — Preços Sombra</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  {['Restrição', 'Preço Sombra', 'RHS Atual', 'Interpretação'].map((h) => (
                    <th key={h} className="pb-2 px-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {problemData.constraints.map((c, i) => {
                  const sp = results.shadowPrices?.[i] ?? 0;
                  return (
                    <tr key={i} className="border-b border-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-slate-300">R{i + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-purple-400">{f(sp)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{c.rhs}</td>
                      <td className="py-2.5 px-3 text-xs text-slate-500">
                        {Math.abs(sp) > 1e-5
                          ? `+1 unidade em R${i + 1} → Z ${sp > 0 ? '+' : ''}${f(sp)}`
                          : 'Restrição inativa (folga disponível)'}
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
  branched:   { bg: 'bg-blue-950/70',    border: 'border-blue-800/50',    text: 'text-blue-300',    badge: 'bg-blue-900/80 text-blue-300' },
  integer:    { bg: 'bg-emerald-950/70', border: 'border-emerald-800/50', text: 'text-emerald-300', badge: 'bg-emerald-900/80 text-emerald-300' },
  infeasible: { bg: 'bg-red-950/60',     border: 'border-red-900/40',     text: 'text-red-400',     badge: 'bg-red-900/70 text-red-400' },
  pruned:     { bg: 'bg-amber-950/60',   border: 'border-amber-900/40',   text: 'text-amber-400',   badge: 'bg-amber-900/70 text-amber-400' },
};
const STATUS_LABELS: Record<BranchNode['status'], string> = {
  branched: 'Ramificado', integer: 'Inteiro ✓', infeasible: 'Inviável ✗', pruned: 'Podado',
};

function SolucoesInteirasTab({
  results, variables, problemData,
}: {
  results: SimplexResult; variables: Variable[]; problemData: ProblemData;
}) {
  const [intResult, setIntResult] = useState<{ result: SimplexResult | null; nodes: BranchNode[] } | null>(null);
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
        problemData.type, variables.map((v) => v.name),
        problemData.objective.map(Number), constraints
      );
      setIntResult(solver.solveIntegerWithTree());
    } catch (e: any) { console.error(e); }
    finally { setRunning(false); }
  }, [problemData, variables]);

  return (
    <div className="space-y-5">
      <DarkCard className="p-5">
        <SectionLabel>Problema Original (Relaxação LP)</SectionLabel>
        <div className="font-mono text-xs text-slate-400 mb-3 mt-1">
          {problemData.type} Z = {variables.map((v, i) => `${problemData.objective[i] || 0}${v.name}`).join(' + ')}
          &nbsp;· {problemData.constraints.map((c) =>
            `${variables.map((v, j) => `${c.coeffs[j]}${v.name}`).join('+')} ${c.sign} ${c.rhs}`
          ).join(' ; ')}&nbsp;· {variables.map((v) => v.name).join(', ')} ≥ 0, inteiros
        </div>
        <div className="flex items-center gap-4 pt-3 border-t border-slate-800/60">
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

      {!intResult && (
        <div className="text-center py-6">
          <button
            onClick={runBnB} disabled={running}
            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-2xl text-white font-semibold text-sm transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: running ? 'none' : '0 0 24px rgba(37,99,235,0.3), 0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            {running
              ? <><Loader2 size={16} className="animate-spin" /> Calculando Branch &amp; Bound…</>
              : <><GitBranch size={16} /> Calcular Solução Inteira</>}
          </button>
        </div>
      )}

      {intResult && (
        <>
          <DarkCard className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800/70 bg-slate-800/20">
              <SectionLabel>Comparativo LP Relaxada × Solução Inteira</SectionLabel>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    {['Tipo', 'Z', ...variables.map((v) => v.name), 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800/40">
                    <td className="px-5 py-3 text-blue-400 font-medium">LP Relaxada</td>
                    <td className="px-5 py-3 font-mono text-blue-400 font-bold">{fmt(results.zValue)}</td>
                    {results.variables.map((v) => (
                      <td key={v.name} className="px-5 py-3 font-mono text-slate-300">{fmt(v.value ?? 0)}</td>
                    ))}
                    <td className="px-5 py-3">
                      <span className="text-xs bg-blue-950/60 border border-blue-800/40 text-blue-300 px-2 py-0.5 rounded-lg">Ótimo LP</span>
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
                        <span className="text-xs bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
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
            </div>
          </DarkCard>

          <DarkCard className="p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <SectionLabel>Árvore Branch &amp; Bound ({intResult.nodes.length} nós explorados)</SectionLabel>
              <button onClick={() => setIntResult(null)}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors">
                <RotateCcw size={11} /> Recalcular
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5 mb-5">
              {(Object.entries(STATUS_LABELS) as [BranchNode['status'], string][]).map(([st, lbl]) => (
                <span key={st} className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${NODE_COLORS[st].badge}`}>{lbl}</span>
              ))}
            </div>
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-2">
              {intResult.nodes.map((node) => {
                const c = NODE_COLORS[node.status];
                return (
                  <div key={node.id}
                    className={`flex items-start gap-3 px-3 py-2 rounded-xl border ${c.bg} ${c.border}`}
                    style={{ marginLeft: `${node.depth * 20}px` }}>
                    {node.depth > 0 && <span className="text-slate-700 font-bold text-base leading-tight select-none shrink-0">└</span>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold ${c.text}`}>
                          {node.depth === 0 ? 'Nó 0 — Raiz (LP Relaxada)' : `Nó ${node.id} — ${node.branchVar} ${node.branchDir} ${node.branchVal}`}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${c.badge}`}>
                          {STATUS_LABELS[node.status]}
                        </span>
                      </div>
                      {node.zValue !== undefined && (
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-[11px] font-mono text-slate-500">Z = {fmt(node.zValue)}</span>
                          {node.varValues?.map((vv) => (
                            <span key={vv.name} className="text-[11px] font-mono text-slate-600">{vv.name}={fmt(vv.value)}</span>
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

  const [activeTab, setActiveTab]     = useState<TabId>('entrada');
  const [isSolving, setIsSolving]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [showFractions, setShowFractions] = useState(false);
  const [toasts, setToasts]           = useState<Toast[]>([]);
  const [tabKey, setTabKey]           = useState(0);

  const solved = results !== null;

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  // ── Load from URL or localStorage on mount ─────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    if (p) {
      try {
        const data = JSON.parse(decodeURIComponent(atob(p)));
        setVariables(data.vars.map((name: string, i: number) => ({ id: i + 1, name, description: '' })));
        setProblemData({ type: data.type, objective: data.obj, constraints: data.c });
        addToast('Problema carregado do link compartilhado!', 'info');
        return;
      } catch {}
    }
    try {
      const saved = localStorage.getItem('eu-genio-problem');
      if (saved) {
        const { variables: vars, problemData: pd } = JSON.parse(saved);
        if (vars?.length && pd) {
          setVariables(vars);
          setProblemData(pd);
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-save to localStorage ───────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem('eu-genio-problem', JSON.stringify({ variables, problemData }));
    } catch {}
  }, [variables, problemData]);

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
      constraints: p.constraints.map((c) => ({ ...c, coeffs: c.coeffs.filter((_, i) => i !== idx) })),
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

  // ── Load example ───────────────────────────────────────────
  const handleLoadExample = (ex: typeof EXAMPLES[0]) => {
    const vars = ex.varNames.map((name, i) => ({ id: i + 1, name, description: '' }));
    setVariables(vars);
    setProblemData({ type: ex.type, objective: ex.objective, constraints: ex.constraints });
    setActiveTab('entrada');
    addToast(`Exemplo "${ex.label}" carregado!`, 'info');
  };

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
      addToast(`Otimizado! Z* = ${fmt(result.zValue)}`, 'success');
    } catch (e: any) {
      const msg = e.message || 'Erro ao resolver o problema.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setIsSolving(false);
    }
  };

  const handleClear = () => {
    resetProject();
    setError(null);
    setActiveTab('entrada');
    addToast('Problema limpo.', 'info');
  };

  const handleTabClick = (id: TabId) => {
    if (id === 'entrada' || solved) {
      setActiveTab(id);
      setTabKey((k) => k + 1);
    }
  };

  // ── Share via URL ──────────────────────────────────────────
  const handleShare = () => {
    try {
      const data = {
        vars: variables.map((v) => v.name),
        type: problemData.type,
        obj: problemData.objective,
        c: problemData.constraints,
      };
      const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
      const url = `${window.location.origin}${window.location.pathname}?p=${encoded}`;
      navigator.clipboard.writeText(url).then(() => {
        addToast('Link copiado para a área de transferência!', 'success');
      }).catch(() => {
        addToast('Não foi possível copiar o link.', 'error');
      });
    } catch {
      addToast('Erro ao gerar link.', 'error');
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen text-slate-100"
      style={{
        background: 'radial-gradient(ellipse 120% 60% at 50% -10%, rgba(15,23,42,0.95) 0%, #020617 65%)',
        backgroundColor: '#020617',
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50" style={{ backdropFilter: 'blur(16px)' }}>

        {/* Brand bar */}
        <div className="border-b border-slate-800/80" style={{ background: 'rgba(15,23,42,0.92)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-3">

            {/* Logo + Brand */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: '0 0 16px rgba(59,130,246,0.35)', borderRadius: 12 }} />
                <img src="/logo-eu-genio.png" alt="Eu Gênio"
                  className="relative h-10 w-10 rounded-xl object-cover"
                  style={{ boxShadow: '0 0 0 1px rgba(59,130,246,0.25)' }} />
              </div>
              <div>
                <div className="text-[15px] font-extrabold tracking-tight text-white leading-none">
                  Eu{' '}
                  <span style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Gênio
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase mt-0.5 leading-none hidden sm:block">
                  Solucionador Simplex
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Fraction toggle */}
              <button
                onClick={() => { setShowFractions((v) => !v); addToast(showFractions ? 'Exibindo decimais' : 'Exibindo frações', 'info'); }}
                title={showFractions ? 'Mostrar decimais' : 'Mostrar frações'}
                className={`hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-bold transition-all ${
                  showFractions
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                    : 'border-slate-700/70 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="font-mono text-base leading-none">½</span>
                <span className="text-[11px]">{showFractions ? 'Frações' : 'Decimais'}</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                title="Copiar link do problema"
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-700/70 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-xs font-medium transition-all"
              >
                <Share2 size={13} />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>

              {/* Export PDF */}
              {solved && results && (
                <button
                  onClick={() => printReport(variables, (results as any).problemData ?? problemData, results)}
                  title="Exportar relatório PDF"
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-700/70 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-xs font-medium transition-all"
                >
                  <Printer size={13} />
                  <span className="hidden sm:inline">Exportar PDF</span>
                </button>
              )}

              {/* Solution badge */}
              {solved && results && (
                <span className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold
                  ${results.status === 'Otimizado'
                    ? 'bg-emerald-950/70 border-emerald-700/40 text-emerald-400'
                    : 'bg-amber-950/70 border-amber-700/40 text-amber-400'}`}>
                  <CheckCircle2 size={11} />
                  Z = {fmt(results.zValue)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="border-b border-slate-800/60" style={{ background: 'rgba(2,6,23,0.85)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-5">
            <nav className="flex items-center gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {TABS.map((tab) => {
                const isActive   = activeTab === tab.id;
                const accessible = tab.id === 'entrada' || solved;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    disabled={!accessible}
                    className={[
                      'relative flex items-center gap-1.5 px-4 sm:px-5 py-3 text-sm font-medium whitespace-nowrap transition-all',
                      isActive     ? 'text-blue-400'
                        : accessible ? 'text-slate-500 hover:text-slate-300'
                        : 'text-slate-700 cursor-not-allowed',
                    ].join(' ')}
                  >
                    <span className={`text-[10px] font-black font-mono ${isActive ? 'text-blue-500' : 'text-slate-700'}`}>
                      {tab.num}.
                    </span>
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                        style={{ background: 'linear-gradient(90deg, #3b82f6, #818cf8)' }} />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-5 py-8">
        <div key={tabKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
              onLoadExample={handleLoadExample}
              isSolving={isSolving}
              error={error}
            />
          )}
          {activeTab === 'simplex' && solved && results && (
            <SimplexTab results={results} showFractions={showFractions} />
          )}
          {activeTab === 'grafico' && solved && results && (
            <GraficoTab results={results} variables={variables} />
          )}
          {activeTab === 'dualidade' && solved && results && (
            <DualidadeTab
              results={results}
              variables={variables}
              problemData={(results as any).problemData ?? problemData}
              showFractions={showFractions}
            />
          )}
          {activeTab === 'inteiras' && solved && results && (
            <SolucoesInteirasTab
              results={results}
              variables={variables}
              problemData={(results as any).problemData ?? problemData}
            />
          )}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Eu Gênio — Todos os direitos reservados.
          </p>
          <a
            href="https://www.linkedin.com/in/higuzx/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-400 transition-colors group"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <span className="group-hover:underline underline-offset-2">linkedin.com/in/higuzx</span>
          </a>
        </div>
      </footer>

      {/* ── Toasts ─────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
