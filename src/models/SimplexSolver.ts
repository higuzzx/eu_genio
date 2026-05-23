import { Variable } from './Variable';
import { SimplexResult } from './SimplexResult';

export type OptimizationType = 'MAX' | 'MIN';
export type ConstraintSign = '<=' | '>=' | '=';

export interface Constraint {
  coeffs: number[];
  sign: ConstraintSign;
  rhs: number;
}

export interface Iteration {
  id: number;
  base: string[];
  zRow: number[];
  rows: number[][];
  pivotRow?: number;
  pivotCol?: number;
  enteringVar?: string;
  leavingVar?: string;
}

export class SimplexSolver {
  private type: OptimizationType;
  private numVars: number;
  private originalObjective: number[];
  private constraints: Constraint[];
  private variableNames: string[];

  // Internal state for Tableau
  private tableau: number[][] = [];
  private basicVars: number[] = []; // Indices of basic variables
  private nonBasicVars: number[] = []; // Indices of non-basic variables
  private colHeaders: string[] = [];
  private iterations: Iteration[] = [];
  private M = 100000; // Big M value

  constructor(
    type: OptimizationType,
    variableNames: string[],
    objective: number[],
    constraints: Constraint[]
  ) {
    this.type = type;
    this.variableNames = variableNames;
    this.numVars = variableNames.length;
    this.originalObjective = objective;
    this.constraints = constraints;
  }

  public solve(): SimplexResult {
    // 1. Convert to Standard Form
    this.initializeTableau();

    // 2. Solve
    let status = 'Otimizado';
    try {
      this.runSimplexIterations();
    } catch (e: any) {
      status = e.message;
    }

    // Check for Infeasibility (Artificial Variables in Basis > 0)
    if (status === 'Otimizado') {
      const artificialIndices = this.colHeaders
        .map((h, i) => h.startsWith('A') ? i : -1)
        .filter(i => i !== -1);

      if (artificialIndices.length > 0) {
        const hasPositiveArtificial = artificialIndices.some(aIdx => {
          const rowIdx = this.basicVars.indexOf(aIdx);
          if (rowIdx !== -1) {
            const val = this.tableau[rowIdx][this.tableau[0].length - 1];
            return val > 1e-5;
          }
          return false;
        });

        if (hasPositiveArtificial) {
          status = 'Inviável';
        }
      }
    }

    // 3. Extract Results
    const zValue = this.getZValue();
    const variables = this.getVariableValues();
    const shadowPrices = this.getShadowPrices();

    // Check for Multiple Solutions
    let multipleSolutions = false;
    let alternativeSolutions: Variable[][] | undefined = undefined;

    if (status === 'Otimizado') {
      const zRow = this.tableau[this.tableau.length - 1];
      // Check non-basic variables with 0 reduced cost
      const nonBasicZeroReducedCost = this.colHeaders.map((header, colIdx) => {
        // Skip basic variables
        if (this.basicVars.includes(colIdx)) return -1;
        // Skip RHS
        if (colIdx === this.tableau[0].length - 1) return -1;
        // Check reduced cost (tolerance 1e-5)
        if (Math.abs(zRow[colIdx]) < 1e-5) return colIdx;
        return -1;
      }).filter(idx => idx !== -1);

      if (nonBasicZeroReducedCost.length > 0) {
        multipleSolutions = true;
        // Calculate alternative solution by pivoting on the first candidate
        try {
          const altSolver = this.clone();
          const enteringCol = nonBasicZeroReducedCost[0];
          // Find leaving row
          let leavingRow = -1;
          let minRatio = Infinity;
          for (let i = 0; i < altSolver.tableau.length - 1; i++) {
            const rhs = altSolver.tableau[i][altSolver.tableau[0].length - 1];
            const coeff = altSolver.tableau[i][enteringCol];
            if (coeff > 1e-5) {
              const ratio = rhs / coeff;
              if (ratio < minRatio) {
                minRatio = ratio;
                leavingRow = i;
              }
            }
          }
          if (leavingRow !== -1) {
            altSolver.pivot(leavingRow, enteringCol);
            altSolver.basicVars[leavingRow] = enteringCol;
            alternativeSolutions = [altSolver.getVariableValues()];
          }
        } catch (e) {
          console.warn("Failed to calculate alternative solution", e);
        }
      }
    }

    return {
      status,
      zValue,
      variables,
      shadowPrices,
      iterations: this.iterations,
      colHeaders: [...this.colHeaders],
      isMock: false,
      graphData: this.numVars === 2 ? this.getGraphData() : null,
      multipleSolutions,
      alternativeSolutions
    };
  }

