import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { EventAttackType } from '@screeps/common/src/constants/event-attack-type';
import { BodyParts } from '@screeps/common/src/constants/body-parts';
import { EventCode } from '@screeps/common/src/constants/event-code';

import * as utils from '../../../utils';

export default (
    object: any,
    dropRate: any,
    violentDeath: any,
    { roomObjects, bulk, stats, gameTime, eventLog }: any,
    attackType?: any
) => {

    if (dropRate === undefined) {
        dropRate = ScreepsConstants.CREEP_CORPSE_RATE;
    }

    bulk.remove(object._id);
    delete roomObjects[object._id];

    let decayTime = object.body.length * ScreepsConstants.TOMBSTONE_DECAY_PER_PART;
    if (object.tombstoneDecay) {
        decayTime = object.tombstoneDecay;
    }

    if (!attackType || attackType != EventAttackType.EVENT_ATTACK_TYPE_NUKE) {
        let tombstone: any = {
            type: 'tombstone',
            room: object.room,
            x: object.x,
            y: object.y,
            user: object.user,
            deathTime: gameTime,
            decayTime: gameTime + decayTime,
            creepId: "" + object._id,
            creepName: object.name,
            creepTicksToLive: object.ageTime - gameTime,
            creepBody: _.map(object.body, (b: any) => b.type),
            creepSaying:
                object.actionLog &&
                    object.actionLog.say &&
                    object.actionLog.say.isPublic ?
                    object.actionLog.say.message :
                    undefined,
            store: {}
        };

        let container: any = _.find(roomObjects, { type: 'container', x: object.x, y: object.y });

        if (dropRate > 0 && !object.userSummoned && !object.strongholdId) {
            const lifeTime = _.any(object.body, { type: BodyParts.CLAIM }) ?
                ScreepsConstants.CREEP_CLAIM_LIFE_TIME :
                ScreepsConstants.CREEP_LIFE_TIME;
            const lifeRate = dropRate * object._ticksToLive / lifeTime;
            const bodyResources: Record<string, any> = { energy: 0 };

            object.body.forEach((i: any) => {
                if (i.boost) {
                    bodyResources[i.boost] = bodyResources[i.boost] || 0;
                    bodyResources[i.boost] += ScreepsConstants.LAB_BOOST_MINERAL * lifeRate;
                    bodyResources.energy += ScreepsConstants.LAB_BOOST_ENERGY * lifeRate;
                }
                bodyResources.energy += Math.min(
                    ScreepsConstants.CREEP_PART_MAX_ENERGY,
                    ScreepsConstants.BODYPART_COST[i.type] * lifeRate
                );
            });

            _.forEach(bodyResources, (amount, resourceType: any) => {
                amount = Math.floor(amount);
                if (amount > 0) {
                    if (container && container.hits > 0) {
                        container.store = container.store || {};
                        let targetTotal = utils.calcResources(container);
                        let toContainerAmount = Math.min(amount, container.storeCapacity - targetTotal);
                        if (toContainerAmount > 0) {
                            container.store[resourceType] = (container.store[resourceType] || 0) + toContainerAmount;
                            bulk.update(container, { store: { [resourceType]: container.store[resourceType] } });
                            amount -= toContainerAmount;
                        }
                    }
                    if (amount > 0) {
                        tombstone.store[resourceType] = (tombstone.store[resourceType] || 0) + amount;
                    }
                }
            });

            _.forEach(object.store, (amount, resourceType: any) => {
                if (amount > 0) {
                    if (container && container.hits > 0) {
                        container.store = container.store || {};
                        let targetTotal = utils.calcResources(container);
                        let toContainerAmount = Math.min(amount, container.storeCapacity - targetTotal);
                        if (toContainerAmount > 0) {
                            container.store[resourceType] = (container.store[resourceType] || 0) + toContainerAmount;
                            bulk.update(container, { store: { [resourceType]: container.store[resourceType] } });
                            amount -= toContainerAmount;
                        }
                    }
                }
                if (amount > 0) {
                    tombstone.store[resourceType] = (tombstone.store[resourceType] || 0) + amount;
                }
            });
        }

        bulk.insert(tombstone);
    }

    eventLog.push({
        event: EventCode.EVENT_OBJECT_DESTROYED,
        objectId: object._id,
        type: 'creep'
    });

    if (violentDeath && stats && object.user != '3' && object.user != '2') {
        stats.inc('creepsLost', object.user, object.body.length);
    }
};
