import { ParsedProblem } from '../models/ParsedProblem';
import { SimplexSolver } from '../models/SimplexSolver';
import { SimplexResult } from '../models/SimplexResult';
import { ProblemData } from '../models/ProblemData';
import { Variable } from '../models/Variable';

export class ProjectController {

    public static parseFile(content: string): ParsedProblem {
        // We will implement the parsing logic here or call a helper
        // For MVC purity, let's move the logic from file_parser.ts here or to a private method
        return this.parseToraFile(content);
    }

    public static solve(problemData: ProblemData, variables: Variable[]): SimplexResult {
        const variableNames = variables.map(v => v.name);
        const objective = problemData.objective.map(Number);
        const constraints = problemData.constraints.map(c => ({
            coeffs: c.coeffs.map(Number),
            sign: c.sign as any,
            rhs: Number(c.rhs)
        }));

        const solver = new SimplexSolver(
            problemData.type,
            variableNames,
            objective,
            constraints
        );

        return solver.solve();
    }

    private static parseToraFile(content: string): ParsedProblem {
        // Logic from file_parser.ts
        const tokens = content
            .split(/\r?\n/)
            .map(line => line.trim().replace(/^"|"$/g, ''))
            .filter(line => line !== '' && line !== '""');

        let current = 0;
        const next = () => {
            if (current >= tokens.length) return null;
            return tokens[current++];
        };

        next(); // 3000
        next(); // 5
        next(); // 2
        next(); // 1

        const title = next() || "Sem Título";
        const numVarsStr = next();
        const numConstraintsStr = next();
        const typeStr = next();

        if (!numVarsStr || !numConstraintsStr || !typeStr) {
            throw new Error("Formato de arquivo inválido (cabeçalho incompleto).");
        }

        const numVars = parseInt(numVarsStr);
        const numConstraints = parseInt(numConstraintsStr);
        const type = typeStr.toLowerCase().includes('min') ? 'MIN' : 'MAX';

        const objective: number[] = [];
        for (let i = 0; i < numVars; i++) {
            const val = next();
            if (!val) throw new Error("Coeficiente da função objetivo faltando.");
            objective.push(parseFloat(val.replace(',', '.')));
        }

        const constraints = [];
        for (let i = 0; i < numConstraints; i++) {
            const coeffs: number[] = [];
            for (let j = 0; j < numVars; j++) {
                const val = next();
                if (!val) throw new Error(`Coeficiente da restrição ${i + 1} faltando.`);
                coeffs.push(parseFloat(val.replace(',', '.')));
            }

            const signToken = next();
            const rhsToken = next();

            if (!signToken || !rhsToken) throw new Error(`Sinal ou RHS da restrição ${i + 1} faltando.`);

            let sign: '<=' | '>=' | '=' = '<=';
            if (signToken.includes('<')) sign = '<=';
            else if (signToken.includes('>')) sign = '>=';
            else if (signToken.includes('=')) sign = '=';

            const rhs = parseFloat(rhsToken.replace(',', '.'));

            constraints.push({ coeffs, sign, rhs });
        }

        return {
            title,
            type,
            numVars,
            numConstraints,
            objective,
            constraints
        };
    }
}