  private clone(): SimplexSolver {
    const newSolver = new SimplexSolver(this.type, [...this.variableNames], [...this.originalObjective], this.constraints.map(c => ({ ...c, coeffs: [...c.coeffs] })));
    newSolver.tableau = this.tableau.map(row => [...row]);
    newSolver.basicVars = [...this.basicVars];
    newSolver.colHeaders = [...this.colHeaders];
    newSolver.iterations = [];
    return newSolver;
  }

  private initializeTableau() {
    // Standard Form Construction
    // Maximize Z = c*x
    // s.t. A*x = b, x >= 0

    // If MIN, convert to MAX: Min Z <=> Max -Z
    const objCoeffs = this.type === 'MIN'
      ? this.originalObjective.map(c => -c)
      : [...this.originalObjective];

    let numSlack = 0;
    let numSurplus = 0;
    let numArtificial = 0;

    // Count extra variables needed
    this.constraints.forEach(c => {
      if (c.sign === '<=') numSlack++;
      else if (c.sign === '>=') { numSurplus++; numArtificial++; }
      else if (c.sign === '=') numArtificial++;
    });

    const totalCols = this.numVars + numSlack + numSurplus + numArtificial + 1; // +1 for RHS

    this.colHeaders = [...this.variableNames];

    // Add Slack/Surplus/Artificial names
    let sCount = 1, aCount = 1;
    for (let i = 0; i < numSlack; i++) this.colHeaders.push(`S${sCount++}`);
    for (let i = 0; i < numSurplus; i++) this.colHeaders.push(`E${sCount++}`); // E for Excess/Surplus
    for (let i = 0; i < numArtificial; i++) this.colHeaders.push(`A${aCount++}`);

    // Initialize matrix with zeros
    const numRows = this.constraints.length + 1; // + Z row
    this.tableau = Array(numRows).fill(0).map(() => Array(totalCols).fill(0));
    this.basicVars = Array(this.constraints.length).fill(-1);

    let colIdx = this.numVars;
    let artificialIndices: number[] = [];

    // Fill constraints
    this.constraints.forEach((c, rIdx) => {
      // Decision variables
      for (let j = 0; j < this.numVars; j++) {
        this.tableau[rIdx][j] = c.coeffs[j];
      }

      // RHS
      this.tableau[rIdx][totalCols - 1] = c.rhs;

      // Slack / Surplus / Artificial
      if (c.sign === '<=') {
        this.tableau[rIdx][colIdx] = 1; // Slack
        this.basicVars[rIdx] = colIdx;
        colIdx++;
      } else if (c.sign === '>=') {
        this.tableau[rIdx][colIdx] = -1; // Surplus
        colIdx++;
        this.tableau[rIdx][colIdx] = 1; // Artificial
        this.basicVars[rIdx] = colIdx;
        artificialIndices.push(colIdx);
        colIdx++;
      } else if (c.sign === '=') {
        this.tableau[rIdx][colIdx] = 1; // Artificial
        this.basicVars[rIdx] = colIdx;
        artificialIndices.push(colIdx);
        colIdx++;
      }
    });

    // Fill Z Row (Last Row)
    // Z - c1x1 - c2x2 ... = 0
    // So coefficients are -c
    for (let j = 0; j < this.numVars; j++) {
      this.tableau[numRows - 1][j] = -objCoeffs[j];
    }

    // Big M Method for Artificial Variables
    if (artificialIndices.length > 0) {
      artificialIndices.forEach(aIdx => {
        // Add M to Z-row for artificial variable column
        // Max Z = cx - M*A  => Z - cx + M*A = 0. So coeff is +M.
        this.tableau[numRows - 1][aIdx] = this.M;

        // Eliminate M from basic columns
        const rowIdx = this.basicVars.indexOf(aIdx);
        if (rowIdx !== -1) {
          const pivotRow = this.tableau[rowIdx];
          const factor = this.M;
          for (let j = 0; j < totalCols; j++) {
            this.tableau[numRows - 1][j] -= factor * pivotRow[j];
          }
        }
      });
    }

    this.recordIteration();
  }

