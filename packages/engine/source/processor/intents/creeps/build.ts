import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { BodyParts } from '@screeps/common/src/constants/body-parts';
import { EventCode } from '@screeps/common/src/constants/event-code';
import { Boosts } from '@screeps/common/src/constants/boosts';

import config from '../../../config';
import * as utils from '../../../utils';

let createdStructureCounter = 0;

export default (
    object: any,
    intent: any,
    { roomObjects, roomTerrain, bulk, roomController, stats, gameTime, eventLog }: any
) => {
    if (object.type != 'creep') {
        return;
    }
    if (object.spawning || !object.store || object.store.energy <= 0) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || target.type != 'constructionSite' ||
        !ScreepsConstants.CONSTRUCTION_COST[target.structureType]) {
        return;
    }
    if (Math.abs(target.x - object.x) > 3 || Math.abs(target.y - object.y) > 3) {
        return;
    }

    const objectsInTile: any[] = [],
        creepsInTile: any[] = [],
        myCreepsInTile: any[] = [];
    let structure = null;
    _.forEach(roomObjects, obj => {
        if (obj.x == target.x && obj.y == target.y) {
            if (obj.type == target.structureType) {
                structure = obj;
                return;
            }
            if (obj.type == 'creep') {
                creepsInTile.push(obj);
                if (obj.user == object.user) {
                    myCreepsInTile.push(obj);
                }
            } else {
                objectsInTile.push(obj);
            }
        }
    });

    if (!!structure) {
        return;
    }

    if (_.contains(ScreepsConstants.OBSTACLE_OBJECT_TYPES, target.structureType)) {
        if (_.any(objectsInTile, i => _.contains(ScreepsConstants.OBSTACLE_OBJECT_TYPES, i.type))) {
            return;
        }

        const mySafeMode = roomController && roomController.user == object.user && roomController.safeMode > gameTime;
        const blockingCreeps = mySafeMode ? myCreepsInTile : creepsInTile;
        if (_.any(blockingCreeps)) {
            return;
        }
    }

    if (target.structureType != 'extractor' && target.structureType != 'road' &&
        utils.checkTerrain(roomTerrain, target.x, target.y, ScreepsConstants.TERRAIN_MASK_WALL)) {
        return;
    }

    const buildPower = _.filter(object.body, (i: any) =>
        (i.hits > 0 || i._oldHits > 0) &&
        i.type == BodyParts.WORK).length * ScreepsConstants.BUILD_POWER ||
        0;
    const buildRemaining = target.progressTotal - target.progress;
    const buildEffect = Math.min(buildPower, buildRemaining, object.store.energy);

    let boostedParts = _.map(object.body, (i: any) => {
        if (i.type == BodyParts.WORK &&
            i.boost &&
            (Boosts as any)[BodyParts.WORK][i.boost].build > 0) {
            return ((Boosts as any)[BodyParts.WORK][i.boost].build - 1) * ScreepsConstants.BUILD_POWER;
        }
        return 0;
    });

    boostedParts.sort((a, b) => b - a);
    boostedParts = boostedParts.slice(0, buildEffect);

    const boostedEffect = Math.min(Math.floor(buildEffect + _.sum(boostedParts)), buildRemaining);

    target.progress += boostedEffect;
    object.store.energy -= buildEffect;

    stats.inc('energyConstruction', object.user, buildEffect);

    object.actionLog.build = { x: target.x, y: target.y };
    bulk.update(object, { store: { energy: object.store.energy } });

    eventLog.push({ event: EventCode.EVENT_BUILD, objectId: object._id, data: { targetId: target._id, amount: boostedEffect } });

    if (target.progress < target.progressTotal) {
        bulk.update(target, {
            progress: target.progress
        });
    }
    else {
        bulk.remove(target._id);

        const newObject = {
            type: target.structureType,
            x: target.x,
            y: target.y,
            room: target.room,
            notifyWhenAttacked: true
        };

        if (target.structureType == 'spawn') {
            _.extend(newObject, {
                name: target.name,
                user: target.user,
                store: { energy: 0 },
                storeCapacityResource: { energy: ScreepsConstants.SPAWN_ENERGY_CAPACITY },
                hits: ScreepsConstants.SPAWN_HITS,
                hitsMax: ScreepsConstants.SPAWN_HITS
            });
        }

        if (target.structureType == 'extension') {
            _.extend(newObject, {
                user: target.user,
                store: { energy: 0 },
                storeCapacityResource: { energy: 0 },
                hits: ScreepsConstants.EXTENSION_HITS,
                hitsMax: ScreepsConstants.EXTENSION_HITS
            });
        }

        if (target.structureType == 'link') {
            _.extend(newObject, {
                user: target.user,
                store: { energy: 0 },
                storeCapacityResource: { energy: ScreepsConstants.LINK_CAPACITY },
                cooldown: 0,
                hits: ScreepsConstants.LINK_HITS,
                hitsMax: ScreepsConstants.LINK_HITS_MAX
            });
        }

        if (target.structureType == 'storage') {
            _.extend(newObject, {
                user: target.user,
                store: { energy: 0 },
                storeCapacity: ScreepsConstants.STORAGE_CAPACITY,
                hits: ScreepsConstants.STORAGE_HITS,
                hitsMax: ScreepsConstants.STORAGE_HITS
            });
        }

        const hitsMax = (!!roomController && roomController.user == object.user) ?
            ScreepsConstants.RAMPART_HITS_MAX[roomController.level] || 0 :
            0;
        if (target.structureType == 'rampart') {
            _.extend(newObject, {
                user: target.user,
                hits: ScreepsConstants.RAMPART_HITS,
                hitsMax,
                nextDecayTime: gameTime + ScreepsConstants.RAMPART_DECAY_TIME
            });
        }

        if (target.structureType == 'road') {
            let hits = ScreepsConstants.ROAD_HITS;

            if (_.any(roomObjects, _.matches({ x: target.x, y: target.y, type: 'swamp' })) ||
                utils.checkTerrain(roomTerrain, target.x, target.y, ScreepsConstants.TERRAIN_MASK_SWAMP)) {
                hits *= ScreepsConstants.CONSTRUCTION_COST_ROAD_SWAMP_RATIO;
            }
            if (_.any(roomObjects, _.matches({ x: target.x, y: target.y, type: 'wall' })) ||
                utils.checkTerrain(roomTerrain, target.x, target.y, ScreepsConstants.TERRAIN_MASK_WALL)) {
                hits *= ScreepsConstants.CONSTRUCTION_COST_ROAD_WALL_RATIO;
            }
            _.extend(newObject, {
                hits,
                hitsMax: hits,
                nextDecayTime: gameTime + ScreepsConstants.ROAD_DECAY_TIME
            });
        }

        if (target.structureType == 'constructedWall') {
            _.extend(newObject, {
                hits: ScreepsConstants.WALL_HITS,
                hitsMax: ScreepsConstants.WALL_HITS_MAX
            });
        }

        if (target.structureType == 'tower') {
            _.extend(newObject, {
                user: target.user,
                store: { energy: 0 },
                storeCapacityResource: { energy: ScreepsConstants.TOWER_CAPACITY },
                hits: ScreepsConstants.TOWER_HITS,
                hitsMax: ScreepsConstants.TOWER_HITS
            });
        }

        if (target.structureType == 'observer') {
            _.extend(newObject, {
                user: target.user,
                hits: ScreepsConstants.OBSERVER_HITS,
                hitsMax: ScreepsConstants.OBSERVER_HITS
            });
        }

        if (target.structureType == 'extractor') {
            _.extend(newObject, {
                user: target.user,
                hits: ScreepsConstants.EXTRACTOR_HITS,
                hitsMax: ScreepsConstants.EXTRACTOR_HITS
            });
        }

        if (target.structureType == 'lab') {
            _.extend(newObject, {
                user: target.user,
                hits: ScreepsConstants.LAB_HITS,
                hitsMax: ScreepsConstants.LAB_HITS,
                mineralAmount: 0,
                cooldown: 0,
                store: { energy: 0 },
                storeCapacity: ScreepsConstants.LAB_ENERGY_CAPACITY + ScreepsConstants.LAB_MINERAL_CAPACITY,
                storeCapacityResource: { energy: ScreepsConstants.LAB_ENERGY_CAPACITY }
            });
        }

        if (target.structureType == 'powerSpawn') {
            _.extend(newObject, {
                user: target.user,
                store: { energy: 0 },
                storeCapacityResource: { energy: ScreepsConstants.POWER_SPAWN_ENERGY_CAPACITY, power: ScreepsConstants.POWER_SPAWN_POWER_CAPACITY },
                hits: ScreepsConstants.POWER_SPAWN_HITS,
                hitsMax: ScreepsConstants.POWER_SPAWN_HITS
            });
        }

        if (target.structureType == 'terminal') {
            _.extend(newObject, {
                user: target.user,
                store: { energy: 0 },
                storeCapacity: ScreepsConstants.TERMINAL_CAPACITY,
                hits: ScreepsConstants.TERMINAL_HITS,
                hitsMax: ScreepsConstants.TERMINAL_HITS
            });
        }

        if (target.structureType == 'container') {
            _.extend(newObject, {
                store: { energy: 0 },
                storeCapacity: ScreepsConstants.CONTAINER_CAPACITY,
                hits: ScreepsConstants.CONTAINER_HITS,
                hitsMax: ScreepsConstants.CONTAINER_HITS,
                nextDecayTime: gameTime + ScreepsConstants.CONTAINER_DECAY_TIME
            });
        }

        if (target.structureType == 'nuker') {
            _.extend(newObject, {
                user: target.user,
                store: { energy: 0 },
                storeCapacityResource: { energy: config.ptr ? 1 : ScreepsConstants.NUKER_ENERGY_CAPACITY, G: config.ptr ? 1 : ScreepsConstants.NUKER_GHODIUM_CAPACITY },
                hits: ScreepsConstants.NUKER_HITS,
                hitsMax: ScreepsConstants.NUKER_HITS,
                cooldownTime: gameTime + (config.ptr ? 100 : ScreepsConstants.NUKER_COOLDOWN)
            });
        }

        if (target.structureType == 'factory') {
            _.extend(newObject, {
                user: target.user,
                store: { energy: 0 },
                storeCapacity: ScreepsConstants.FACTORY_CAPACITY,
                hits: ScreepsConstants.FACTORY_HITS,
                hitsMax: ScreepsConstants.FACTORY_HITS,
                cooldown: 0
            });
        }

        bulk.insert(newObject);

        roomObjects['createdStructure' + createdStructureCounter] = newObject;
        createdStructureCounter++;

        delete roomObjects[intent.id];
    }
};
