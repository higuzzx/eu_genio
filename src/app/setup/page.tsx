"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2, Variable, ArrowRight, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useProject } from '@/context/project-context';
import { Variable as VariableType } from '@/models/Variable';

export default function VariableSetup() {
    const router = useRouter();
    const { variables, setVariables, setProblemData } = useProject();

    const addVar = () => {
        const id = variables.length + 1;
        setVariables([...variables, { id, name: `x${id}`, description: '' }]);
    };

    const removeVar = (index: number) => {
        if (variables.length <= 2) return;
        const newVars = variables.filter((_: any, i: number) => i !== index);
        setVariables(newVars);
    };

    const updateVar = (index: number, field: string, value: string) => {
        const newVars = [...variables];
        // @ts-ignore
        newVars[index] = { ...newVars[index], [field]: value };
        setVariables(newVars);
    };

    const handleNext = () => {
        // Inicializa a estrutura de dados do problema se necessário
        setProblemData(prev => ({
            ...prev,
            objective: Array(variables.length).fill(''),
            constraints: prev.constraints.map(c => ({
                ...c,
                coeffs: Array(variables.length).fill('')
            }))
        }));
        router.push('/modeling');
    };

    const isValid = variables.length > 0 && variables.every(v => v.name.trim().length > 0);

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
                            onClick={() => router.push('/menu')}
                            className="text-slate-500 hover:text-slate-900 pl-0 gap-1"
                        >
                            <ChevronLeft size={20} /> Voltar
                        </Button>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                                <Settings2 size={18} />
                            </div>
                            <h1 className="text-lg font-bold text-slate-900 hidden sm:block">Configuração Inicial</h1>
                        </div>
                    </div>

                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                        Passo 1 de 3
                    </div>
                </div>
            </header>

            {/* --- CONTEÚDO PRINCIPAL --- */}
            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl pb-32">

                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Definição de Variáveis</h2>
                    <p className="text-slate-500 text-lg">Identifique as variáveis de decisão do seu problema.</p>
                </div>

                <Card className="border-slate-200 shadow-xl shadow-slate-200/60 bg-white animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b border-slate-100 pb-4">
                        <CardTitle className="flex items-center gap-3 text-slate-800">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Variable size={20} /></div>
                            Variáveis de Decisão
                        </CardTitle>
                        <Button
                            onClick={addVar}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md shadow-indigo-900/10"
                        >
                            <Plus size={16} className="mr-1" /> Adicionar Variável
                        </Button>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-6">
                        {variables.map((variable: VariableType, index: number) => (
                            <div
                                key={index}
                                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-300 group"
                            >
                                {/* Ícone/Número da Variável */}
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 font-mono font-bold text-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors shrink-0">
                                    x{index + 1}
                                </div>

                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Nome / Símbolo</label>
                                        <Input
                                            value={variable.name}
                                            onChange={(e: any) => updateVar(index, 'name', e.target.value)}
                                            placeholder={`Ex: Mesas`}
                                            className="font-bold text-slate-800 border-slate-200 focus:border-indigo-500 h-11"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Descrição (Opcional)</label>
                                        <Input
                                            value={variable.description}
                                            onChange={(e: any) => updateVar(index, 'description', e.target.value)}
                                            placeholder="Ex: Quantidade produzida..."
                                            className="text-slate-600 border-slate-200 focus:border-indigo-500 h-11"
                                        />
                                    </div>
                                </div>

                                {variables.length > 2 && (
                                    <button
                                        onClick={() => removeVar(index)}
                                        className="self-end sm:self-center p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                        title="Remover variável"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </main>

            {/* FOOTER DE AÇÃO (Sticky) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-40">
                <div className="container mx-auto max-w-4xl flex justify-end">
                    <Button
                        size="lg"
                        onClick={handleNext}
                        disabled={!isValid}
                        className={`
                            h-14 px-10 text-lg rounded-xl font-bold tracking-wide transition-all shadow-xl
                            ${isValid ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20 hover:-translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                        `}
                    >
                        Continuar para Modelagem <ArrowRight size={20} className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}