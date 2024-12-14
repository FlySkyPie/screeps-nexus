#!/usr/bin/env node
import q from 'q';
import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import * as driver from '@screeps/driver/src/index';

import * as movement from './processor/intents/movement';
import * as fakeRuntime from './processor/common/fake-runtime';

import processor_intents_nukes_pretick from './processor/intents/nukes/pretick';
import processor_intents_creeps_keepers_pretick from './processor/intents/creeps/keepers/pretick';
import processor_intents_creeps_invaders_pretick from './processor/intents/creeps/invaders/pretick'
import processor_intents_invader_core_pretick from './processor/intents/invader-core/pretick'
import processor_intents__calc_spawns from './processor/intents/_calc_spawns'
import processor_intents_room_intents from './processor/intents/room/intents'
import processor_intents_creeps_intents from './processor/intents/creeps/intents'
import processor_intents_power_creeps_intents from './processor/intents/power-creeps/intents'
import processor_intents_links_intents from './processor/intents/links/intents'
import processor_intents_towers_intents from './processor/intents/towers/intents'
import processor_intents_labs_intents from './processor/intents/labs/intents'
import processor_intents_spawns_intents from './processor/intents/spawns/intents'
import processor_intents_ramparts_set_public from './processor/intents/ramparts/set-public'
import processor_intents_terminal_send from './processor/intents/terminal/send'
import processor_intents_nukers_launch_nuke from './processor/intents/nukers/launch-nuke'
import processor_intents_power_spawns_intents from './processor/intents/power-spawns/intents'
import processor_intents_invader_core_intents from './processor/intents/invader-core/intents'
import processor_intents_factories_produce from './processor/intents/factories/produce'
import processor_intents_controllers_unclaim from './processor/intents/controllers/unclaim'
import processor_intents_controllers_activateSafeMode from './processor/intents/controllers/activateSafeMode'
import processor_intents_invader_core_tick from './processor/intents/invader-core/tick'
import processor_intents_energy_tick from './processor/intents/energy/tick'
import processor_intents_sources_tick from './processor/intents/sources/tick'
import processor_intents_deposits_tick from './processor/intents/deposits/tick'
import processor_intents_minerals_tick from './processor/intents/minerals/tick'
import processor_intents_creeps_tick from './processor/intents/creeps/tick'
import processor_intents_power_creeps_tick from './processor/intents/power-creeps/tick'
import processor_intents_spawns_tick from './processor/intents/spawns/tick'
import processor_intents_ramparts_tick from './processor/intents/ramparts/tick'
import processor_intents_extensions_tick from './processor/intents/extensions/tick'
import processor_intents_roads_tick from './processor/intents/roads/tick'
import processor_intents_construction_sites_tick from './processor/intents/construction-sites/tick'
import processor_intents_keeper_lairs_tick from './processor/intents/keeper-lairs/tick'
import processor_intents_portals_tick from './processor/intents/portals/tick'
import processor_intents_constructedWalls_tick from './processor/intents/constructedWalls/tick'
import processor_intents_links_tick from './processor/intents/links/tick'
import processor_intents_extractors_tick from './processor/intents/extractors/tick'
import processor_intents_towers_tick from './processor/intents/towers/tick'
import processor_intents_controllers_tick from './processor/intents/controllers/tick'
import processor_intents_labs_tick from './processor/intents/labs/tick'
import processor_intents_containers_tick from './processor/intents/containers/tick'
import processor_intents_terminal_tick from './processor/intents/terminal/tick'
import processor_intents_tombstones_tick from './processor/intents/tombstones/tick'
import processor_intents_ruins_tick from './processor/intents/ruins/tick'
import processor_intents_factories_tick from './processor/intents/factories/tick'
import processor_intents_nukes_tick from './processor/intents/nukes/tick'
import processor_intents_storages_tick from './processor/intents/storages/tick'
import { logger } from './logger';