  private runSimplexIterations() {
    const maxIterations = 100;
    let iterCount = 0;

    while (iterCount < maxIterations) {
      // 1. Check Optimality
      const zRow = this.tableau[this.tableau.length - 1];
      let enteringCol = -1;
      let minVal = -1e-9; // Tolerance

      // Find most negative coefficient
      for (let j = 0; j < zRow.length - 1; j++) { // Exclude RHS
        if (zRow[j] < minVal) {
          minVal = zRow[j];
          enteringCol = j;
        }
      }

      if (enteringCol === -1) {
        break; // Optimal
      }

      // 2. Ratio Test (Find Leaving Variable)
      let leavingRow = -1;
      let minRatio = Infinity;

      for (let i = 0; i < this.tableau.length - 1; i++) { // Exclude Z row
        const rhs = this.tableau[i][this.tableau[0].length - 1];
        const coeff = this.tableau[i][enteringCol];

        if (coeff > 1e-9) {
          const ratio = rhs / coeff;
          if (ratio < minRatio) {
            minRatio = ratio;
            leavingRow = i;
          }
        }
      }

      if (leavingRow === -1) {
        throw new Error("Solução Ilimitada");
      }

      // 3. Pivot
      this.pivot(leavingRow, enteringCol);

      // Update Basic Vars
      this.basicVars[leavingRow] = enteringCol;

      this.recordIteration(enteringCol, leavingRow);
      iterCount++;
    }

    if (iterCount >= maxIterations) {
      throw new Error("Não convergiu (Max Iterações)");
    }
  }

  private pivot(pivotRowIdx: number, pivotColIdx: number) {
    const numRows = this.tableau.length;
    const numCols = this.tableau[0].length;

    const pivotElement = this.tableau[pivotRowIdx][pivotColIdx];

    // Normalize pivot row
    for (let j = 0; j < numCols; j++) {
      this.tableau[pivotRowIdx][j] /= pivotElement;
    }

    // Eliminate other rows
    for (let i = 0; i < numRows; i++) {
      if (i !== pivotRowIdx) {
        const factor = this.tableau[i][pivotColIdx];
        for (let j = 0; j < numCols; j++) {
          this.tableau[i][j] -= factor * this.tableau[pivotRowIdx][j];
        }
      }
    }
  }

  private recordIteration(enteringCol?: number, leavingRow?: number) {
    const zRow = [...this.tableau[this.tableau.length - 1]];
    const rows = this.tableau.slice(0, this.tableau.length - 1).map(row => [...row]);
    const base = this.basicVars.map(idx => this.colHeaders[idx]);
    let enteringVar = enteringCol !== undefined ? this.colHeaders[enteringCol] : undefined;
    let leavingVar = leavingRow !== undefined ? this.colHeaders[this.basicVars[leavingRow]] : undefined;

    this.iterations.push({
      id: this.iterations.length + 1,
      base,
      zRow,
      rows,
      pivotRow: leavingRow,
      pivotCol: enteringCol,
      enteringVar,
      leavingVar
    });
  }

  private getZValue(): number {
    let z = this.tableau[this.tableau.length - 1][this.tableau[0].length - 1];
    return this.type === 'MIN' ? -z : z;
  }

