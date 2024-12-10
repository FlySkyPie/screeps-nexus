class Node {
    /**
     * A node in grid. 
     * This class holds some basic information about a node and custom 
     * attributes may be added, depending on the algorithms' needs.
     * @constructor
     * @param x - The x coordinate of the node on the grid.
     * @param y - The y coordinate of the node on the grid.
     * @param [walkable] - Whether this node is walkable.
     */
    constructor(
        public x: number,
        public y: number,
        public walkable = true,
        _weight = true,
    ) { }
}

export default Node;
