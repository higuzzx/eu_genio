/**
 * Solves a system of linear equations Ax = b using Gaussian Elimination.
 */
export class LinearSolver {
    public static solve(matrix: number[][], rhs: number[]): number[] {
        const n = matrix.length;
        // Create augmented matrix [A|b]
        const M = matrix.map((row, i) => [...row, rhs[i]]);

        // Forward Elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
                    maxRow = k;
                }
            }

            // Swap rows
            [M[i], M[maxRow]] = [M[maxRow], M[i]];

            // Check singular
            if (Math.abs(M[i][i]) < 1e-10) {
                throw new Error("Sistema Singular ou Mal Condicionado (Sem solução única).");
            }

            // Eliminate
            for (let k = i + 1; k < n; k++) {
                const factor = M[k][i] / M[i][i];
                for (let j = i; j <= n; j++) {
                    M[k][j] -= factor * M[i][j];
                }
            }
        }

        // Back Substitution
        const x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) {
                sum += M[i][j] * x[j];
            }
            x[i] = (M[i][n] - sum) / M[i][i];
        }

        return x;
    }
}