let roomsQueue: any,
    // _usersQueue: any,
    lastRoomsStatsSaveTime = 0,
    currentHistoryPromise = q.when();

const KEEPER_ID = "3";
const INVADER_ID = "2";

function processRoom(
    roomId: any,
    { intents, roomObjects, users, roomTerrain, gameTime, roomInfo, flags }: any) {

    return q.when().then(() => {
        const bulk = driver.bulkObjectsWrite();
        const bulkUsers = driver.bulkUsersWrite();
        const bulkFlags = driver.bulkFlagsWrite();
        const bulkUsersPowerCreeps = driver.bulkUsersPowerCreeps();
        // const _oldObjects = {};
        // let _hasNewbieWalls = false;
        const stats = driver.getRoomStatsUpdater(roomId);
        const objectsToHistory: Record<string, any> = {};
        const roomSpawns: any[] = [];
        const roomExtensions: any[] = [];
        const roomNukes: any[] = [];
        const keepers: any[] = [];
        const invaders: any[] = [];
        let invaderCore: any = null;
        const oldRoomInfo = _.clone(roomInfo);

        roomInfo.active = false;

        const terrainItem = roomTerrain[_.findKey(roomTerrain)];
        if (terrainItem.terrain) {
            roomTerrain = terrainItem.terrain;
        }

        let eventLog: any[] = [];

        let scope: Record<string, any> = {
            roomObjects, roomTerrain, bulk, bulkUsers, bulkUsersPowerCreeps, stats, flags,
            bulkFlags, gameTime, roomInfo, users, eventLog
        };

        _.forEach(roomObjects, (object) => {
            if (!object) {
                return;
            }

            if (object.type == 'creep') {
                object._actionLog = object.actionLog;
                object._ticksToLive = object.ageTime - gameTime;
                object.actionLog = {
                    attacked: null,
                    healed: null,
                    attack: null,
                    rangedAttack: null,
                    rangedMassAttack: null,
                    rangedHeal: null,
                    harvest: null,
                    heal: null,
                    repair: null,
                    build: null,
                    say: null,
                    upgradeController: null,
                    reserveController: null
                };
                if (object.user == KEEPER_ID) {
                    keepers.push(object);
                } else if ((object.user == INVADER_ID) && !object.strongholdId) {
                    invaders.push(object);
                }
            }
            if (object.type == 'invaderCore') {
                invaderCore = object;
                object._actionLog = object.actionLog;
                object.actionLog = {
                    transferEnergy: null,
                    reserveController: null,
                    attackController: null,
                    upgradeController: null
                };
                if (object.deployTime) {
                    roomInfo.active = true;
                }
            }
            if (object.type == 'link') {
                object._actionLog = object.actionLog;
                object.actionLog = {
                    transferEnergy: null
                };
            }
            if (object.type == 'lab') {
                object._actionLog = object.actionLog;
                object.actionLog = {
                    runReaction: null
                };
            }
            if (object.type == 'tower') {
                object._actionLog = object.actionLog;
                object.actionLog = {
                    attack: null,
                    heal: null,
                    repair: null
                };
            }
            if (object.type == 'controller') {
                scope.roomController = object;
                if (object.reservation && object.reservation.user == '2' &&
                    (object.reservation.endTime - gameTime) < (ScreepsConstants.CONTROLLER_RESERVE_MAX - ScreepsConstants.INVADER_CORE_CONTROLLER_POWER * ScreepsConstants.CONTROLLER_RESERVE)) {
                    roomInfo.active = true;
                }
                if (object.user && object.user !== '2') {
                    roomInfo.active = true;
                }
            }
            if (object.type == 'observer') {
                object.observeRoom = null;
            }
            if (object.user && object.user != '3' && !object.userNotActive && object.type != 'flag' && !object.strongholdId && object.type !== 'controller') {
                roomInfo.active = true;
            }
            if (object.type == 'powerBank' && gameTime > object.decayTime - 500) {
                roomInfo.active = true;
            }
            if (object.type == 'deposit' && gameTime > object.decayTime - 500) {
                roomInfo.active = true;
            }
            if (object.type == 'energy') {
                roomInfo.active = true;
            }
            if (object.type == 'nuke') {
                roomInfo.active = true;
                roomNukes.push(object);
            }
            if (object.type == 'tombstone') {
                roomInfo.active = true;
            }
            if (object.type == 'portal') {
                roomInfo.active = true;
            }
            if (object.type == 'constructedWall' && object.decayTime && object.user) {
                // _hasNewbieWalls = true;
            }

            if (object.type == 'extension') {
                roomExtensions.push(object);
            }
            if (object.type == 'spawn') {
                roomSpawns.push(object);
            }
            if (object.type == 'powerCreep') {
                object._actionLog = object.actionLog;
                object.actionLog = {
                    spawned: null,
                    attack: null,
                    attacked: null,
                    healed: null,
                    power: null,
                    say: null,
                };
            }
            if (object.type == 'factory') {
                object._actionLog = object.actionLog;
                object.actionLog = {
                    produce: null
                };
            }

            driver.config.emit('processObject', object, roomObjects, roomTerrain, gameTime, roomInfo, bulk, bulkUsers);

        });

        intents = intents || { users: {} };
        driver.pathFinder.make({ RoomPosition: fakeRuntime.RoomPosition });

        for (let nuke of roomNukes) {
            processor_intents_nukes_pretick(nuke, intents, scope);
        }

        for (let keeper of keepers) {
            const i = processor_intents_creeps_keepers_pretick(keeper, scope);

            intents.users[keeper.user] = intents.users[keeper.user] || {};
            intents.users[keeper.user].objects = intents.users[keeper.user].objects || {};
            const objectsIntents = intents.users[keeper.user].objects;
            _.forEach(i, (ii, objId: any) => {
                objectsIntents[objId] = _.assign(
                    ii,
                    objectsIntents[objId] || {}
                );
            });
        }

        for (let invader of invaders) {
            const i = processor_intents_creeps_invaders_pretick(invader, scope);

            intents.users[invader.user] = intents.users[invader.user] || {};
            intents.users[invader.user].objects = intents.users[invader.user].objects || {};
            const objectIntents = intents.users[invader.user].objects;
            _.forEach(i, (ii, objId: any) => {
                objectIntents[objId] = _.assign(
                    ii,
                    objectIntents[objId] || {}
                );
            });
        }

        if (invaderCore && invaderCore.user) {
            const i = processor_intents_invader_core_pretick(invaderCore, scope);

            intents.users[invaderCore.user] = intents.users[invaderCore.user] || {};
            intents.users[invaderCore.user].objects = intents.users[invaderCore.user].objects || {};
            _.forEach(i, (ii, objId: any) => {
                intents.users[invaderCore.user].objects[objId] = _.assign(
                    ii,
                    intents.users[invaderCore.user].objects[objId] || {}
                );
            });
        }

        if (roomSpawns.length || roomExtensions.length) {
            processor_intents__calc_spawns(roomSpawns, roomExtensions, scope);
        }

        movement.init(roomObjects, roomTerrain);

        if (intents) {

            _.forEach(intents.users, (userIntents, userId) => {

                if (userIntents.objectsManual) {
                    userIntents.objects = userIntents.objects || {};
                    _.extend(userIntents.objects, userIntents.objectsManual);
                }

                for (const objectId in userIntents.objects) {

                    const objectIntents = userIntents.objects[objectId], object = roomObjects[objectId];

                    if (objectId == 'room') {
                        processor_intents_room_intents(userId, objectIntents, scope);
                        continue;
                    }

                    if (!object || object._skip || object.user && object.user != userId) continue;

                    if (object.type == 'creep')
                        processor_intents_creeps_intents(object, objectIntents, scope);
                    if (object.type == 'powerCreep')
                        processor_intents_power_creeps_intents(object, objectIntents, scope);
                    if (object.type == 'link')
                        processor_intents_links_intents(object, objectIntents, scope);
                    if (object.type == 'tower')
                        processor_intents_towers_intents(object, objectIntents, scope);
                    if (object.type == 'lab')
                        processor_intents_labs_intents(object, objectIntents, scope);
                    if (object.type == 'spawn')
                        processor_intents_spawns_intents(object, objectIntents, scope);

                    if (object.type == 'constructionSite') {
                    }

                    if (object.type == 'rampart') {
                        if (objectIntents.setPublic) {
                            processor_intents_ramparts_set_public(object, objectIntents.setPublic, scope);
                        }
                    }

                    if (object.type == 'terminal') {
                        if (objectIntents.send) {
                            processor_intents_terminal_send(object, objectIntents.send, scope);
                        }
                    }

                    if (object.type == 'nuker') {
                        if (objectIntents.launchNuke) {
                            processor_intents_nukers_launch_nuke(object, objectIntents.launchNuke, scope);
                        }
                    }

                    if (object.type == 'observer') {
                        if (objectIntents.observeRoom) {
                            object.observeRoom = objectIntents.observeRoom.roomName;
                        }
                    }

                    if (object.type == 'powerSpawn') {
                        processor_intents_power_spawns_intents(object, objectIntents, scope);
                    }

                    if (object.type == 'invaderCore') {
                        processor_intents_invader_core_intents(object, objectIntents, scope);
                    }

                    if (object.type == 'factory') {
                        if (objectIntents.produce) {
                            processor_intents_factories_produce(object, objectIntents.produce, scope);
                        }
                    }

                    if (object.type == 'controller') {
                        if (objectIntents.unclaim) {
                            processor_intents_controllers_unclaim(object, objectIntents.unclaim, scope);
                        }
                        if (objectIntents.activateSafeMode) {
                            processor_intents_controllers_activateSafeMode(object, objectIntents.activateSafeMode, scope);
                        }
                    }

                    if (objectIntents.notifyWhenAttacked && (ScreepsConstants.CONSTRUCTION_COST[object.type] || object.type == 'creep' || object.type == 'powerCreep')) {
                        bulk.update(object, { notifyWhenAttacked: !!objectIntents.notifyWhenAttacked.enabled });
                    }


                    driver.config.emit('processObjectIntents', object, userId, objectIntents, roomObjects, roomTerrain,
                        gameTime, roomInfo, bulk, bulkUsers);
                }
            });
        }

        movement.check(scope.roomController && scope.roomController.safeMode > gameTime ? scope.roomController.user : false);

        scope.energyAvailable = _(roomObjects).filter((i: any) => !i.off && (i.type == 'spawn' || i.type == 'extension')).sum('store.energy');

        const mapView: Record<string, any> = {
            w: [],
            r: [],
            pb: [],
            p: [],
            s: [],
            c: [],
            m: [],
            k: []
        };

        const resultPromises: any[] = [];
        // const userVisibility: any = {};

        _.forEach(roomObjects, (object) => {

            if (!object || object._skip) {
                return;
            }

            if (object.type == 'invaderCore')
                processor_intents_invader_core_tick(object, scope);
            if (object.type == 'energy')
                processor_intents_energy_tick(object, scope);
            if (object.type == 'source')
                processor_intents_sources_tick(object, scope);
            if (object.type == 'deposit')
                processor_intents_deposits_tick(object, scope);
            if (object.type == 'mineral')
                processor_intents_minerals_tick(object, scope);
            if (object.type == 'creep')
                processor_intents_creeps_tick(object, scope);
            if (object.type == 'powerCreep')
                processor_intents_power_creeps_tick(object, scope);
            if (object.type == 'spawn')
                processor_intents_spawns_tick(object, scope);
            if (object.type == 'rampart')
                processor_intents_ramparts_tick(object, scope);
            if (object.type == 'extension')
                processor_intents_extensions_tick(object, scope);
            if (object.type == 'road')
                processor_intents_roads_tick(object, scope);
            if (object.type == 'constructionSite')
                processor_intents_construction_sites_tick(object, scope);
            if (object.type == 'keeperLair')
                processor_intents_keeper_lairs_tick(object, scope);
            if (object.type == 'portal')
                processor_intents_portals_tick(object, scope);
            if (object.type == 'constructedWall')
                processor_intents_constructedWalls_tick(object, scope);
            if (object.type == 'link')
                processor_intents_links_tick(object, scope);
            if (object.type == 'extractor')
                processor_intents_extractors_tick(object, scope);
            if (object.type == 'tower')
                processor_intents_towers_tick(object, scope);
            if (object.type == 'controller')
                processor_intents_controllers_tick(object, scope);
            if (object.type == 'lab')
                processor_intents_labs_tick(object, scope);
            if (object.type == 'container')
                processor_intents_containers_tick(object, scope);
            if (object.type == 'terminal')
                processor_intents_terminal_tick(object, scope);
            if (object.type == 'tombstone')
                processor_intents_tombstones_tick(object, scope);
            if (object.type == 'ruin')
                processor_intents_ruins_tick(object, scope);
            if (object.type == 'factory')
                processor_intents_factories_tick(object, scope);

            if (object.type == 'nuke') {
                processor_intents_nukes_tick(object, scope);
            }

            if (object.type == 'observer') {
                bulk.update(object, { observeRoom: object.observeRoom });
                //resultPromises.push(core.setUserRoomVisibility(object.user, object.observeRoom));
            }

            if (object.type == 'storage') {
                processor_intents_storages_tick(object, scope);
            }

            if (object.effects) {
                const collapseEffect: any = _.find(object.effects, { effect: ScreepsConstants.EFFECT_COLLAPSE_TIMER });
                if (collapseEffect && collapseEffect.endTime <= gameTime) {
                    bulk.remove(object._id);
                    delete roomObjects[object._id];
                    return;
                }
            }

            if (object.type == 'powerBank' || object.type == 'deposit') {
                if (gameTime >= object.decayTime - 1) {
                    bulk.remove(object._id);
                    delete roomObjects[object._id];
                }
            }

            if (object.type != 'flag') {
                objectsToHistory[object._id] = object;

                if (object.type == 'creep' || object.type == 'powerCreep') {
                    objectsToHistory[object._id] = JSON.parse(JSON.stringify(object));
                    objectsToHistory[object._id]._id = "" + object._id;
                    delete objectsToHistory[object._id]._actionLog;
                    delete objectsToHistory[object._id]._ticksToLive;
                    if (object.actionLog.say && !object.actionLog.say.isPublic) {
                        delete objectsToHistory[object._id].actionLog.say;
                    }
                }
            }

            if (object.user) {
                //userVisibility[object.user] = true;

                if (object.type != 'constructionSite' && !object.newbieWall &&
                    (object.type != 'rampart' || !object.isPublic)) {
                    mapView[object.user] = mapView[object.user] || [];
                    mapView[object.user].push([object.x, object.y]);
                }
            }
            else if (object.type == 'constructedWall') {
                mapView.w.push([object.x, object.y]);
            }
            else if (object.type == 'road') {
                mapView.r.push([object.x, object.y]);
            }
            else if (object.type == 'powerBank') {
                mapView.pb.push([object.x, object.y]);
            }
            else if (object.type == 'portal') {
                mapView.p.push([object.x, object.y]);
            }
            else if (object.type == 'source') {
                mapView.s.push([object.x, object.y]);
            }
            else if (object.type == 'mineral') {
                mapView.m.push([object.x, object.y]);
            }
            else if (object.type == 'deposit') {
                mapView.m.push([object.x, object.y]);
            }
            else if (object.type == 'controller') {
                mapView.c.push([object.x, object.y]);
            }
            else if (object.type == 'keeperLair') {
                mapView.k.push([object.x, object.y]);
            }
            else if (object.type == 'energy' && object.resourceType == 'power') {
                mapView.pb.push([object.x, object.y]);
            }
        });

        /*for(var user in userVisibility) {
            resultPromises.push(core.setUserRoomVisibility(user, roomId));
        }*/

        driver.config.emit('processRoom', roomId, roomInfo);

        driver.config.emit('processorLoopStage', 'saveRoom', roomId);

        resultPromises.push(driver.mapViewSave(roomId, mapView));
        resultPromises.push(bulk.execute());
        resultPromises.push(bulkUsers.execute());
        resultPromises.push(bulkFlags.execute());
        resultPromises.push(driver.saveRoomEventLog(roomId, eventLog));


        if (!_.isEqual(roomInfo, oldRoomInfo)) {
            resultPromises.push(driver.saveRoomInfo(roomId, roomInfo));
        }

        if (roomInfo.active) {
            saveRoomHistory(roomId, objectsToHistory, gameTime);
        }

        if (Date.now() > lastRoomsStatsSaveTime + 30 * 1000) {
            driver.roomsStatsSave();
            lastRoomsStatsSaveTime = Date.now();
        }

        return q.all(resultPromises);
    });
}

