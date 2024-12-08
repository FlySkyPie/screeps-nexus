import BiAStarFinder from './BiAStarFinder';

/**
 * Bi-directional Dijkstra path-finder.
 * @constructor
 * @extends BiAStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed. Deprecated, use diagonalMovement instead.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners. Deprecated, use diagonalMovement instead.
 * @param {DiagonalMovement} opt.diagonalMovement Allowed diagonal movement.
 */
class BiDijkstraFinder extends BiAStarFinder {
    constructor(opt: any) {
        super(opt);
        this.heuristic = (_dx: any, _dy: any) => {
            return 0;
        };
    }
}

export default BiDijkstraFinder;
