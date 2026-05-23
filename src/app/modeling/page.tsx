"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Plus,
    Trash2,
    Sigma,
    Table2,
    Play,
    Loader2,
    ArrowUpCircle,
    ArrowDownCircle,
    Settings2,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProject } from '@/context/project-context';
import { Variable } from '@/models/Variable';
import { ProblemData } from '@/models/ProblemData';

// Mock Generator (Fallback de segurança)
const generateMock = (variables: Variable[], problemData: ProblemData) => {
    const zValue = Math.floor(Math.random() * 5000) + 1000;
    const varResults = variables.map(v => ({
        id: v.id,
        name: v.name,
        description: v.description || '',
        value: Math.floor(Math.random() * 50)
    }));
    return {
        status: "Otimizado (Simulação)",
        isMock: true,
        zValue,
        variables: varResults,
        shadowPrices: [10, 0],
        iterations: [],
        problemData,
        graphData: null
    };
};

export default function ModelingScreen() {
    const router = useRouter();

    // Hooks com fallback para evitar erro se o contexto estiver vazio na visualização
    const project = useProject() || {};
    const {
        variables = [{ id: 1, name: 'x1', description: '' }, { id: 2, name: 'x2', description: '' }],
        problemData = { type: 'MAX', objective: ['', ''], constraints: [{ coeffs: ['', ''], sign: '<=', rhs: '' }] },
        setProblemData = () => { },
        setResults = () => { }
    } = project;

    const [isSolving, setIsSolving] = useState(false);

    const updateObjective = (index: number, val: string) => {
        const newObj = [...problemData.objective];
        newObj[index] = val;
        setProblemData({ ...problemData, objective: newObj });
    };

    const addConstraint = () => {
        const newConstraints = [...problemData.constraints, { coeffs: Array(variables.length).fill(''), sign: '<=', rhs: '' }];
        setProblemData({ ...problemData, constraints: newConstraints });
    };

    const removeConstraint = (index: number) => {
        if (problemData.constraints.length <= 1) return;
        const newConstraints = problemData.constraints.filter((_, i) => i !== index);
        setProblemData({ ...problemData, constraints: newConstraints });
    };

    const updateConstraint = (cIndex: number, field: string, val: any, vIndex?: number) => {
        const newConstraints = [...problemData.constraints];
        if (field === 'coeff' && typeof vIndex === 'number') {
            newConstraints[cIndex].coeffs[vIndex] = val;
        } else {
            // @ts-ignore
            newConstraints[cIndex][field] = val;
        }
        setProblemData({ ...problemData, constraints: newConstraints });
    };

    const handleSolve = async () => {
        setIsSolving(true);
        const payload = {
            optimizationType: problemData.type === 'MAX' ? 'maximizar' : 'minimizar',
            variables: variables.map((v: any) => v.name),
            objectiveFunction: problemData.objective.map(Number),
            constraints: problemData.constraints.map((c: any) => ({ coeffs: c.coeffs.map(Number), sign: c.sign, value: Number(c.rhs) }))
        };

        try {
            const response = await fetch('/api/solve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error("API offline");
            const data = await response.json();
            setResults({ ...data, problemData });
            router.push('/execucao');
        } catch (error) {
            console.warn("Backend offline. Ativando modo simulação.", error);
            const mockData = generateMock(variables, problemData);
            setResults(mockData);
            router.push('/execucao');
        } finally {
            setIsSolving(false);
        }
    };

    const isValid = problemData.objective.every((v: any) => v !== '') &&
        problemData.constraints.every((c: any) => c.coeffs.every((co: any) => co !== '') && c.rhs !== '');

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">

            {/* Background Decorativo */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

            {/* --- HEADER --- */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/setup')}
                            className="text-slate-500 hover:text-slate-900 pl-0 gap-1"
                        >
                            <ChevronLeft size={20} /> Voltar
                        </Button>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                                <Settings2 size={18} />
                            </div>
                            <h1 className="text-lg font-bold text-slate-900 hidden sm:block">Modelagem</h1>
                        </div>
                    </div>

                    {/* Toggle Max/Min no Header */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setProblemData({ ...problemData, type: 'MAX' })}
                            className={`
                                    px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2
                                    ${problemData.type === 'MAX' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}
                                `}
                        >
                            <ArrowUpCircle size={16} /> MAX
                        </button>
                        <button
                            onClick={() => setProblemData({ ...problemData, type: 'MIN' })}
                            className={`
                                    px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2
                                    ${problemData.type === 'MIN' ? 'bg-white text-amber-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}
                                `}
                        >
                            <ArrowDownCircle size={16} /> MIN
                        </button>
                    </div>
                </div>
            </header>

            {/* --- ÁREA DE TRABALHO --- */}
            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl pb-32">

                {/* Título da Página */}
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Definição Matemática</h2>
                    <p className="text-slate-500 text-lg">Insira os coeficientes da Função Objetivo e configure as Restrições.</p>
                </div>

                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* CARD: FUNÇÃO OBJETIVO */}
                    <Card className="border-l-4 border-l-blue-500 shadow-lg shadow-blue-900/5 overflow-hidden bg-white">
                        <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="flex items-center gap-3 text-slate-800">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Sigma size={20} /></div>
                                Função Objetivo (Z)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8 pb-8">
                            <div className="flex flex-wrap items-center gap-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm justify-center md:justify-start">
                                <span className="text-3xl font-serif italic text-slate-700 font-bold mr-2">Z =</span>
                                {variables.map((variable: Variable, i: number) => (
                                    <div key={i} className="flex items-center gap-3 group relative">
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={problemData.objective[i] || ''}
                                                onChange={(e: any) => updateObjective(i, e.target.value)}
                                                placeholder="0"
                                                className="w-28 text-center text-xl font-bold h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl shadow-sm transition-all bg-slate-50 focus:bg-white"
                                            />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-bold text-slate-800 text-lg">{variable.name}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Coef.</span>
                                        </div>
                                        {i < variables.length - 1 && <span className="text-slate-300 font-light text-3xl mx-2">+</span>}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* CARD: RESTRIÇÕES */}
                    <Card className="border-l-4 border-l-emerald-500 shadow-lg shadow-emerald-900/5 bg-white">
                        <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-3 text-slate-800">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Table2 size={20} /></div>
                                Restrições (Sujeito a)
                            </CardTitle>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={addConstraint}
                                className="h-9 text-xs bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 shadow-sm"
                            >
                                <Plus size={14} /> Nova Restrição
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6 pb-6">
                            <div className="space-y-4">
                                {problemData.constraints.map((constraint: any, rIndex: number) => (
                                    <div key={rIndex} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-emerald-400 hover:bg-white hover:shadow-md transition-all duration-300 group relative">

                                        {/* Label da Restrição */}
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 font-bold text-xs mr-2 group-hover:bg-emerald-100 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-colors">
                                            R{rIndex + 1}
                                        </div>

                                        {/* Coeficientes */}
                                        <div className="flex flex-wrap items-center gap-3 flex-1">
                                            {variables.map((variable: Variable, vIndex: number) => (
                                                <div key={vIndex} className="flex items-center gap-2">
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            className="w-20 text-center h-10 font-bold rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white"
                                                            placeholder="0"
                                                            value={constraint.coeffs[vIndex] || ''}
                                                            onChange={(e: any) => updateConstraint(rIndex, 'coeff', e.target.value, vIndex)}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-600">{variable.name}</span>
                                                    {vIndex < variables.length - 1 && <span className="text-slate-300 font-bold mx-1">+</span>}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="hidden md:block w-px h-10 bg-slate-200 mx-2" />

                                        {/* Operador e RHS */}
                                        <div className="flex items-center gap-2 w-full md:w-auto bg-white p-1.5 rounded-xl border border-slate-200 group-hover:border-emerald-200 transition-colors">
                                            <select
                                                className="h-10 rounded-lg border-none bg-slate-100 px-2 text-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer hover:bg-slate-200 transition-colors"
                                                value={constraint.sign}
                                                onChange={(e) => updateConstraint(rIndex, 'sign', e.target.value)}
                                            >
                                                <option value="<=">≤</option>
                                                <option value=">=">≥</option>
                                                <option value="=">=</option>
                                            </select>

                                            <Input
                                                type="number"
                                                className="w-24 h-10 font-bold text-emerald-700 bg-white border-none focus:ring-0 text-lg placeholder:text-slate-300 text-right"
                                                placeholder="Valor"
                                                value={constraint.rhs}
                                                onChange={(e: any) => updateConstraint(rIndex, 'rhs', e.target.value)}
                                            />
                                        </div>

                                        {/* Botão Remover */}
                                        {problemData.constraints.length > 1 && (
                                            <button
                                                onClick={() => removeConstraint(rIndex)}
                                                className="absolute top-2 right-2 md:static p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Remover restrição"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* FOOTER DE AÇÃO */}
                    <div className="mt-12 flex justify-end sticky bottom-6 z-20 pointer-events-none">
                        <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/50 pointer-events-auto">
                            <Button
                                size="lg"
                                className={`
                                        h-14 px-10 text-lg shadow-lg shadow-emerald-900/20 hover:scale-[1.02] transition-transform rounded-xl font-bold tracking-wide
                                        ${isValid ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                                    `}
                                onClick={handleSolve}
                                disabled={isSolving || !isValid}
                            >
                                {isSolving ? (
                                    <> <Loader2 className="animate-spin mr-2" /> Calculando... </>
                                ) : (
                                    <> <Play size={20} fill="currentColor" className="mr-2" /> Calcular Solução Ótima </>
                                )}
                            </Button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}