"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Network, Grid3X3, Truck, GitBranch, Clock, Gamepad2, ChevronLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mapeamento de cores para garantir que o Tailwind processe as classes
const colorStyles: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    blue: "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    indigo: "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
    slate: "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-600",
};

const borderStyles: Record<string, string> = {
    emerald: "hover:border-emerald-200 hover:shadow-emerald-900/10",
    blue: "hover:border-blue-200 hover:shadow-blue-900/10",
    indigo: "hover:border-indigo-200 hover:shadow-indigo-900/10",
    slate: "border-slate-100 opacity-60 cursor-not-allowed",
};

export default function MenuPage() {
    const router = useRouter();

    const modules = [
        { id: 'LE', title: 'Linear Equations', desc: 'Gauss-Jordan / Inversão de Matrizes', icon: Network, color: 'emerald' },
        { id: 'LP', title: 'Linear Programming', desc: 'Método Simplex / Análise de Sensibilidade', icon: Grid3X3, color: 'blue' },
        { id: 'IP', title: 'Integer programming', desc: 'Branch and Bound / Planos de Corte', icon: GitBranch, color: 'indigo' },
        { id: 'TR', title: 'Transportation model', desc: 'Vogel / Canto Noroeste (Em breve)', icon: Truck, color: 'slate', disabled: true },
        { id: 'NM', title: 'Network models', desc: 'CPM / PERT (Em breve)', icon: Network, color: 'slate', disabled: true },
        { id: 'PP', title: 'Project Planning', desc: 'Gantt / Alocação (Em breve)', icon: Clock, color: 'slate', disabled: true },
        { id: 'QA', title: 'Queuing analysis', desc: 'M/M/1 / M/M/c (Em breve)', icon: Clock, color: 'slate', disabled: true },
        { id: 'ZS', title: 'Zero-Sum Games', desc: 'Minimax / Maximin (Em breve)', icon: Gamepad2, color: 'slate', disabled: true },
    ];

    const handleSelect = (id: string) => {
        if (id === 'LP' || id === 'IP') router.push('/setup'); // Ajuste a rota conforme seu projeto (ex: /linear ou /setup)
        if (id === 'LE') router.push('/linear');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">

            {/* Background Decorativo (Consistente) */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

            {/* --- CONTEÚDO PRINCIPAL --- */}
            <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">

                <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Button variant="ghost" onClick={() => router.push('/')} className="pl-0 text-slate-500 hover:text-slate-900 mb-4 hover:bg-transparent transition-colors">
                        <ChevronLeft size={20} className="mr-1" /> Voltar para o início
                    </Button>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">Selecione um Módulo</h1>
                    <p className="text-slate-500 text-lg">Escolha a ferramenta ideal para resolver o seu problema matemático.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {modules.map((m) => {
                        const Icon = m.icon;
                        const colorClass = colorStyles[m.color] || colorStyles.slate;
                        const borderClass = borderStyles[m.color] || borderStyles.slate;

                        return (
                            <button
                                key={m.id}
                                disabled={m.disabled}
                                onClick={() => handleSelect(m.id)}
                                className={`
                                    group relative flex flex-col items-start p-8 rounded-3xl border-2 bg-white transition-all duration-300 w-full text-left
                                    ${m.disabled ? 'border-slate-100 bg-slate-50/50' : `border-slate-100 hover:-translate-y-1 hover:shadow-xl ${borderClass}`}
                                `}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${colorClass}`}>
                                    <Icon size={28} strokeWidth={2} />
                                </div>

                                <h3 className={`text-xl font-bold mb-2 ${m.disabled ? 'text-slate-400' : 'text-slate-900 group-hover:text-emerald-700 transition-colors'}`}>
                                    {m.title}
                                </h3>

                                <p className="text-sm text-slate-500 leading-relaxed text-left">
                                    {m.desc}
                                </p>

                                {!m.disabled && (
                                    <div className="absolute top-8 right-8 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-slate-300">
                                        <ChevronLeft className="rotate-180" size={24} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}