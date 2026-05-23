"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    // Logic to determine breadcrumbs or steps
    const getStepStyle = (path: string) => {
        return pathname === path ? 'font-bold text-slate-900' : '';
    };

    const isHome = pathname === '/';
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const showSteps = !isHome && !isAuthPage && pathname !== '/menu' && pathname !== '/linear';

    const hideNavbarPaths = ['/', '/login', '/register', '/linear', '/setup', '/modeling', '/execucao'];

    if (hideNavbarPaths.includes(pathname)) return null;

    return (
        <header className="bg-white border-b h-20 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                <div className="relative w-32 h-10 drop-shadow-md">
                    <img src="/logo-eu-genio.png" alt="Eu Gênio" className="w-full h-full object-contain object-left" />
                </div>
            </div>

            <div className="flex items-center gap-6">
                {showSteps && (
                    <div className="hidden md:flex items-center gap-4 text-sm text-slate-400 font-medium mr-4">
                        <Link href="/setup" className={getStepStyle('/setup')}>Variáveis</Link>
                        <ChevronRight size={14} />
                        <Link href="/modeling" className={getStepStyle('/modeling')}>Modelagem</Link>
                        <ChevronRight size={14} />
                        <Link href="/execucao" className={getStepStyle('/execucao')}>Resultados</Link>
                    </div>
                )}
            </div>
        </header>
    );
}
