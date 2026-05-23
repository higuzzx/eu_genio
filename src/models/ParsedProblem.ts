export interface ParsedProblem {
    title: string;
    type: 'MAX' | 'MIN';
    numVars: number;
    numConstraints: number;
    objective: number[];
    constraints: {
        coeffs: number[];
        sign: '<=' | '>=' | '=';
        rhs: number;
    }[];
}
