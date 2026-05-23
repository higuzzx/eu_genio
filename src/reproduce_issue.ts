
import { SimplexSolver, Constraint } from './models/SimplexSolver';

// Problem from the user's image (Image 2)
// Max Z = 3x + 2y (Dummy objective)
// s.t.
// x + y <= 200
// x <= 150
// y <= 120
// x, y >= 0

const constraints: Constraint[] = [
    { coeffs: [1, 1], sign: '<=', rhs: 200 },
    { coeffs: [1, 0], sign: '<=', rhs: 150 },
    { coeffs: [0, 1], sign: '<=', rhs: 120 }
];

const objective = [3, 2];
const variableNames = ['x', 'y'];

const solver = new SimplexSolver('MAX', variableNames, objective, constraints);
const result = solver.solve();

console.log('--- Graph Data ---');
if (result.graphData) {
    console.log('Feasible Region Vertices:');
    result.graphData.feasibleRegion.forEach((p, i) => {
        console.log(`  P${i}: (${p.x}, ${p.y})`);
    });

    console.log('\nConstraint Lines:');
    result.graphData.constraints.forEach(c => {
        console.log(`  ${c.name}:`);
        c.points.forEach((p: any) => console.log(`    (${p.x}, ${p.y})`));
    });

    console.log('\nOptimal Point:');
    console.log(`  (${result.graphData.optimalPoint.x}, ${result.graphData.optimalPoint.y})`);
} else {
    console.log('No graph data generated.');
}
