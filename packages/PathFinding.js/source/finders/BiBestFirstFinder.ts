import BiAStarFinder from './BiAStarFinder';

/**
 * Bi-direcitional Best-First-Search path-finder.
 * @constructor
 * @extends BiAStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed. Deprecated, use diagonalMovement instead.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners. Deprecated, use diagonalMovement instead.
 * @param {DiagonalMovement} opt.diagonalMovement Allowed diagonal movement.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 */
class BiBestFirstFinder extends BiAStarFinder {
    constructor(opt: any) {
        super(opt);

        const orig = this.heuristic;
        this.heuristic = (dx: any, dy: any) => {
            return orig(dx, dy) * 1000000;
        };
    }
}

export default BiBestFirstFinder;
