import { NextResponse } from 'next/server';
import { SimplexSolver, OptimizationType, Constraint, ConstraintSign } from '@/models/SimplexSolver';

interface SolveRequest {
    optimizationType: 'maximizar' | 'minimizar';
    variables: string[];
    objectiveFunction: number[];
    constraints: { coeffs: number[]; sign: ConstraintSign; value: number }[];
}

export async function POST(request: Request) {
    try {
        const body: SolveRequest = await request.json();
        const { optimizationType, variables, objectiveFunction, constraints } = body;

        // Validate input
        if (!variables || !objectiveFunction || !constraints) {
            return NextResponse.json(
                { error: 'Dados incompletos para a otimização.' },
                { status: 400 }
            );
        }

        // Map input to Solver types
        const type: OptimizationType = optimizationType === 'minimizar' ? 'MIN' : 'MAX';

        // Ensure constraints are properly formatted
        const formattedConstraints: Constraint[] = constraints.map(c => ({
            coeffs: c.coeffs,
            sign: c.sign,
            rhs: c.value
        }));

        const solver = new SimplexSolver(
            type,
            variables,
            objectiveFunction,
            formattedConstraints
        );

        const result = solver.solve();

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Erro na otimização:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno no servidor.' },
            { status: 500 }
        );
    }
}