  private getVariableValues(): Variable[] {
    const values = this.variableNames.map((name, i) => {
      const rowIdx = this.basicVars.indexOf(i);
      if (rowIdx !== -1) {
        return {
          id: i + 1,
          name,
          description: '',
          value: this.tableau[rowIdx][this.tableau[0].length - 1]
        };
      }
      return { id: i + 1, name, description: '', value: 0 };
    });
    return values;
  }

  private getShadowPrices(): number[] {
    const shadowPrices: number[] = [];
    let colIdx = this.numVars;

    this.constraints.forEach(c => {
      if (c.sign === '<=') {
        let val = this.tableau[this.tableau.length - 1][colIdx];
        shadowPrices.push(this.type === 'MIN' ? -val : val);
        colIdx++;
      } else if (c.sign === '>=') {
        let val = this.tableau[this.tableau.length - 1][colIdx];
        shadowPrices.push(this.type === 'MIN' ? -val : -val);
        colIdx += 2;
      } else {
        let val = this.tableau[this.tableau.length - 1][colIdx];
        shadowPrices.push(this.type === 'MIN' ? -val : val);
        colIdx++;
      }
    });

    return shadowPrices;
  }

  private getGraphData() {
    if (this.numVars !== 2) return null;

    const lines = [
      ...this.constraints.map((c, i) => ({
        a: c.coeffs[0],
        b: c.coeffs[1],
        rhs: c.rhs,
        sign: c.sign,
        name: `R${i + 1}`,
        color: this.getConstraintColor(i),
        equation: `${c.coeffs[0]}x + ${c.coeffs[1]}y ${c.sign} ${c.rhs}`
      })),
      { a: 1, b: 0, rhs: 0, sign: '>=' as ConstraintSign, name: 'x >= 0', color: '#cbd5e1', equation: 'x >= 0' },
      { a: 0, b: 1, rhs: 0, sign: '>=' as ConstraintSign, name: 'y >= 0', color: '#cbd5e1', equation: 'y >= 0' }
    ];

    const points: { x: number, y: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const l1 = lines[i];
        const l2 = lines[j];
        const det = l1.a * l2.b - l1.b * l2.a;
        if (Math.abs(det) < 1e-10) continue;
        const x = (l1.rhs * l2.b - l1.b * l2.rhs) / det;
        const y = (l1.a * l2.rhs - l1.rhs * l2.a) / det;
        if (this.isFeasible(x, y)) {
          if (!points.some(p => Math.abs(p.x - x) < 0.001 && Math.abs(p.y - y) < 0.001)) {
            points.push({ x, y });
          }
        }
      }
    }

    if (points.length > 0) {
      const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
      const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
      points.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    }

    const optimalVars = this.getVariableValues();
    const optimalPoint = {
      x: optimalVars[0]?.value || 0,
      y: optimalVars[1]?.value || 0,
      value: this.getZValue()
    };

    const maxX = points.length > 0 ? Math.max(...points.map(p => p.x)) : 0;
    const maxY = points.length > 0 ? Math.max(...points.map(p => p.y)) : 0;
    const limitX = Math.max(maxX, optimalPoint.x, 10) * 1.5;
    const limitY = Math.max(maxY, optimalPoint.y, 10) * 1.5;
    const limit = Math.max(limitX, limitY);

