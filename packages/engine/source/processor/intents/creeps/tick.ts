import _ from 'lodash';

import { Boosts } from '@screeps/common/src/constants/boosts';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { EventCode } from '@screeps/common/src/constants/event-code';
import { BodyParts } from '@screeps/common/src/constants/body-parts';

import * as utils from '../../../utils';

import * as movement from '../movement';

import bornCreep from '../spawns/_born-creep';
import die from './_die';
import addFatigue from './_add-fatigue';
import _recalcBody from './_recalc-body';
import drop from './_drop-resources-without-space';

function _applyDamage(object: any, damage: any) {

    let damageReduce = 0, damageEffective = damage;

    if (_.any(object.body, (i: any) => !!i.boost)) {
        for (let i = 0; i < object.body.length; i++) {
            if (damageEffective <= 0) {
                break;
            }
            let bodyPart = object.body[i], damageRatio = 1;
            if (bodyPart.boost &&
                (Boosts as any)[bodyPart.type][bodyPart.boost] &&
                (Boosts as any)[bodyPart.type][bodyPart.boost].damage) {
                damageRatio = (Boosts as any)[bodyPart.type][bodyPart.boost].damage;
            }
            let bodyPartHitsEffective = bodyPart.hits / damageRatio;
            damageReduce += Math.min(bodyPartHitsEffective, damageEffective) * (1 - damageRatio);
            damageEffective -= Math.min(bodyPartHitsEffective, damageEffective);
        }
    }

    damage -= Math.round(damageReduce);

    object.hits -= damage;
}

export default (object: any, scope: any) => {

    const { roomObjects, bulk, roomController, gameTime, eventLog } = scope;

    if (!object || object.type != 'creep') return;

    if (object.spawning) {
        const spawn: any = _.find(roomObjects, (o: any) =>
            o.x == object.x &&
            o.y == object.y &&
            (o.type == 'spawn' ||
                o.type == 'invaderCore'));
        if (!spawn) {
            bulk.remove(object._id);
            delete roomObjects[object._id];
        }
        else {
            if (!spawn.spawning || spawn.spawning.name != object.name) {
                bornCreep(spawn, object, scope);
            }
        }
    }
    else {
        movement.execute(object, scope);

        if (utils.isAtEdge(object) && object.user != '2' && object.user != '3') {
            const [roomX, roomY] = utils.roomNameToXY(object.room);
            let x = object.x;
            let y = object.y;
            let room = object.room;

            if (object.x == 0) {
                x = 49;
                room = utils.getRoomNameFromXY(roomX - 1, roomY);
            }
            else if (object.y == 0) {
                y = 49;
                room = utils.getRoomNameFromXY(roomX, roomY - 1);
            }
            else if (object.x == 49) {
                x = 0;
                room = utils.getRoomNameFromXY(roomX + 1, roomY);
            }
            else if (object.y == 49) {
                y = 0;
                room = utils.getRoomNameFromXY(roomX, roomY + 1);
            }

            bulk.update(object, { interRoom: { room, x, y } });

            eventLog.push({ event: EventCode.EVENT_EXIT, objectId: object._id, data: { room, x, y } });
        }

        if (object.ageTime) { // since NPC creeps may appear right on portals without `ageTime` defined at the first tick
            const portal = _.find(roomObjects, (i: any) =>
                i.type == 'portal' &&
                i.x == object.x &&
                i.y == object.y);
            if (portal) {
                bulk.update(object, { interRoom: portal.destination });
            }
        }

        if (!object.tutorial) {
            if (!object.ageTime) {
                object.ageTime = gameTime + (_.any(object.body, _.matches({ type: BodyParts.CLAIM })) ? ScreepsConstants.CREEP_CLAIM_LIFE_TIME : ScreepsConstants.CREEP_LIFE_TIME);
                bulk.update(object, { ageTime: object.ageTime });
            }

            if (gameTime >= object.ageTime - 1) {
                die(object, undefined, false, scope);
            }
        }

        if (!_.isEqual(object.actionLog, object._actionLog)) {
            bulk.update(object, { actionLog: object.actionLog });
        }

    }


    const moves = utils.calcBodyEffectiveness(object.body, BodyParts.MOVE, 'fatigue', 1);
    if (moves > 0) {
        addFatigue(object, -2 * moves, scope);
    }

    if (_.isNaN(object.hits) || object.hits <= 0) {
        die(object, undefined, true, scope);
    }

    if (object.userSummoned && _.any(roomObjects, (i: any) =>
        i.type == 'creep' &&
        i.user != '2' &&
        i.user != roomController.user)) {
        die(object, undefined, false, scope);
    }

    let oldHits = object.hits;

    if (object._damageToApply) {
        _applyDamage(object, object._damageToApply);
        delete object._damageToApply;
    }

    if (object._healToApply) {
        object.hits += object._healToApply;
        delete object._healToApply;
    }

    if (object.hits > object.hitsMax) {
        object.hits = object.hitsMax;
    }

    if (object.hits <= 0) {
        die(object, undefined, true, scope);
    }
    else if (object.hits != oldHits) {

        _recalcBody(object);

        if (object.hits < oldHits) {
            drop(object, scope);
        }

        bulk.update(object, {
            hits: object.hits,
            body: object.body,
            storeCapacity: object.storeCapacity
        });
    }
};
