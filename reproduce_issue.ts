
import { SimplexSolver, Constraint } from './src/models/SimplexSolver';

// Case from Image 1 (Estimated)
// R1: 2.75x + y <= 24.75 (Passes through ~ (9,0) and (5, 11))
// Let's use: 11x + 4y <= 99
// x=9, y=0 -> 99 <= 99 (OK)
// x=5, y=11 -> 55 + 44 = 99 (OK)
// x=0, y=24.75 -> 99 <= 99 (OK)

const constraints: Constraint[] = [
    { coeffs: [11, 4], sign: '<=', rhs: 99 }
];

const objective = [1, 1];
const variableNames = ['x', 'y'];

const solver = new SimplexSolver('MAX', variableNames, objective, constraints);
const result = solver.solve();

console.log('--- Graph Data (Image 1 Case) ---');
if (result.graphData) {
    console.log('Feasible Region Vertices:');
    result.graphData.feasibleRegion.forEach((p, i) => {
        console.log(`  P${i}: (${p.x}, ${p.y})`);
    });

    console.log('\nConstraint Lines:');
    result.graphData.constraints.forEach(c => {
        console.log(`  ${c.name} (${c.equation}):`);
        c.points.forEach((p: any) => console.log(`    (${p.x}, ${p.y})`));
    });

    if (result.graphData.objectiveLine) {
        console.log(`\nObjective Line (${result.graphData.objectiveLine.equation}):`);
        result.graphData.objectiveLine.points.forEach((p: any) => console.log(`    (${p.x}, ${p.y})`));
    }
} else {
    console.log('No graph data generated.');
}
