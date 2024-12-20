import * as Util from '../core/Util';
import DiagonalMovement from '../core/DiagonalMovement';

/**
 * Bi-directional Breadth-First-Search path finder.
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed. Deprecated, use diagonalMovement instead.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners. Deprecated, use diagonalMovement instead.
 * @param {DiagonalMovement} opt.diagonalMovement Allowed diagonal movement.
 */
class BiBreadthFirstFinder {
    public allowDiagonal: any;
    public dontCrossCorners: any;
    public diagonalMovement: any;

    constructor(opt: any) {
        opt = opt || {};
        this.allowDiagonal = opt.allowDiagonal;
        this.dontCrossCorners = opt.dontCrossCorners;
        this.diagonalMovement = opt.diagonalMovement;

        if (!this.diagonalMovement) {
            if (!this.allowDiagonal) {
                this.diagonalMovement = DiagonalMovement.Never;
            } else {
                if (this.dontCrossCorners) {
                    this.diagonalMovement = DiagonalMovement.OnlyWhenNoObstacles;
                } else {
                    this.diagonalMovement = DiagonalMovement.IfAtMostOneObstacle;
                }
            }
        }
    }

    /**
     * Find and return the the path.
     * @return {Array.<[number, number]>} The path, including both start and
     *     end positions.
     */
    findPath(startX: any, startY: any, endX: any, endY: any, grid: any): [number, number][] {
        const startNode = grid.getNodeAt(startX, startY);
        const endNode = grid.getNodeAt(endX, endY);
        const startOpenList = [];
        const endOpenList = [];
        let neighbors;
        let neighbor;
        let node;
        const diagonalMovement = this.diagonalMovement;
        const BY_START = 0;
        const BY_END = 1;
        let i;
        let l;

        // push the start and end nodes into the queues
        startOpenList.push(startNode);
        startNode.opened = true;
        startNode.by = BY_START;

        endOpenList.push(endNode);
        endNode.opened = true;
        endNode.by = BY_END;

        // while both the queues are not empty
        while (startOpenList.length && endOpenList.length) {

            // expand start open list

            node = startOpenList.shift();
            node.closed = true;

            neighbors = grid.getNeighbors(node, diagonalMovement);
            for (i = 0, l = neighbors.length; i < l; ++i) {
                neighbor = neighbors[i];

                if (neighbor.closed) {
                    continue;
                }
                if (neighbor.opened) {
                    // if this node has been inspected by the reversed search,
                    // then a path is found.
                    if (neighbor.by === BY_END) {
                        return Util.biBacktrace(node, neighbor);
                    }
                    continue;
                }
                startOpenList.push(neighbor);
                neighbor.parent = node;
                neighbor.opened = true;
                neighbor.by = BY_START;
            }

            // expand end open list

            node = endOpenList.shift();
            node.closed = true;

            neighbors = grid.getNeighbors(node, diagonalMovement);
            for (i = 0, l = neighbors.length; i < l; ++i) {
                neighbor = neighbors[i];

                if (neighbor.closed) {
                    continue;
                }
                if (neighbor.opened) {
                    if (neighbor.by === BY_START) {
                        return Util.biBacktrace(neighbor, node);
                    }
                    continue;
                }
                endOpenList.push(neighbor);
                neighbor.parent = node;
                neighbor.opened = true;
                neighbor.by = BY_END;
            }
        }

        // fail to find the path
        return [];
    }
}

export default BiBreadthFirstFinder;
