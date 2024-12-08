/**
 * @namespace PF.Heuristic
 * @description A collection of heuristic functions.
 */
export default {

    /**
     * Manhattan distance.
     * @param  dx - Difference in x.
     * @param  dy - Difference in y.
     * @return  dx + dy
     */
    manhattan: function (dx: number, dy: number): number {
        return dx + dy;
    },

    /**
     * Euclidean distance.
     * @param  dx - Difference in x.
     * @param  dy - Difference in y.
     * @return  sqrt(dx * dx + dy * dy)
     */
    euclidean: function (dx: number, dy: number): number {
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Octile distance.
     * @param  dx - Difference in x.
     * @param  dy - Difference in y.
     * @return  sqrt(dx * dx + dy * dy) for grids
     */
    octile: function (dx: number, dy: number): number {
        const F = Math.SQRT2 - 1;
        return (dx < dy) ? F * dx + dy : F * dy + dx;
    },

    /**
     * Chebyshev distance.
     * @param  dx - Difference in x.
     * @param  dy - Difference in y.
     * @return  max(dx, dy)
     */
    chebyshev: function (dx: number, dy: number): number {
        return Math.max(dx, dy);
    }

};
