import _ from 'lodash';

import * as utils from '../../../utils';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';

export default (userId: any, intent: any, { roomObjects, roomTerrain, bulk }: any) => {

    if (userId != '3') {
        return;
    }

    let x: any, y: any;

    do {
        x = Math.floor(Math.random() * 48) + 1;
        y = Math.floor(Math.random() * 48) + 1;
    }
    while (_.any(roomObjects, (i: any) =>
        _.contains(ScreepsConstants.OBSTACLE_OBJECT_TYPES, i.type) &&
        i.x == x &&
        i.y == y) ||
        utils.checkTerrain(roomTerrain, x, y, ScreepsConstants.TERRAIN_MASK_WALL));

    bulk.insert({
        x,
        y,
        type: 'energy',
        energy: 300,
        room: intent.roomName
    });
};