    const constraintLines = this.constraints.map((c, i) => {
      const a = c.coeffs[0];
      const b = c.coeffs[1];
      const rhs = c.rhs;
      const linePoints: { x: number, y: number }[] = [];
      if (Math.abs(b) > 1e-10) {
        const y0 = rhs / b;
        if (y0 >= -1 && y0 <= limit * 1.5) linePoints.push({ x: 0, y: y0 });
        const yLimit = (rhs - a * limit) / b;
        if (yLimit >= -1 && yLimit <= limit * 1.5) linePoints.push({ x: limit, y: yLimit });
      }
      if (Math.abs(a) > 1e-10) {
        const x0 = rhs / a;
        if (x0 >= -1 && x0 <= limit * 1.5) linePoints.push({ x: x0, y: 0 });
        const xLimit = (rhs - b * limit) / a;
        if (xLimit >= -1 && xLimit <= limit * 1.5) linePoints.push({ x: xLimit, y: limit });
      }
      linePoints.sort((p1, p2) => p1.x - p2.x);
      return {
        name: `R${i + 1}`,
        points: linePoints,
        color: this.getConstraintColor(i),
        equation: `${Number(a).toFixed(2).replace(/\.00$/, '')}x + ${Number(b).toFixed(2).replace(/\.00$/, '')}y ${c.sign} ${Number(rhs).toFixed(2).replace(/\.00$/, '')}`
      };
    });

    const zVal = this.getZValue();
    const c1 = this.originalObjective[0];
    const c2 = this.originalObjective[1];
    const objLinePoints: { x: number, y: number }[] = [];
    if (Math.abs(c2) > 1e-10) {
      const y0 = zVal / c2;
      if (y0 >= -limit && y0 <= limit * 1.5) objLinePoints.push({ x: 0, y: y0 });
      const yLimit = (zVal - c1 * limit) / c2;
      if (yLimit >= -limit && yLimit <= limit * 1.5) objLinePoints.push({ x: limit, y: yLimit });
    }
    if (Math.abs(c1) > 1e-10) {
      const x0 = zVal / c1;
      if (x0 >= -limit && x0 <= limit * 1.5) objLinePoints.push({ x: x0, y: 0 });
      const xLimit = (zVal - c2 * limit) / c1;
      if (xLimit >= -limit && xLimit <= limit * 1.5) objLinePoints.push({ x: xLimit, y: limit });
    }
    objLinePoints.sort((p1, p2) => p1.x - p2.x);

    const objectiveLine = {
      name: 'Função Objetivo',
      points: objLinePoints,
      color: '#000000',
      equation: `${c1}x + ${c2}y = ${Number(zVal).toFixed(2)}`
    };

