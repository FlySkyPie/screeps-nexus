import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

export default (object: any, { roomObjects, bulk, gameTime }: any) => {

    if (object.unstableDate && Date.now() > object.unstableDate) {
        bulk.update(object, {
            decayTime: gameTime + ScreepsConstants.PORTAL_DECAY,
            unstableDate: null
        });
    }

    if (object.decayTime && gameTime > object.decayTime) {
        bulk.remove(object._id);
        delete roomObjects[object._id];

        const wall = _.find(roomObjects, (i: any) =>
            i.type == 'constructedWall' &&
            i.x == object.x + 1 &&
            i.y == object.y + 1);
        if (wall) {
            bulk.remove(wall._id);
            delete roomObjects[wall._id];
        }
    }

};