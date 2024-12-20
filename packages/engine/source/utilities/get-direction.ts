import _ from 'lodash';

import { Direction } from '@screeps/common/src/constants/direction';

export function getDirection(dx: any, dy: any) {

    const adx = Math.abs(dx), ady = Math.abs(dy);

    if (adx > ady * 2) {
        if (dx > 0) {
            return Direction.RIGHT;
        }
        else {
            return Direction.LEFT;
        }
    }
    else if (ady > adx * 2) {
        if (dy > 0) {
            return Direction.BOTTOM;
        }
        else {
            return Direction.TOP;
        }
    }
    else {
        if (dx > 0 && dy > 0) {
            return Direction.BOTTOM_RIGHT;
        }
        if (dx > 0 && dy < 0) {
            return Direction.TOP_RIGHT;
        }
        if (dx < 0 && dy > 0) {
            return Direction.BOTTOM_LEFT;
        }
        if (dx < 0 && dy < 0) {
            return Direction.TOP_LEFT;
        }
    }
};
