import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (userId, intent, {roomObjects, roomTerrain, bulk}) => {

    if(userId != '3') {
        return;
    }

    let x, y;

    do {
        x = Math.floor(Math.random() * 48) + 1;
        y = Math.floor(Math.random() * 48) + 1;
    }
    while(_.any(roomObjects, (i) => _.contains(C.OBSTACLE_OBJECT_TYPES, i.type) && i.x == x && i.y == y) ||
            utils.checkTerrain(roomTerrain, x, y, C.TERRAIN_MASK_WALL));

    bulk.insert({
        x,
        y,
        type: 'energy',
        energy: 300,
        room: intent.roomName
    });
};