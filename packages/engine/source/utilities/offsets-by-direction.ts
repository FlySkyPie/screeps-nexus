import _ from 'lodash';

import { Direction } from '@screeps/common/src/constants/direction';

export const offsetsByDirection: Record<string, any> = {
    [Direction.TOP]: [0, -1],
    [Direction.TOP_RIGHT]: [1, -1],
    [Direction.RIGHT]: [1, 0],
    [Direction.BOTTOM_RIGHT]: [1, 1],
    [Direction.BOTTOM]: [0, 1],
    [Direction.BOTTOM_LEFT]: [-1, 1],
    [Direction.LEFT]: [-1, 0],
    [Direction.TOP_LEFT]: [-1, -1]
};
