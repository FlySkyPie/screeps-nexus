/**
 * @author imor / https://github.com/imor
 */
import Heap from 'heap';

import * as Util from '../core/Util';
import Heuristic from '../core/Heuristic';

/**
 * Base class for the Jump Point Search algorithm
 * @param {object} opt
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 */
class JumpPointFinderBase {
    public heuristic: any;
    public trackJumpRecursion: any;
    public openList: any;
    public startNode: any;
    public endNode: any;
    public grid: any;
    public _findNeighbors: any;
    public _jump: any;

    constructor(opt: any) {
        opt = opt || {};
        this.heuristic = opt.heuristic || Heuristic.manhattan;
        this.trackJumpRecursion = opt.trackJumpRecursion || false;
    }

    /**
     * Find and return the path.
     * @return {Array.<[number, number]>} The path, including both start and
     *     end positions.
     */
    findPath(startX: any, startY: any, endX: any, endY: any, grid: any): [number, number][] {
        const openList = this.openList = new Heap<any>((nodeA, nodeB) => {
            return nodeA.f - nodeB.f;
        });

        const startNode = this.startNode = grid.getNodeAt(startX, startY);
        const endNode = this.endNode = grid.getNodeAt(endX, endY);
        let node;

        this.grid = grid;


        // set the `g` and `f` value of the start node to be 0
        startNode.g = 0;
        startNode.f = 0;

        // push the start node into the open list
        openList.push(startNode);
        startNode.opened = true;

        // while the open list is not empty
        while (!openList.empty()) {
            // pop the position of node which has the minimum `f` value.
            node = openList.pop();
            node.closed = true;

            if (node === endNode) {
                return Util.expandPath(Util.backtrace(endNode)) as any;
            }

            this._identifySuccessors(node);
        }

        // fail to find the path
        return [];
    }

    /**
     * Identify successors for the given node. Runs a jump point search in the
     * direction of each available neighbor, adding any points found to the open
     * list.
     * @protected
     */
    _identifySuccessors(node: any) {
        const grid = this.grid;
        const heuristic = this.heuristic;
        const openList = this.openList;
        const endX = this.endNode.x;
        const endY = this.endNode.y;
        let neighbors;
        let neighbor;
        let jumpPoint;
        let i;
        let l;
        const x = node.x;
        const y = node.y;
        let jx;
        let jy;
        let dx;
        let dy;
        let d;
        let ng;
        let jumpNode;
        const abs = Math.abs;
        const max = Math.max;

        neighbors = this._findNeighbors(node);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];
            jumpPoint = this._jump(neighbor[0], neighbor[1], x, y);
            if (jumpPoint) {

                jx = jumpPoint[0];
                jy = jumpPoint[1];
                jumpNode = grid.getNodeAt(jx, jy);

                if (jumpNode.closed) {
                    continue;
                }

                // include distance, as parent may not be immediately adjacent:
                d = Heuristic.octile(abs(jx - x), abs(jy - y));
                ng = node.g + d; // next `g` value

                if (!jumpNode.opened || ng < jumpNode.g) {
                    jumpNode.g = ng;
                    jumpNode.h = jumpNode.h || heuristic(abs(jx - endX), abs(jy - endY));
                    jumpNode.f = jumpNode.g + jumpNode.h;
                    jumpNode.parent = node;

                    if (!jumpNode.opened) {
                        openList.push(jumpNode);
                        jumpNode.opened = true;
                    } else {
                        openList.updateItem(jumpNode);
                    }
                }
            }
        }
    }
}

export default JumpPointFinderBase;
