import _ from 'lodash';

import { POWER_INFO } from '@screeps/common/src/tables/power-info';
import { Resource } from '@screeps/common/src/constants/resource';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';
import { EventCode } from '@screeps/common/src/constants/event-code';

import * as utils from '../../../utils';

import drop from './drop';

export default (object: any, intent: any, scope: any) => {
    const { roomObjects, roomTerrain, gameTime, bulk, eventLog, roomController } = scope;

    if (roomController) {
        if (!roomController.isPowerEnabled) {
            return;
        }
        if (roomController.user != object.user && roomController.safeMode > gameTime) {
            return;
        }
    }

    const powerInfo = POWER_INFO[intent.power];
    if (!powerInfo) {
        return;
    }
    const creepPower = object.powers[intent.power];
    let target: any;

    if (!creepPower || creepPower.level == 0 || creepPower.cooldownTime > gameTime) {
        return;
    }

    let ops = powerInfo.ops || 0;
    if (_.isArray(ops)) {
        ops = ops[creepPower.level - 1];
    }

    object.store = object.store || {};
    if ((object.store.ops || 0) < ops) {
        return;
    }

    if (powerInfo.range) {
        target = roomObjects[intent.id];
        if (!target) {
            return;
        }
        if (utils.dist(object, target) > powerInfo.range) {
            return;
        }
        const currentEffect = _.find(target.effects, (i: any) => i.power == intent.power);
        if (currentEffect && currentEffect.level > creepPower.level && currentEffect.endTime > gameTime) {
            return;
        }
    }

    let applyEffectOnTarget = false;

    switch (intent.power) {

        case PWRCode.PWR_GENERATE_OPS: {
            bulk.update(object, {
                store: {
                    [Resource.RESOURCE_OPS]: (object.store[Resource.RESOURCE_OPS] || 0) + powerInfo.effect[creepPower.level - 1]
                },
            });
            let sum = utils.calcResources(object);

            if (sum > object.storeCapacity) {
                drop(object, {
                    amount: Math.min(object.store[Resource.RESOURCE_OPS], sum - object.storeCapacity),
                    resourceType: Resource.RESOURCE_OPS
                }, scope);
            }
            break;
        }

        case PWRCode.PWR_OPERATE_SPAWN: {
            if (target.type != 'spawn') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_OPERATE_TOWER: {
            if (target.type != 'tower') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_OPERATE_STORAGE: {
            if (target.type != 'storage') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_OPERATE_LAB: {
            if (target.type != 'lab') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_OPERATE_EXTENSION: {
            if (!target.store || target.type != 'storage' && target.type != 'terminal' && target.type != 'factory' && target.type !== 'container') {
                return;
            }
            const effect: any = _.find(target.effects, { power: PWRCode.PWR_DISRUPT_TERMINAL });
            if (effect && effect.endTime > gameTime) {
                return;
            }
            const extensions = _.filter(roomObjects, (i: any) =>
                i.type == 'extension' &&
                i.user == target.user &&
                !i.off);
            let energySent = 0;
            const energyLimit = Math.min(
                target.store.energy,
                powerInfo.effect[creepPower.level - 1] * _.sum(extensions, 'storeCapacityResource.energy'));
            extensions.sort(utils.comparatorDistance(target));
            extensions.every((extension) => {
                const energy = Math.min(energyLimit - energySent, extension.storeCapacityResource.energy - extension.store.energy);
                bulk.update(extension, { store: { energy: extension.store.energy + energy } });
                energySent += energy;
                return energySent < energyLimit;
            });
            if (energySent === 0) {
                return;
            }
            bulk.update(target, { store: { energy: target.store.energy - energySent } });
            break;
        }

        case PWRCode.PWR_OPERATE_OBSERVER: {
            if (target.type != 'observer') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_OPERATE_TERMINAL: {
            if (target.type != 'terminal') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_DISRUPT_SPAWN: {
            if (target.type != 'spawn') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_DISRUPT_TOWER: {
            if (target.type != 'tower') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_DISRUPT_SOURCE: {
            if (target.type != 'source') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_REGEN_SOURCE: {
            if (target.type != 'source') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_REGEN_MINERAL: {
            if (target.type != 'mineral') {
                return;
            }
            if (target.mineralAmount == 0) {
                return;
            }
            if (target.nextRegenerationTime) {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_DISRUPT_TERMINAL: {
            if (target.type != 'terminal') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_OPERATE_CONTROLLER: {
            if (target.type != 'controller') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_OPERATE_POWER: {
            if (target.type != 'powerSpawn') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_FORTIFY: {
            if (target.type != 'rampart' && target.type != 'constructedWall') {
                return;
            }
            applyEffectOnTarget = true;
            break;
        }

        case PWRCode.PWR_SHIELD: {
            const constructionSite = _.find(roomObjects, (i: any) =>
                i.x == object.x &&
                i.y == object.y &&
                i.type == 'constructionSite');
            if (constructionSite) {
                bulk.remove(constructionSite._id);
                delete roomObjects[constructionSite._id];
            }
            if (!utils.checkConstructionSite(roomObjects, 'rampart', object.x, object.y) ||
                !utils.checkConstructionSite(roomTerrain, 'rampart', object.x, object.y)) {
                return;
            }
            bulk.insert({
                type: 'rampart',
                room: object.room,
                x: object.x,
                y: object.y,
                user: object.user,
                hits: powerInfo.effect[creepPower.level - 1],
                hitsMax: 0,
                nextDecayTime: gameTime + powerInfo.duration,
                effects: [
                    {
                        power: PWRCode.PWR_SHIELD,
                        level: creepPower.level,
                        endTime: gameTime + powerInfo.duration
                    }
                ]
            });
            break;
        }

        case PWRCode.PWR_OPERATE_FACTORY: {
            if (target.type != 'factory') {
                return;
            }

            if (!target.level) {
                bulk.update(target, { level: creepPower.level });
            } else {
                if (target.level != creepPower.level) {
                    return;
                }
            }

            applyEffectOnTarget = true;
            break;
        }
    }

    if (applyEffectOnTarget) {
        const effects = Object.values(target.effects || []);
        _.remove(effects, { power: intent.power });
        effects.push({
            effect: intent.power,
            power: intent.power,
            level: creepPower.level,
            endTime: gameTime +
                (_.isArray(powerInfo.duration) ? powerInfo.duration[creepPower.level - 1] : powerInfo.duration)
        });
        bulk.update(target, { effects: null });
        bulk.update(target, { effects });
    }

    bulk.update(object, {
        powers: {
            [intent.power]: {
                cooldownTime: gameTime + powerInfo.cooldown
            }
        },
        store: { ops: (object.store.ops || 0) - ops }
    });

    eventLog.push({
        event: EventCode.EVENT_POWER, objectId: object._id, data: {
            power: intent.power,
            targetId: intent.id
        }
    });

    object.actionLog.power = {
        id: intent.power,
        x: target ? target.x : object.x,
        y: target ? target.y : object.y,
    };
};
