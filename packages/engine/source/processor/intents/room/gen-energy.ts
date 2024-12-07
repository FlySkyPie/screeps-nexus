import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (userId, intent, {roomObjects, roomTerrain, bulk}) => {

    if(userId != '3') {
        return;
    }

    let x, y;

    do {
        x = Math.floor(Math.random() * 48) + 1;
        y = Math.floor(Math.random() * 48) + 1;
    }
    while(_.any(roomObjects, (i) => _.contains(ScreepsConstants.OBSTACLE_OBJECT_TYPES, i.type) && i.x == x && i.y == y) ||
            utils.checkTerrain(roomTerrain, x, y, ScreepsConstants.TERRAIN_MASK_WALL));

    bulk.insert({
        x,
        y,
        type: 'energy',
        energy: 300,
        room: intent.roomName
    });
};