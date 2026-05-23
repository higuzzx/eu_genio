"use client";

import React from 'react';
import { ChevronLeft, Book, FileText, Database, Monitor, Cpu, Layers, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const Section = ({ id, title, icon: Icon, children }: { id: string, title: string, icon?: any, children: React.ReactNode }) => (
    <section id={id} className="mb-16 scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
            {Icon && <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Icon size={26} /></div>}
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
        </div>
        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-lg">
            {children}
        </div>
    </section>
);

const SubSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            {title}
        </h3>
        <div className="text-slate-600 space-y-3 pl-4">
            {children}
        </div>
    </div>
);

export default function DocsPage() {
    const scrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">

            {/* --- HEADER FIXO --- */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group">
                            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Voltar ao Início</span>
                        </Link>
                        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                        <div className="flex items-center gap-2 hidden sm:flex">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-200">EG</div>
                            <span className="font-bold text-slate-900 text-lg">Eu Gênio Docs</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-100">
                            v1.0.0
                        </span>
                    </div>
                </div>
            </header>

            <div className="flex-1 container mx-auto px-6 flex gap-12 pt-12 relative">

                {/* --- SIDEBAR DE NAVEGAÇÃO (Desktop) --- */}
                <aside className="hidden lg:block w-72 shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-4 custom-scrollbar">
                    <div className="mb-8">
                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-3">Navegação</h4>
                        <nav className="space-y-1">
                            {[
                                { id: 'intro', label: 'Visão Geral' },
                                { id: 'tech', label: 'Tecnologias' },
                                { id: 'features', label: 'Funcionalidades' },
                                { id: 'algorithms', label: 'Algoritmos' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollTo(item.id)}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all flex items-center justify-between group"
                                >
                                    {item.label}
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-400" />
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <h5 className="font-bold text-slate-900 mb-2">Precisa de ajuda?</h5>
                        <p className="text-sm text-slate-500 mb-4">Confira o repositório oficial para reportar bugs.</p>
                        <a
                            href="https://github.com/luisfelipesb9/vector-otimizador"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-slate-300 shadow-sm transition-colors"
                        >
                            Abrir GitHub
                        </a>
                    </div>
                </aside>

                {/* --- CONTEÚDO PRINCIPAL --- */}
                <main className="flex-1 max-w-4xl pb-24 mx-auto lg:mx-0">

                    {/* 1. VISÃO GERAL */}
                    <Section id="intro" title="Visão Geral do Projeto" icon={Book}>
                        <p className="text-lg mb-8 leading-loose">
                            O <strong>Eu Gênio</strong> é uma plataforma educacional e profissional desenvolvida para simplificar a resolução e análise de problemas de Pesquisa Operacional, focando na clareza visual e na experiência interativa.
                        </p>
                        <p className="mb-6">
                            Diferente de ferramentas tradicionais baseadas em linha de comando ou interfaces datadas, o Eu Gênio foca na <span className="text-blue-600 font-bold bg-blue-50 px-1 rounded">Experiência do Usuário (UX)</span> e na visualização de dados, tornando o aprendizado de conceitos complexos como Dualidade e Sensibilidade mais acessível.
                        </p>
                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-sm flex gap-4 items-start">
                            <div className="p-2 bg-emerald-100 rounded-lg shrink-0"><Monitor size={20} /></div>
                            <div>
                                <strong className="block text-base mb-1">Objetivo Acadêmico</strong>
                                Fornecer uma ferramenta gratuita, open-source e moderna para estudantes de engenharia e matemática, preenchendo a lacuna entre teoria e prática.
                            </div>
                        </div>
                    </Section>

                    {/* 2. TECNOLOGIAS */}
                    <Section id="tech" title="Arquitetura Tecnológica" icon={Cpu}>
                        <p className="mb-8">
                            O sistema foi construído utilizando uma stack moderna e performática, garantindo escalabilidade, facilidade de manutenção e uma interface responsiva.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6 mb-6">
                            <div className="p-6 border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all bg-white">
                                <div className="flex items-center gap-3 font-bold text-slate-900 mb-4 text-lg">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Monitor size={20} /></div>
                                    Front-end
                                </div>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>Next.js 14 (App Router)</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>React & TypeScript</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>Tailwind CSS (Estilização)</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>Recharts (Visualização)</li>
                                </ul>
                            </div>
                            <div className="p-6 border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all bg-white">
                                <div className="flex items-center gap-3 font-bold text-slate-900 mb-4 text-lg">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Database size={20} /></div>
                                    Back-end & Infra
                                </div>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>Node.js (Serverless Functions)</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>Supabase (Autenticação & Banco)</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>Vercel (Hospedagem & CI/CD)</li>
                                </ul>
                            </div>
                        </div>
                    </Section>

                    {/* 3. FUNCIONALIDADES */}
                    <Section id="features" title="Módulos e Recursos" icon={Layers}>
                        <SubSection title="Programação Linear (Simplex)">
                            <p>Implementação robusta do método Simplex Tabular. O algoritmo é capaz de lidar com:</p>
                            <ul className="list-none mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <li className="bg-white px-4 py-3 rounded-lg border border-slate-100 shadow-sm text-sm">✅ Maximização e Minimização</li>
                                <li className="bg-white px-4 py-3 rounded-lg border border-slate-100 shadow-sm text-sm">✅ Restrições ≤, ≥ e =</li>
                                <li className="bg-white px-4 py-3 rounded-lg border border-slate-100 shadow-sm text-sm">✅ Variáveis de Folga e Excesso</li>
                                <li className="bg-white px-4 py-3 rounded-lg border border-slate-100 shadow-sm text-sm">✅ Detecção de Inviabilidade</li>
                            </ul>
                        </SubSection>

                        <SubSection title="Método Gráfico Interativo">
                            <p>Para problemas com duas variáveis de decisão, o sistema gera automaticamente uma representação visual completa:</p>
                            <ul className="list-disc list-inside mt-3 ml-2 space-y-2 text-slate-600">
                                <li>Plotagem dinâmica das retas de restrição.</li>
                                <li>Hachura da <strong className="text-slate-900">região viável</strong> (polígono de soluções).</li>
                                <li>Destaque visual do vértice ótimo e curva de nível da função objetivo.</li>
                            </ul>
                        </SubSection>

                        <SubSection title="Dualidade e Sensibilidade">
                            <p>Geração automática do problema Dual correspondente e cálculo dos preços sombra (Shadow Prices) para análise econômica dos recursos escassos.</p>
                        </SubSection>
                    </Section>

                    {/* 4. ALGORITMOS */}
                    <Section id="algorithms" title="Detalhes Algorítmicos" icon={FileText}>
                        <p className="mb-6">
                            O núcleo matemático do Eu Gênio utiliza implementações otimizadas para garantir precisão numérica e performance.
                        </p>
                        <div className="space-y-6">
                            <div className="flex gap-5 items-start p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg border border-slate-200">01</div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1">Tratamento de Frações</h4>
                                    <p className="text-slate-500 leading-relaxed">O motor de cálculo trabalha internamente com frações exatas para evitar erros de arredondamento de ponto flutuante (floating point errors), convertendo para decimal apenas na exibição final.</p>
                                </div>
                            </div>
                            <div className="flex gap-5 items-start p-4 rounded-xl hover:bg-amber-50/50 transition-colors">
                                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg border border-amber-200">02</div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1">Performance Otimizada</h4>
                                    <p className="text-slate-500 leading-relaxed">Execução do Simplex em menos de 200ms para problemas de médio porte, utilizando estruturas de dados eficientes no Node.js.</p>
                                </div>
                            </div>
                            <div className="flex gap-5 items-start p-4 rounded-xl hover:bg-cyan-50/50 transition-colors">
                                <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg border border-cyan-200">03</div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1">Robustez</h4>
                                    <p className="text-slate-500 leading-relaxed">Tratamento robusto de casos extremos, como degenerescência, soluções ilimitadas e múltiplas soluções ótimas.</p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <footer className="mt-24 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
                        <p className="mb-2 font-medium text-slate-500">Eu Gênio 2025</p>
                        <p>Desenvolvido com ❤️ para a disciplina de Pesquisa Operacional.</p>
                    </footer>
                </main>
            </div>
        </div>
    );
}