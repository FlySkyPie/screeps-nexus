import Heap from 'heap';

import * as Util from '../core/Util';
import Heuristic from '../core/Heuristic';
import DiagonalMovement from '../core/DiagonalMovement';

/**
 * A* path-finder.
 * based upon https://github.com/bgrins/javascript-astar
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed. Deprecated, use diagonalMovement instead.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners. Deprecated, use diagonalMovement instead.
 * @param {DiagonalMovement} opt.diagonalMovement Allowed diagonal movement.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 * @param {integer} opt.weight Weight to apply to the heuristic to allow for suboptimal paths, 
 *     in order to speed up the search.
 */
class BiAStarFinder {
    public allowDiagonal: any;
    public dontCrossCorners: any;
    public diagonalMovement: any;
    public heuristic: any;
    public weight: any;

    constructor(opt: any) {
        opt = opt || {};
        this.allowDiagonal = opt.allowDiagonal;
        this.dontCrossCorners = opt.dontCrossCorners;
        this.diagonalMovement = opt.diagonalMovement;
        this.heuristic = opt.heuristic || Heuristic.manhattan;
        this.weight = opt.weight || 1;

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

        //When diagonal movement is allowed the manhattan heuristic is not admissible
        //It should be octile instead
        if (this.diagonalMovement === DiagonalMovement.Never) {
            this.heuristic = opt.heuristic || Heuristic.manhattan;
        } else {
            this.heuristic = opt.heuristic || Heuristic.octile;
        }
    }

    /**
     * Find and return the the path.
     * @return {Array.<[number, number]>} The path, including both start and
     *     end positions.
     */
    findPath(startX: any, startY: any, endX: any, endY: any, grid: any): [number, number][] {
        const cmp = (nodeA: any, nodeB: any) => {
            return nodeA.f - nodeB.f;
        };

        const startOpenList = new Heap(cmp);
        const endOpenList = new Heap(cmp);
        const startNode = grid.getNodeAt(startX, startY);
        const endNode = grid.getNodeAt(endX, endY);
        const heuristic = this.heuristic;
        const diagonalMovement = this.diagonalMovement;
        const weight = this.weight;
        const abs = Math.abs;
        const SQRT2 = Math.SQRT2;
        let node;
        let neighbors;
        let neighbor;
        let i;
        let l;
        let x;
        let y;
        let ng;
        const BY_START = 1;
        const BY_END = 2;

        // set the `g` and `f` value of the start node to be 0
        // and push it into the start open list
        startNode.g = 0;
        startNode.f = 0;
        startOpenList.push(startNode);
        startNode.opened = BY_START;

        // set the `g` and `f` value of the end node to be 0
        // and push it into the open open list
        endNode.g = 0;
        endNode.f = 0;
        endOpenList.push(endNode);
        endNode.opened = BY_END;

        // while both the open lists are not empty
        while (!startOpenList.empty() && !endOpenList.empty()) {

            // pop the position of start node which has the minimum `f` value.
            node = startOpenList.pop();
            node.closed = true;

            // get neigbours of the current node
            neighbors = grid.getNeighbors(node, diagonalMovement);
            for (i = 0, l = neighbors.length; i < l; ++i) {
                neighbor = neighbors[i];

                if (neighbor.closed) {
                    continue;
                }
                if (neighbor.opened === BY_END) {
                    return Util.biBacktrace(node, neighbor);
                }

                x = neighbor.x;
                y = neighbor.y;

                // get the distance between current node and the neighbor
                // and calculate the next g score
                ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);

                // check if the neighbor has not been inspected yet, or
                // can be reached with smaller cost from the current node
                if (!neighbor.opened || ng < neighbor.g) {
                    neighbor.g = ng;
                    neighbor.h = neighbor.h || weight * heuristic(abs(x - endX), abs(y - endY));
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = node;

                    if (!neighbor.opened) {
                        startOpenList.push(neighbor);
                        neighbor.opened = BY_START;
                    } else {
                        // the neighbor can be reached with smaller cost.
                        // Since its f value has been updated, we have to
                        // update its position in the open list
                        startOpenList.updateItem(neighbor);
                    }
                }
            } // end for each neighbor


            // pop the position of end node which has the minimum `f` value.
            node = endOpenList.pop();
            node.closed = true;

            // get neigbours of the current node
            neighbors = grid.getNeighbors(node, diagonalMovement);
            for (i = 0, l = neighbors.length; i < l; ++i) {
                neighbor = neighbors[i];

                if (neighbor.closed) {
                    continue;
                }
                if (neighbor.opened === BY_START) {
                    return Util.biBacktrace(neighbor, node);
                }

                x = neighbor.x;
                y = neighbor.y;

                // get the distance between current node and the neighbor
                // and calculate the next g score
                ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);

                // check if the neighbor has not been inspected yet, or
                // can be reached with smaller cost from the current node
                if (!neighbor.opened || ng < neighbor.g) {
                    neighbor.g = ng;
                    neighbor.h = neighbor.h || weight * heuristic(abs(x - startX), abs(y - startY));
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = node;

                    if (!neighbor.opened) {
                        endOpenList.push(neighbor);
                        neighbor.opened = BY_END;
                    } else {
                        // the neighbor can be reached with smaller cost.
                        // Since its f value has been updated, we have to
                        // update its position in the open list
                        endOpenList.updateItem(neighbor);
                    }
                }
            } // end for each neighbor
        } // end while not open list empty

        // fail to find the path
        return [];
    }
}

export default BiAStarFinder;
