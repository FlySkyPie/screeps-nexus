import _ from 'lodash';

import { BodyParts } from '@screeps/common/src/constants/body-parts';

import * as utils from '../../../utils';

const driver = utils.getDriver();

export default (object: any, intent: any, { roomObjects, bulk, bulkUsers, users }: any) => {

    if (object.type != 'creep') {
        return;
    }
    if (object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || target.type != 'controller') {
        return;
    }
    if (Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }
    if (target.bindUser && object.user != target.bindUser) {
        return;
    }
    if (target.level > 0) {
        return;
    }
    if ((_.filter(object.body, (i:any) => i.hits > 0 && i.type == BodyParts.CLAIM).length) === 0) {
        return;
    }
    if (target.reservation && target.reservation.user != object.user) {
        return;
    }
    let user = users[object.user],
        claimedRooms = user.rooms ? user.rooms.length : 0;

    if (user.gcl < utils.calcNeededGcl(claimedRooms + 1)) {
        return;
    }

    const level = 1;

    bulk.update(target, {
        user: object.user,
        level,
        progress: 0,
        downgradeTime: null,
        reservation: null
    });

    driver.addRoomToUser(object.room, users[object.user], bulkUsers);
};