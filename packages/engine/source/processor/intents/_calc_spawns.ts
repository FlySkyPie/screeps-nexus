import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

import * as utils from '../../utils';

export default (roomSpawns: any, roomExtensions: any, { roomController, bulk }: any) => {
    let spawns = roomSpawns;

    if (spawns.length > ScreepsConstants.CONTROLLER_STRUCTURES.spawn[roomController.level | 0]) {
        spawns.sort(utils.comparatorDistance(roomController));
        spawns = _.take(spawns, ScreepsConstants.CONTROLLER_STRUCTURES.spawn[roomController.level | 0]);
        roomSpawns.forEach((i: any) => i._off = !_.contains(spawns, i));
    }
    else {
        roomSpawns.forEach((i: any) => i._off = false);
    }

    roomSpawns.forEach((i: any) => {
        if (i._off !== i.off) {
            bulk.update(i._id, { off: i._off });
        }
    });


    let extensions = roomExtensions;

    if (extensions.length > ScreepsConstants.CONTROLLER_STRUCTURES.extension[roomController.level | 0]) {
        extensions.sort(utils.comparatorDistance(roomController));
        extensions = _.take(extensions, ScreepsConstants.CONTROLLER_STRUCTURES.extension[roomController.level | 0]);
        roomExtensions.forEach((i: any) => i._off = !_.contains(extensions, i));
    }
    else {
        roomExtensions.forEach((i: any) => i._off = false);
    }

    roomExtensions.forEach((i: any) => {
        if (i._off !== i.off) {
            bulk.update(i._id, { off: i._off });
        }
    });
};
