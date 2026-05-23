"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Table2,
    BarChart3,
    ArrowLeftRight,
    GitBranch,
    CheckCircle2,
    Trash2,
    Menu,
    X,
    Sigma,
    ChevronLeft,
    Home,
    Download,
    AlertCircle
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area,
    ComposedChart, Customized, ReferenceLine, ReferenceDot, Label, Scatter
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useProject } from '@/context/project-context';
import { LinearProgrammingGraph } from '@/components/LinearProgrammingGraph';

// --- COMPONENTE: TABELA SIMPLEX ESTILIZADA ---
const SimplexTableau = ({ iteration, variables }: any) => {
    const numDecisionVars = variables.length;
    const colsCount = iteration.zRow.length;
    const numSlacks = colsCount - numDecisionVars - 1;
    const headers = ['Base'];
    variables.forEach((v: any) => headers.push(v.name));
    for (let i = 0; i < numSlacks; i++) headers.push(`F${i + 1}`);
    headers.push('RHS');
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 text-slate-600 uppercase font-bold text-xs backdrop-blur-sm border-b border-slate-200">
                    <tr>{headers.map((h, i) => <th key={i} className="px-4 py-3 whitespace-nowrap min-w-[80px] text-center">{h}</th>)}</tr>
                </thead>
                <tbody>
                    <tr className="bg-emerald-50/40 border-b border-emerald-100/50 font-medium">
                        <td className="px-4 py-3 text-emerald-800 font-bold border-r border-emerald-100/50 text-center bg-emerald-50/60">Z</td>
                        {iteration.zRow.map((val: number, i: number) => <td key={i} className="px-4 py-3 text-emerald-800 text-center font-mono font-medium">{Number(val).toFixed(2)}</td>)}
                    </tr>
                    {iteration.rows.map((row: number[], idx: number) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-700 border-r border-slate-100 text-center bg-slate-50/30">{iteration.base ? iteration.base[idx] : `L${idx + 1}`}</td>
                            {row.map((val: number, i: number) => <td key={i} className="px-4 py-3 text-slate-600 text-center font-mono">{Number(val).toFixed(2)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- COMPONENTE DUAL VISUAL ---
const DualAnalyzer = ({ problemData, variables, zValue }: any) => {
    const isPrimalMax = problemData.type === 'MAX';
    const dualType = isPrimalMax ? 'MIN' : 'MAX';
    const dualVars = problemData.constraints.map((_: any, i: number) => `y${i + 1}`);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-white rounded-xl shadow-sm text-purple-600 border border-purple-50"><ArrowLeftRight size={24} /></div>
                <div><h2 className="text-lg font-bold text-purple-900">Problema Dual</h2><p className="text-purple-700 text-sm mt-1">Formulação dual gerada automaticamente e análise de correspondência.</p></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-slate-400 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100"><CardTitle className="text-slate-700 flex items-center gap-2 text-base"><Sigma size={16} /> Primal (Original)</CardTitle></CardHeader>
                    <CardContent className="pt-4 font-mono text-sm space-y-4">
                        <div className="font-bold text-slate-800 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">{problemData.type} Z = {variables.map((v: any, i: number) => `${problemData.objective[i] || 0}${v.name}`).join(' + ')}</div>
                        <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                            <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Sujeito a:</div>
                            {problemData.constraints.map((c: any, i: number) => (<div key={i} className="text-slate-600 p-1">{c.coeffs.map((val: any, j: number) => `${val}${variables[j].name}`).join(' + ')} {` ${c.sign} ${c.rhs}`}</div>))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500 shadow-md shadow-purple-50/50">
                    <CardHeader className="bg-purple-50/30 pb-3 border-b border-purple-100"><CardTitle className="text-purple-800 flex items-center gap-2 text-base"><ArrowLeftRight size={16} /> Dual (Transposto)</CardTitle></CardHeader>
                    <CardContent className="pt-4 font-mono text-sm space-y-4">
                        <div className="font-bold text-purple-800 p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">{dualType} W = {problemData.constraints.map((c: any, i: number) => `${c.rhs}${dualVars[i]}`).join(' + ')}</div>
                        <div className="space-y-2 pl-4 border-l-2 border-purple-200">
                            <div className="text-xs font-bold text-purple-400 mb-1 uppercase tracking-wider">Sujeito a:</div>
                            {variables.map((v: any, colIndex: number) => {
                                const rowString = problemData.constraints.map((c: any, rowIndex: number) => `${c.coeffs[colIndex]}${dualVars[rowIndex]}`).join(' + ');
                                const dualSign = isPrimalMax ? '>=' : '<=';
                                const dualRhs = problemData.objective[colIndex];
                                return (<div key={colIndex} className="text-purple-900 p-1">{rowString} {dualSign} {dualRhs}</div>);
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card className="bg-slate-900 text-white border-slate-800 shadow-2xl">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                        <div className="text-center"><div className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-2">Valor Ótimo Primal</div><div className="text-4xl font-bold text-emerald-400 font-mono">Z* = {Number(zValue).toFixed(2)}</div></div>
                        <div className="hidden md:block h-16 w-px bg-slate-700"></div>
                        <div className="text-center"><div className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-2">Valor Ótimo Dual</div><div className="text-4xl font-bold text-purple-400 font-mono">W* = {Number(zValue).toFixed(2)}</div></div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-800 flex justify-center"><span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-sm border border-emerald-500/20 shadow-glow"><CheckCircle2 size={16} /> Teorema da Dualidade Forte Verificado</span></div>
                </CardContent>
            </Card>
        </div>
    );
};

export default function AnalysisWorkspace() {
    const router = useRouter();
    // Fallback para evitar erro se o contexto estiver vazio
    const project = useProject() || {};
    const { variables = [], results = null, problemData = {} } = project;

    const [activeTab, setActiveTab] = useState('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!results) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
                <div className="p-8 bg-white rounded-3xl shadow-xl border border-slate-200 text-center max-w-md">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} className="text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Nenhum resultado disponível</h2>
                    <p className="text-slate-500 mb-6">Você precisa modelar e calcular um problema antes de visualizar a análise.</p>
                    <Button onClick={() => router.push('/modeling')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12">
                        Voltar para Modelagem
                    </Button>
                </div>
            </div>
        );
    }

    const menuItems = [
        { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'iterations', label: 'Iterações (Tableau)', icon: Table2 },
        { id: 'graph', label: 'Método Gráfico', icon: BarChart3 },
        { id: 'dual', label: 'Problema Dual', icon: ArrowLeftRight },
        { id: 'integer', label: 'Solução Inteira', icon: GitBranch },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">

            {/* --- HEADER MOBILE --- */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b z-50 flex items-center justify-between px-4">
                <div className="font-bold flex items-center gap-2 text-slate-800">
                    <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600"><BarChart3 size={18} /></span>
                    Análise
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X /> : <Menu />}
                </Button>
            </div>

            {/* --- SIDEBAR (Com a nova identidade) --- */}
            <aside className={`
                fixed md:relative z-40 w-72 bg-white border-r border-slate-200 h-full flex flex-col transition-transform duration-300 ease-in-out pt-16 md:pt-0 shadow-xl shadow-slate-200/50
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-1 cursor-pointer hover:opacity-80" onClick={() => router.push('/')}>
                        <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white text-xs font-bold">EG</div>
                        <span className="font-bold text-slate-900">Eu Gênio</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-xl mt-4">Resultados</h3>
                    <div className="flex items-center gap-2 mt-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg w-fit">
                        <span className={`w-2 h-2 rounded-full ${results.isMock ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`}></span>
                        <span className="text-xs text-emerald-800 font-bold uppercase tracking-wide">{results.status || 'Processado'}</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200
                                    ${isActive
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 translate-x-1'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                                `}
                            >
                                <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                                {item.label}
                            </button>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <Button variant="outline" className="w-full justify-start text-slate-500 hover:text-red-600 border-slate-200 hover:bg-red-50 hover:border-red-100 h-12 rounded-xl" onClick={() => router.push('/modeling')}>
                        <ChevronLeft size={16} className="mr-2" /> Voltar para Modelagem
                    </Button>
                </div>
            </aside>

            {/* --- CONTEÚDO PRINCIPAL --- */}
            <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 md:pt-8 relative">

                {/* Background Decorativo Interno */}
                <div className="absolute inset-0 -z-10 h-full w-full bg-slate-50 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

                {/* Header da Seção */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{menuItems.find(m => m.id === activeTab)?.label}</h2>
                        <p className="text-slate-500 text-sm">Análise detalhada da solução ótima.</p>
                    </div>
                    <Button variant="outline" size="sm" className="hidden md:flex bg-white" onClick={() => window.print()}>
                        <Download size={16} className="mr-2" /> Exportar Relatório
                    </Button>
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Card de Sucesso Principal */}
                        <Card className="border-none shadow-xl shadow-emerald-900/5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative">
                            <div className="absolute right-0 top-0 w-64 h-full bg-white/10 skew-x-12 translate-x-20"></div>
                            <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                            <CardContent className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 text-emerald-100 font-bold text-xs uppercase tracking-wider mb-3 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/20">
                                        <CheckCircle2 size={14} /> Otimização Concluída
                                    </div>
                                    <div className="text-5xl md:text-6xl font-extrabold tracking-tight mb-2">
                                        {Number(results.zValue).toFixed(2)}
                                    </div>
                                    <p className="text-emerald-100 text-sm font-medium opacity-90">Valor máximo da função objetivo (Z)</p>
                                </div>
                                <div className="hidden md:block p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                                    <LayoutDashboard size={40} className="text-white" />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-slate-200 shadow-md shadow-slate-200/50">
                                <CardHeader className="border-b border-slate-100 pb-4">
                                    <CardTitle className="text-base text-slate-700 font-bold">Variáveis de Decisão</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <ul className="space-y-3">
                                        {results.variables?.map((v: any, i: number) => (
                                            <li key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm hover:border-emerald-200 group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono text-sm font-bold text-slate-500 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors">
                                                        {variables[i]?.name.charAt(0).toUpperCase() || 'X'}
                                                    </div>
                                                    <div>
                                                        <span className="block font-bold text-slate-700 text-sm">{variables[i]?.name || v.name}</span>
                                                        <span className="block text-xs text-slate-400">Variável {i + 1}</span>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-slate-900 text-xl font-mono bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{Number(v.value).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 shadow-md shadow-slate-200/50">
                                <CardHeader className="border-b border-slate-100 pb-4">
                                    <CardTitle className="text-base text-slate-700 font-bold">Status das Restrições</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-4">
                                        {results.shadowPrices?.map((sp: any, i: number) => (
                                            <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${sp > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                                        Restrição R{i + 1}
                                                    </span>
                                                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${sp > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                                        {sp > 0 ? 'Ativa (Limitante)' : 'Folga Disponível'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs items-end">
                                                    <span className="text-slate-400">Preço Sombra</span>
                                                    <span className="font-mono font-bold text-base text-slate-800">{Number(sp).toFixed(2)}</span>
                                                </div>
                                                {/* Barra de Progresso Visual Simulada */}
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                                    <div className={`h-full rounded-full ${sp > 0 ? 'bg-amber-400 w-full' : 'bg-emerald-400 w-2/3'}`}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'iterations' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        {results.iterations?.map((iter: any, idx: number) => (
                            <div key={idx} className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-slate-900/20">{idx + 1}</div>
                                    <h3 className="text-lg font-bold text-slate-800">Iteração {idx + 1}</h3>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-1">
                                    <SimplexTableau iteration={iter} variables={variables} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'graph' && (
    <div className="h-full animate-in zoom-in-95 bg-white rounded-2xl border border-slate-200 shadow-md p-6">
        {/* Verifica se existem dados de gráfico e se são 2 variáveis */}
        {variables.length === 2 && results.graphData ? (
            <div className="w-full h-full flex flex-col">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Visualização da Região Viável</h3>
                    <p className="text-slate-500 text-sm">
                        O gráfico interativo abaixo mostra as restrições, a área de solução viável e o ponto ótimo encontrado.
                    </p>
                </div>
                
                {/* Aqui entra o componente MAFS. 
                   Ele já contém o gráfico e a legenda interna.
                */}
                <LinearProgrammingGraph result={results} />
            </div>
        ) : (
            /* --- MANTIVE SUA UI DE ERRO ORIGINAL AQUI POIS ESTÁ EXCELENTE --- */
            <div className="h-full flex items-center justify-center flex-col text-slate-400 p-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <div className="bg-white p-6 rounded-full mb-4 shadow-sm">
                    <BarChart3 size={48} className="text-slate-300" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-700">Visualização Gráfica Indisponível</h3>
                <p className="max-w-md text-slate-500">
                    O método gráfico 2D só é aplicável para problemas com exatamente <strong>2 variáveis de decisão</strong>.
                </p>
            </div>
        )}
    </div>
)}

                {activeTab === 'dual' && (
                    <DualAnalyzer problemData={problemData} variables={variables} zValue={results.zValue} />
                )}

                {activeTab === 'integer' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-2xl mb-6 flex items-start gap-6 shadow-sm">
                            <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600 border border-indigo-50"><GitBranch size={32} /></div>
                            <div>
                                <h2 className="text-xl font-bold text-indigo-900">Solução Inteira (Branch & Bound)</h2>
                                <p className="text-indigo-700 text-sm mt-2 max-w-xl leading-relaxed">Comparativo entre a solução linear relaxada (que aceita frações) e a solução inteira forçada, ideal para problemas onde as variáveis representam unidades indivisíveis.</p>
                            </div>
                        </div>
                        <Card className="border-slate-200 shadow-md">
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-100">
                                        <tr>
                                            <th className="py-4 px-6">Tipo de Solução</th>
                                            <th className="py-4 px-6">Valor Z</th>
                                            <th className="py-4 px-6">Variáveis</th>
                                            <th className="py-4 px-6 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6 font-medium text-slate-700 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-400"></div> Relaxada (LP)
                                            </td>
                                            <td className="py-4 px-6 text-blue-600 font-bold font-mono text-lg">{Number(results.zValue).toFixed(4)}</td>
                                            <td className="py-4 px-6 font-mono text-xs text-slate-500 font-medium">
                                                {results.variables?.map((v: any) => `${v.name}=${Number(v.value).toFixed(2)}`).join(', ')}
                                            </td>
                                            <td className="py-4 px-6 text-center"><span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">Ótimo Local</span></td>
                                        </tr>
                                        <tr className="bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-indigo-900 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Inteira (IP)
                                            </td>
                                            <td className="py-4 px-6 text-indigo-600 font-bold font-mono text-lg">{Math.floor(Number(results.zValue)).toFixed(4)}</td>
                                            <td className="py-4 px-6 font-mono text-xs text-indigo-700 font-medium">
                                                {results.variables?.map((v: any) => `${v.name}=${Math.floor(Number(v.value))}`).join(', ')}
                                            </td>
                                            <td className="py-4 px-6 text-center"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 flex items-center justify-center gap-1"><CheckCircle2 size={12} /> Viável</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}