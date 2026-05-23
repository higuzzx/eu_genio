"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Calculator, AlertCircle, CheckCircle2, RotateCcw, Variable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LinearSolver } from '@/models/LinearSolver';

export default function LinearEqScreen() {
    const router = useRouter();
    const [dimension, setDimension] = useState(3);
    const [matrix, setMatrix] = useState<string[][]>([]);
    const [rhs, setRhs] = useState<string[]>([]);
    const [solution, setSolution] = useState<number[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Inicializa a matriz quando a dimensão muda
    useEffect(() => {
        setMatrix(Array(dimension).fill(0).map(() => Array(dimension).fill('')));
        setRhs(Array(dimension).fill(''));
        setSolution(null);
        setError(null);
    }, [dimension]);

    const handleSolve = () => {
        try {
            setError(null);
            // Validação básica
            if (matrix.some(row => row.some(v => v.trim() === '')) || rhs.some(v => v.trim() === '')) {
                throw new Error("Preencha todos os campos da matriz e do vetor.");
            }
            const numMatrix = matrix.map(row => row.map(Number));
            const numRhs = rhs.map(Number);

            if (numMatrix.some(row => row.some(isNaN)) || numRhs.some(isNaN)) {
                throw new Error("Valores inválidos detectados. Use apenas números.");
            }

            const result = LinearSolver.solve(numMatrix, numRhs);
            setSolution(result);
        } catch (e: any) {
            setError(e.message || "Erro ao resolver o sistema.");
            setSolution(null);
        }
    };

    const handleReset = () => {
        setMatrix(Array(dimension).fill(0).map(() => Array(dimension).fill('')));
        setRhs(Array(dimension).fill(''));
        setSolution(null);
        setError(null);
    };

    const updateMatrix = (r: number, c: number, val: string) => {
        const newM = [...matrix];
        newM[r][c] = val;
        setMatrix(newM);
    };

    const updateRhs = (i: number, val: string) => {
        const newR = [...rhs];
        newR[i] = val;
        setRhs(newR);
    };

    // Validação visual para o botão
    const isValid = !matrix.some(row => row.some(v => v.trim() === '')) && !rhs.some(v => v.trim() === '');

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">

            {/* Background Decorativo */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

            {/* --- HEADER DA FERRAMENTA --- */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/menu')}
                            className="text-slate-500 hover:text-slate-900 pl-0 gap-1"
                        >
                            <ChevronLeft size={20} /> Voltar
                        </Button>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Variable size={18} />
                            </div>
                            <h1 className="text-lg font-bold text-slate-900 hidden sm:block">Sistemas Lineares</h1>
                        </div>
                    </div>

                    {/* Controle de Dimensão no Header */}
                    <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-3">Dimensão (N):</span>
                        <div className="flex items-center">
                            <button
                                onClick={() => setDimension(Math.max(2, dimension - 1))}
                                className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md transition-colors text-slate-600 font-bold"
                            >
                                -
                            </button>
                            <span className="w-8 text-center font-bold text-slate-900">{dimension}</span>
                            <button
                                onClick={() => setDimension(Math.min(10, dimension + 1))}
                                className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md transition-colors text-slate-600 font-bold"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- ÁREA DE TRABALHO --- */}
            <main className="flex-1 container mx-auto px-6 py-8 max-w-6xl">
                <div className="flex flex-col lg:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* COLUNA ESQUERDA: MATRIZ */}
                    <Card className="flex-1 shadow-xl shadow-slate-200/60 border-slate-200 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-slate-700 text-base font-bold flex items-center justify-between">
                                <span>Matriz de Coeficientes (A) e Termos (b)</span>
                                <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-xs text-slate-400 hover:text-red-500">
                                    <RotateCcw size={14} className="mr-1" /> Limpar
                                </Button>
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-8 overflow-x-auto">
                            <div className="flex items-center gap-4 min-w-max mx-auto justify-center">
                                {/* Matriz A */}
                                <div className="grid gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner"
                                    style={{ gridTemplateColumns: `repeat(${dimension}, minmax(70px, 1fr))` }}>
                                    {matrix.map((row, i) => (
                                        row.map((val, j) => (
                                            <Input
                                                key={`${i}-${j}`}
                                                placeholder={`a${i + 1}${j + 1}`}
                                                value={val}
                                                onChange={(e) => updateMatrix(i, j, e.target.value)}
                                                className="text-center font-mono text-slate-800 font-medium h-12 text-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl bg-white shadow-sm"
                                            />
                                        ))
                                    ))}
                                </div>

                                {/* Multiplicador */}
                                <div className="text-2xl font-light text-slate-300">×</div>

                                {/* Vetor X (Visual) */}
                                <div className="flex flex-col gap-3 p-4">
                                    {Array(dimension).fill(0).map((_, i) => (
                                        <div key={i} className="h-12 w-14 flex items-center justify-center bg-white rounded-xl border border-slate-200 font-bold text-slate-400 text-lg font-mono shadow-sm">
                                            x{i + 1}
                                        </div>
                                    ))}
                                </div>

                                {/* Igualdade */}
                                <div className="text-2xl font-light text-slate-300">=</div>

                                {/* Vetor B */}
                                <div className="flex flex-col gap-3 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/60 shadow-inner">
                                    {rhs.map((val, i) => (
                                        <Input
                                            key={`rhs-${i}`}
                                            placeholder={`b${i + 1}`}
                                            value={val}
                                            onChange={(e) => updateRhs(i, e.target.value)}
                                            className="w-24 text-center font-bold text-emerald-700 bg-white border-emerald-200 h-12 text-lg focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl shadow-sm placeholder:text-emerald-200"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
                                <Button
                                    onClick={handleSolve}
                                    size="lg"
                                    className={`
                                        shadow-lg shadow-emerald-900/20 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-14 px-10 font-bold tracking-wide transition-all
                                        ${!isValid ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}
                                    `}
                                    disabled={!isValid}
                                >
                                    <Calculator size={20} className="mr-2" /> Resolver Sistema
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* COLUNA DIREITA: RESULTADOS */}
                    <div className="w-full lg:w-80 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm font-medium flex items-start gap-3 shadow-sm animate-in slide-in-from-right-4 duration-300">
                                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                                <div>
                                    <span className="font-bold block mb-1">Erro no Cálculo</span>
                                    {error}
                                </div>
                            </div>
                        )}

                        {solution && (
                            <Card className="border-emerald-100 bg-emerald-50/30 shadow-xl shadow-emerald-900/5 animate-in slide-in-from-right-4 duration-500 overflow-hidden">
                                <div className="bg-emerald-100/50 p-4 border-b border-emerald-100 flex items-center justify-between">
                                    <h3 className="text-emerald-800 font-bold flex items-center gap-2">
                                        <CheckCircle2 size={20} /> Solução Única
                                    </h3>
                                </div>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-emerald-100/50">
                                        {solution.map((val, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 bg-white/50 hover:bg-white transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-mono font-bold text-sm">
                                                        x{i + 1}
                                                    </span>
                                                </div>
                                                <span className="font-mono font-bold text-slate-800 text-xl">
                                                    {Number.isInteger(val) ? val : val.toFixed(4)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-slate-50/50 text-center border-t border-slate-100">
                                        <p className="text-xs text-slate-400">Método: Eliminação Gaussiana</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!solution && !error && (
                            <div className="h-full min-h-[200px] p-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center text-slate-400">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Calculator className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="font-medium text-slate-500">Aguardando Dados</p>
                                <p className="text-sm mt-1">Preencha a matriz e clique em resolver para ver o resultado.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}