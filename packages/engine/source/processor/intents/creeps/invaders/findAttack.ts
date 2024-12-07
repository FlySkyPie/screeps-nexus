import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { BodyParts } from '@screeps/common/src/constants/body-parts';

import * as utils from '../../../../utils';

import * as fakeRuntime from '../../../common/fake-runtime';

import flee from './flee';

function checkPath(pos1: any, pos2: any, scope: any) {
    const ret = fakeRuntime.findPath(pos1, pos2, {}, scope);
    const path = ret.path;
    if (!path.length) {
        return false;
    }
    return path[path.length - 1].x == pos2.x && path[path.length - 1].y == pos2.y;
}

export default (creep: any, context: any) => {
    const { scope, intents, healers, hostiles, fortifications } = context;
    const { roomObjects, roomController } = scope;

    const costCallbackIgnoreRamparts = (_roomName: any, cm: any) => {
        fortifications.forEach((i: any) => cm.set(i.x, i.y, 0));
    };

    const haveAttack = fakeRuntime.hasActiveBodyparts(creep, BodyParts.ATTACK);
    if (!haveAttack &&
        fakeRuntime.hasActiveBodyparts(creep, BodyParts.RANGED_ATTACK) &&
        flee(creep, 3, context)) {
        return;
    }

    let target: any;
    if (creep.hits < creep.hitsMax / 2 && _.some(healers) && !haveAttack) {
        target = fakeRuntime.findClosestByPath(creep, healers, { ignoreRoads: true }, scope);
        if (target) {
            const direction = fakeRuntime.moveTo(creep, target, { maxRooms: 1, ignoreRoads: true }, scope);
            if (direction) {
                intents.set(creep._id, 'move', { direction });
            } else {
                target = null;
            }
        } else {
            target = null;
        }
    }

    if (haveAttack) {
        const nearCreep: any = _.find(hostiles, c => utils.dist(creep, c) <= 1);
        if (nearCreep) {
            intents.set(creep._id, 'attack', { id: nearCreep._id, x: nearCreep.x, y: nearCreep.y });
        }
    }

    if (!target) {
        target = fakeRuntime.findClosestByPath(creep, hostiles, { ignoreRoads: true, ignoreCreeps: true }, scope);
        if (target && (haveAttack || (utils.dist(creep, target) > 3))) {
            const direction = fakeRuntime.moveTo(creep, target, { maxRooms: 1, ignoreRoads: true, ignoreCreeps: true }, scope);
            if (direction) {
                intents.set(creep._id, 'move', { direction });
            }
        }
    }

    if (!target) {
        target = fakeRuntime.findClosestByPath(creep, hostiles, { maxRooms: 1, ignoreRoads: true, costCallback: costCallbackIgnoreRamparts }, scope);
        if (target && (haveAttack || (utils.dist(creep, target) > 3))) {
            const direction = fakeRuntime.moveTo(creep, target, { maxRooms: 1, ignoreRoads: true, costCallback: costCallbackIgnoreRamparts }, scope);
            if (direction) {
                intents.set(creep._id, 'move', { direction });
            }
        }
    }

    if (!target) {
        target = fakeRuntime.findClosestByPath(creep, hostiles, { ignoreDestructibleStructures: true, maxRooms: 1, ignoreRoads: true }, scope);
        if (target && (haveAttack || (utils.dist(creep, target) > 3))) {
            const direction = fakeRuntime.moveTo(creep, target, { ignoreDestructibleStructures: true, maxRooms: 1, ignoreRoads: true }, scope);
            if (direction) {
                intents.set(creep._id, 'move', { direction });
            }
        }
    }

    if (!target) {
        const unreachableSpawns = _.filter(roomObjects, (o: any) =>
            o.type == 'spawn' && !checkPath(creep, new fakeRuntime.RoomPosition(o.x, o.y, o.room), scope)
        );
        if (!unreachableSpawns.length && roomController && roomController.user) {
            intents.set(creep._id, 'suicide', {});
            return;
        }

        target = unreachableSpawns[0];
        if (target) {
            const direction = fakeRuntime.moveTo(creep, target, { ignoreDestructibleStructures: true, maxRooms: 1, ignoreRoads: true }, scope);
            if (direction) {
                intents.set(creep._id, 'move', { direction });
            }
        }
        return;
    }

    intents.set(creep._id, 'attack', { id: target._id, x: target.x, y: target.y });
    if ((haveAttack || fakeRuntime.hasActiveBodyparts(creep, BodyParts.WORK)) && !!creep['memory_move'] && !!creep['memory_move']['path']) {
        if (!creep['memory_move']['path'].length) {
            return;
        }

        const pos = fakeRuntime.RoomPosition.sUnpackLocal(creep['memory_move']['path'][0], creep.room);
        const structures: any = _.filter(roomObjects, (o: any) =>
            !!ScreepsConstants.CONTROLLER_STRUCTURES[o.type] &&
            o.type != 'spawn' &&
            o.x == pos.x &&
            o.y == pos.y);
        if (structures.length > 0) {
            if (fakeRuntime.hasActiveBodyparts(creep, BodyParts.WORK)) {
                intents.set(creep._id, 'dismantle', { id: structures[0]._id });
            } else {
                intents.set(creep._id,
                    'attack', {
                    id: structures[0]._id,
                    x: structures[0].x,
                    y: structures[0].y
                });
            }
        }
    }
};
