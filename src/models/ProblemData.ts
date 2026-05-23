export interface ProblemData {
    type: 'MAX' | 'MIN';
    objective: string[];
    constraints: { coeffs: string[]; sign: string; rhs: string }[];
}
