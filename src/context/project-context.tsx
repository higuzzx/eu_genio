"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SimplexResult } from '@/models/SimplexResult';
import { Variable } from '@/models/Variable';
import { ProblemData } from '@/models/ProblemData';

interface AppStateResult extends SimplexResult {
    problemData?: any;
}

interface ProjectContextType {
    variables: Variable[];
    setVariables: (vars: Variable[]) => void;
    problemData: ProblemData;
    setProblemData: React.Dispatch<React.SetStateAction<ProblemData>>;
    updateProblemData: (updater: (prev: ProblemData) => ProblemData) => void;
    results: AppStateResult | null;
    setResults: (results: AppStateResult | null) => void;
    resetProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
    const [variables, setVariables] = useState<Variable[]>([
        { id: 1, name: 'x1', description: '' },
        { id: 2, name: 'x2', description: '' }
    ]);

    const [problemData, setProblemData] = useState<ProblemData>({
        type: 'MAX',
        objective: ['', ''],
        constraints: [
            { coeffs: ['', ''], sign: '<=', rhs: '' },
            { coeffs: ['', ''], sign: '<=', rhs: '' }
        ]
    });

    const [results, setResults] = useState<AppStateResult | null>(null);

    const updateProblemData = (updater: (prev: ProblemData) => ProblemData) => {
        setProblemData(updater);
    };

    const resetProject = () => {
        setVariables([
            { id: 1, name: 'x1', description: '' },
            { id: 2, name: 'x2', description: '' }
        ]);
        setProblemData({
            type: 'MAX',
            objective: ['', ''],
            constraints: [
                { coeffs: ['', ''], sign: '<=', rhs: '' },
                { coeffs: ['', ''], sign: '<=', rhs: '' }
            ]
        });
        setResults(null);
    };

    return (
        <ProjectContext.Provider value={{
            variables,
            setVariables,
            problemData,
            setProblemData,
            updateProblemData,
            results,
            setResults,
            resetProject
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}