function saveRoomHistory(roomId: any, objects: any, gameTime: any) {

    return currentHistoryPromise.then(() => {
        let promise = q.when();

        if (!(gameTime % driver.config.historyChunkSize)) {
            const baseTime = Math.floor((gameTime - 1) / driver.config.historyChunkSize) * driver.config.historyChunkSize;
            promise = driver.history.upload(roomId, baseTime);
        }

        const data = JSON.stringify(objects);
        currentHistoryPromise = promise.then(() => driver.history.saveTick(roomId, gameTime, data));
        return currentHistoryPromise;
    });
}


driver.connect('processor')
    .then(() => driver.queue.create('rooms', 'read'))
    .catch((error: any) => {
        console.error('Error connecting to driver:', error);
        process.exit(1);
    })
    .then((_roomsQueue: any) => {

        roomsQueue = _roomsQueue;

        function loop() {

            let roomId: any;

            driver.config.emit('processorLoopStage', 'start');

            roomsQueue.fetch()
                .then((_roomId: any) => {
                    driver.config.emit('processorLoopStage', 'getRoomData', _roomId);
                    roomId = _roomId;
                    return q.all([
                        driver.getRoomIntents(_roomId),
                        driver.getRoomObjects(_roomId),
                        driver.getRoomTerrain(_roomId),
                        driver.getGameTime(),
                        driver.getRoomInfo(_roomId),
                        driver.getRoomFlags(_roomId),
                    ])
                })
                .then((result: any) => {
                    driver.config.emit('processorLoopStage', 'processRoom', roomId);
                    processRoom(roomId, {
                        intents: result[0],
                        roomObjects: result[1].objects,
                        users: result[1].users,
                        roomTerrain: result[2],
                        gameTime: result[3],
                        roomInfo: result[4],
                        flags: result[5]
                    })
                        .catch((error) => logger.info('Error processing room ' + roomId + ':', _.isObject(error) ? (error.stack || error) : error))
                        .then(() => {
                            return driver.clearRoomIntents(roomId);
                        })
                        .then(() => roomsQueue.markDone(roomId));
                })
                .catch((error: any) => console.error('Error in processor loop:', _.isObject(error) && error.stack || error))
                .then(() => {
                    driver.config.emit('processorLoopStage', 'finish', roomId);
                    setTimeout(loop, 0)
                });
        }

        loop();

    });


if (typeof self == 'undefined') {
    setInterval(() => {
        const rejections = (q as any).getUnhandledReasons();
        rejections.forEach((i: any) => console.error('Unhandled rejection:', i));
        (q as any).resetUnhandledRejections();
    }, 1000);
}