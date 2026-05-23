import { Variable } from './Variable';

export interface BranchNode {
    id: number;
    parentId: number | null;
    depth: number;
    branchVar?: string;
    branchDir?: '<=' | '>=';
    branchVal?: number;
    status: 'infeasible' | 'pruned' | 'integer' | 'branched';
    zValue?: number;
    varValues?: { name: string; value: number }[];
}

export interface SimplexResult {
    zValue: number;
    variables: Variable[];
    shadowPrices?: number[];
    iterations?: any[];
    status?: string;
    isMock?: boolean;
    colHeaders?: string[];
    graphData: {
        feasibleRegion: { x: number, y: number }[];
        constraints: { name: string, points: { x: number, y: number }[], color: string, equation?: string }[];
        objectiveLine?: { name: string, points: { x: number, y: number }[], color: string, equation?: string };
        optimalPoint: { x: number, y: number, value: number };
        integerOptimalPoint?: { x: number, y: number, value: number };
    } | null;
    multipleSolutions?: boolean;
    alternativeSolutions?: Variable[][];
}