    return {
      feasibleRegion: points,
      constraints: constraintLines,
      objectiveLine,
      optimalPoint
    };
  }

  private isFeasible(x: number, y: number): boolean {
    const tol = 1e-5;
    if (x < -tol || y < -tol) return false;
    return this.constraints.every(c => {
      const val = c.coeffs[0] * x + c.coeffs[1] * y;
      if (c.sign === '<=') return val <= c.rhs + tol;
      if (c.sign === '>=') return val >= c.rhs - tol;
      if (c.sign === '=') return Math.abs(val - c.rhs) < tol;
      return true;
    });
  }

  private getConstraintColor(index: number): string {
    const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    return colors[index % colors.length];
  }

  // --- DUAL PROBLEM ---
  public getDual(): any {
    const dualType = this.type === 'MAX' ? 'MIN' : 'MAX';
    const numDualVars = this.constraints.length;
    const numDualConstraints = this.numVars;

    // Dual Variables (y1, y2...)
    const dualVariables = this.constraints.map((c, i) => {
      let sign = '>= 0';
      if (this.type === 'MAX') {
        if (c.sign === '<=') sign = '>= 0';
        else if (c.sign === '>=') sign = '<= 0';
        else sign = 'Livre';
      } else { // Primal MIN
        if (c.sign === '>=') sign = '>= 0';
        else if (c.sign === '<=') sign = '<= 0';
        else sign = 'Livre';
      }
      return { name: `y${i + 1}`, sign };
    });

    // Dual Constraints
    // Transpose A
    const dualConstraints = [];
    for (let j = 0; j < this.numVars; j++) {
      const coeffs = [];
      for (let i = 0; i < this.constraints.length; i++) {
        coeffs.push(this.constraints[i].coeffs[j]);
      }
      // RHS is Primal Objective Coeff
      const rhs = this.originalObjective[j];

      const sign = this.type === 'MAX' ? '>=' : '<=';

      dualConstraints.push({ coeffs, sign, rhs });
    }

    return {
      type: dualType,
      variables: dualVariables,
      constraints: dualConstraints,
      objective: this.constraints.map(c => c.rhs) // Dual Obj Coeffs are Primal RHS
    };
  }

  // --- INTEGER SOLUTION (Branch and Bound - DFS & Most Fractional) ---
  public solveInteger(): SimplexResult | null {
    // Stack for DFS (LIFO)
    const stack: { constraints: Constraint[], zBound: number }[] = [];
    stack.push({ constraints: this.constraints, zBound: Infinity });

    let bestIntegerSolution: SimplexResult | null = null;
    let bestIntegerZ = this.type === 'MAX' ? -Infinity : Infinity;
    const maxIterations = 5000;
    let iter = 0;

    while (stack.length > 0 && iter < maxIterations) {
      iter++;
      const current = stack.pop()!; // DFS: Pop from end

      // Solve relaxed problem
      const solver = new SimplexSolver(this.type, this.variableNames, this.originalObjective, current.constraints);
      let result;
      try {
        result = solver.solve();
      } catch (e) {
        continue; // Infeasible
      }

      if (result.status !== 'Otimizado') continue;

      // Pruning (Bounding)
      if (this.type === 'MAX' && result.zValue <= bestIntegerZ) continue;
      if (this.type === 'MIN' && result.zValue >= bestIntegerZ) continue;

      // Check Integer Feasibility
      const nonIntegerVars = result.variables.filter(v => {
        const val = v.value || 0;
        return Math.abs(val - Math.round(val)) > 1e-5;
      });

      if (nonIntegerVars.length === 0) {
        // Integer Solution Found
        // Update Best Known
        if (this.type === 'MAX' && result.zValue > bestIntegerZ) {
          bestIntegerZ = result.zValue;
          bestIntegerSolution = result;
        } else if (this.type === 'MIN' && result.zValue < bestIntegerZ) {
          bestIntegerZ = result.zValue;
          bestIntegerSolution = result;
        }
      } else {
        // Branching
        // Rule: Most Fractional Variable (closest to 0.5)
        let branchVar = nonIntegerVars[0];
        let maxFrac = -1;

        nonIntegerVars.forEach(v => {
          const val = v.value || 0;
          const frac = Math.abs(val - Math.round(val));
          if (frac > maxFrac) {
            maxFrac = frac;
            branchVar = v;
          }
        });

        const val = branchVar.value || 0;
        const varIndex = branchVar.id - 1;
        const floorVal = Math.floor(val);
        const ceilVal = Math.ceil(val);

        // Create branches
        // Branch 1: x <= floor
        const c1: Constraint = {
          coeffs: Array(this.numVars).fill(0),
          sign: '<=',
          rhs: floorVal
        };
        c1.coeffs[varIndex] = 1;

        // Branch 2: x >= ceil
        const c2: Constraint = {
          coeffs: Array(this.numVars).fill(0),
          sign: '>=',
          rhs: ceilVal
        };
        c2.coeffs[varIndex] = 1;

        stack.push({ constraints: [...current.constraints, c1], zBound: result.zValue });
        stack.push({ constraints: [...current.constraints, c2], zBound: result.zValue });
      }
    }

    // If we have a graph (2 vars), we should add the integer point to it for visualization
    if (bestIntegerSolution && bestIntegerSolution.graphData && this.numVars === 2) {
      const intVars = bestIntegerSolution.variables;
      bestIntegerSolution.graphData.integerOptimalPoint = {
        x: intVars[0]?.value || 0,
        y: intVars[1]?.value || 0,
        value: bestIntegerSolution.zValue
      };
    }

    return bestIntegerSolution;
  }

  // --- BRANCH AND BOUND WITH TREE ---
  public solveIntegerWithTree(): { result: SimplexResult | null; nodes: import('./SimplexResult').BranchNode[] } {
    const nodes: import('./SimplexResult').BranchNode[] = [];
    let nodeId = 0;

    type StackItem = {
      constraints: Constraint[];
      parentId: number | null;
      depth: number;
      branchVar?: string;
      branchDir?: '<=' | '>=';
      branchVal?: number;
    };

    const stack: StackItem[] = [
      { constraints: this.constraints, parentId: null, depth: 0 }
    ];

    let bestResult: SimplexResult | null = null;
    let bestZ = this.type === 'MAX' ? -Infinity : Infinity;
    const MAX_NODES = 200;

    while (stack.length > 0 && nodes.length < MAX_NODES) {
      const current = stack.pop()!;
      const id = nodeId++;

      const solver = new SimplexSolver(
        this.type, this.variableNames, this.originalObjective, current.constraints
      );
      let result: SimplexResult;
      try {
        result = solver.solve();
      } catch {
        nodes.push({ id, parentId: current.parentId, depth: current.depth, branchVar: current.branchVar, branchDir: current.branchDir, branchVal: current.branchVal, status: 'infeasible' });
        continue;
      }

      if (result.status !== 'Otimizado') {
        nodes.push({ id, parentId: current.parentId, depth: current.depth, branchVar: current.branchVar, branchDir: current.branchDir, branchVal: current.branchVal, status: 'infeasible' });
        continue;
      }

      const isBetter = this.type === 'MAX' ? result.zValue > bestZ : result.zValue < bestZ;
      if (!isBetter && bestResult !== null) {
        nodes.push({ id, parentId: current.parentId, depth: current.depth, branchVar: current.branchVar, branchDir: current.branchDir, branchVal: current.branchVal, status: 'pruned', zValue: result.zValue });
        continue;
      }

      const fracVars = result.variables.filter(v => Math.abs((v.value ?? 0) - Math.round(v.value ?? 0)) > 1e-5);

      const nodeVarValues = result.variables.map(v => ({ name: v.name, value: v.value ?? 0 }));

      if (fracVars.length === 0) {
        bestZ = result.zValue;
        bestResult = result;
        nodes.push({ id, parentId: current.parentId, depth: current.depth, branchVar: current.branchVar, branchDir: current.branchDir, branchVal: current.branchVal, status: 'integer', zValue: result.zValue, varValues: nodeVarValues });
      } else {
        nodes.push({ id, parentId: current.parentId, depth: current.depth, branchVar: current.branchVar, branchDir: current.branchDir, branchVal: current.branchVal, status: 'branched', zValue: result.zValue, varValues: nodeVarValues });

        let pick = fracVars[0];
        fracVars.forEach(v => {
          const f = Math.abs((v.value ?? 0) - Math.round(v.value ?? 0));
          if (f > Math.abs((pick.value ?? 0) - Math.round(pick.value ?? 0))) pick = v;
        });

        const val = pick.value ?? 0;
        const vi = pick.id - 1;
        const lo = Math.floor(val);
        const hi = Math.ceil(val);

        const cLo: Constraint = { coeffs: Array(this.numVars).fill(0), sign: '<=', rhs: lo };
        cLo.coeffs[vi] = 1;
        const cHi: Constraint = { coeffs: Array(this.numVars).fill(0), sign: '>=', rhs: hi };
        cHi.coeffs[vi] = 1;

        stack.push({ constraints: [...current.constraints, cLo], parentId: id, depth: current.depth + 1, branchVar: pick.name, branchDir: '<=', branchVal: lo });
        stack.push({ constraints: [...current.constraints, cHi], parentId: id, depth: current.depth + 1, branchVar: pick.name, branchDir: '>=', branchVal: hi });
      }
    }

    if (bestResult?.graphData && this.numVars === 2) {
      bestResult.graphData.integerOptimalPoint = {
        x: bestResult.variables[0]?.value ?? 0,
        y: bestResult.variables[1]?.value ?? 0,
        value: bestResult.zValue
      };
    }

    return { result: bestResult, nodes };
  }
}