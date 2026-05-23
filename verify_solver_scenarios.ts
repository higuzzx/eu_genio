
import { SimplexSolver, Constraint } from './src/models/SimplexSolver';

function runTest(name: string, fn: () => void) {
    console.log(`\n--- Running Test: ${name} ---`);
    try {
        fn();
        console.log(`[PASS] ${name}`);
    } catch (e: any) {
        console.error(`[FAIL] ${name}: ${e.message}`);
    }
}

// Scenario 1: Integer Programming
// Max Z = 3x1 + 4x2
// s.t.
// 2x1 + x2 <= 6
// 2x1 + 3x2 <= 9
// x1, x2 >= 0, Integer
// Relaxed Opt: x1=2.25, x2=1.5, Z=12.75
// Integer Opt: x1=0, x2=3, Z=12 (or potentially others, but Z=12 is target)
runTest('Integer Programming (Branch and Bound)', () => {
    const objective = [3, 4];
    const constraints: Constraint[] = [
        { coeffs: [2, 1], sign: '<=', rhs: 6 },
        { coeffs: [2, 3], sign: '<=', rhs: 9 }
    ];
    const variableNames = ['x1', 'x2'];
    const solver = new SimplexSolver('MAX', variableNames, objective, constraints);

    console.log("Solving Relaxed LP...");
    const relaxed = solver.solve();
    console.log(`Relaxed Z: ${relaxed.zValue}`);

    console.log("Solving Integer LP...");
    const integerResult = solver.solveInteger();

    if (!integerResult) throw new Error("No integer solution found");

    console.log(`Integer Z: ${integerResult.zValue}`);
    integerResult.variables.forEach(v => console.log(`${v.name}: ${v.value}`));

    if (Math.abs(integerResult.zValue - 12) > 1e-5) {
        throw new Error(`Expected Z=12, got ${integerResult.zValue}`);
    }

    const x1 = integerResult.variables.find(v => v.name === 'x1')?.value || 0;
    const x2 = integerResult.variables.find(v => v.name === 'x2')?.value || 0;

    if (Math.abs(x1 - Math.round(x1)) > 1e-5 || Math.abs(x2 - Math.round(x2)) > 1e-5) {
        throw new Error("Variables are not integers");
    }
});

// Scenario 2: Multiple Solutions
// Max Z = 2x1 + 4x2
// s.t.
// x1 + 2x2 <= 5
// x1 <= 4
// x1, x2 >= 0
// Objective parallel to x1 + 2x2 <= 5.
// Optima at (0, 2.5) -> Z=10 and (5, 0) is infeasible due to x1<=4?
// Wait. x1 + 2x2 <= 5.
// If x2=0, x1<=5. But x1<=4 constraint limits it.
// So vertices:
// 1. x1=0, 2x2=5 => x2=2.5. Z = 2(0) + 4(2.5) = 10.
// 2. x1=4. 4 + 2x2 <= 5 => 2x2 <= 1 => x2 <= 0.5.
//    Point (4, 0.5). Z = 2(4) + 4(0.5) = 8 + 2 = 10.
// So multiple solutions exist between (0, 2.5) and (4, 0.5).
runTest('Multiple Solutions Detection', () => {
    const objective = [2, 4];
    const constraints: Constraint[] = [
        { coeffs: [1, 2], sign: '<=', rhs: 5 },
        { coeffs: [1, 0], sign: '<=', rhs: 4 }
    ];
    const variableNames = ['x1', 'x2'];
    const solver = new SimplexSolver('MAX', variableNames, objective, constraints);

    const result = solver.solve();
    console.log(`Z Value: ${result.zValue}`);
    console.log(`Multiple Solutions Detected: ${result.multipleSolutions}`);

    if (!result.multipleSolutions) {
        throw new Error("Failed to detect multiple solutions");
    }

    if (result.alternativeSolutions && result.alternativeSolutions.length > 0) {
        console.log("Alternative Solution Found:");
        result.alternativeSolutions[0].forEach(v => console.log(`${v.name}: ${v.value}`));
    } else {
        console.log("No alternative solution explicitly calculated (this is optional but good to have)");
    }
});

// Scenario 3: Dual Formulation
// Max Z = 3x1 + 5x2
// s.t.
// x1 <= 4
// 2x2 <= 12
// 3x1 + 2x2 <= 18
// Dual should be Min W = 4y1 + 12y2 + 18y3
// s.t.
// y1 + 3y3 >= 3
// 2y2 + 2y3 >= 5
// y1, y2, y3 >= 0
runTest('Dual Formulation', () => {
    const objective = [3, 5];
    const constraints: Constraint[] = [
        { coeffs: [1, 0], sign: '<=', rhs: 4 },
        { coeffs: [0, 2], sign: '<=', rhs: 12 },
        { coeffs: [3, 2], sign: '<=', rhs: 18 }
    ];
    const variableNames = ['x1', 'x2'];
    const solver = new SimplexSolver('MAX', variableNames, objective, constraints);

    const dual = solver.getDual();
    console.log("Dual Type:", dual.type);
    console.log("Dual Variables:", dual.variables.map((v: any) => `${v.name} (${v.sign})`).join(', '));
    console.log("Dual Constraints:", dual.constraints.length);

    if (dual.type !== 'MIN') throw new Error("Dual type should be MIN");
    if (dual.variables.length !== 3) throw new Error("Should have 3 dual variables");
    if (dual.constraints.length !== 2) throw new Error("Should have 2 dual constraints");
});

// Scenario 4: Integer Graphing Data
runTest('Integer Graphing Data', () => {
    const objective = [3, 4];
    const constraints: Constraint[] = [
        { coeffs: [2, 1], sign: '<=', rhs: 6 },
        { coeffs: [2, 3], sign: '<=', rhs: 9 }
    ];
    const variableNames = ['x1', 'x2'];
    const solver = new SimplexSolver('MAX', variableNames, objective, constraints);

    const integerResult = solver.solveInteger();

    if (!integerResult) throw new Error("No integer solution found");
    if (!integerResult.graphData) throw new Error("Graph data missing");
    if (!integerResult.graphData.integerOptimalPoint) throw new Error("Integer Optimal Point missing from graph data");

    console.log("Integer Optimal Point in Graph:", integerResult.graphData.integerOptimalPoint);
});
