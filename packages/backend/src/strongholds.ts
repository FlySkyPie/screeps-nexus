import _ from 'lodash';
import q from 'q';
import util from 'util';
import zlib from 'zlib';

import * as  common from '@screeps/common/src/index';
import * as strongholds from '@screeps/common/src/strongholds';
import { StructureEnum } from '@screeps/common/src/constants/structure-enum';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import StorageInstance from '@screeps/common/src/storage';
import { StorageEnvKey } from '@screeps/common/src/constants/storage-env-key';

import * as  utils from './utils';
import { logger } from './logger';

const db = StorageInstance.db;

const strongholdDeployTime = 5000;

async function spawnStronghold(roomName: any, opts: any = {}) {

    if (!opts.deployTime) {
        opts.deployTime = 1;
    }

    if (!roomName) {
        return q.reject('invalid room');
    }

    if (opts.templateName && !strongholds.templates[opts.templateName]) {
        q.reject('invalid template');
    }
    const user = opts.user || "2";

    const gameTime = await common.getGametime();

    const [{ terrain }, objects] = await q.all([
        db['rooms.terrain'].findOne({ room: roomName }),
        db['rooms.objects'].find({ room: roomName, type: { $in: [StructureEnum.STRUCTURE_RAMPART, ...ScreepsConstants.OBSTACLE_OBJECT_TYPES] } })
    ]);

    const templateNames = opts.templateName ? [opts.templateName] : _.keys(strongholds.templates);

    const controller: any = _(objects).filter({ type: StructureEnum.STRUCTURE_CONTROLLER }).first();
    if (controller && (controller.user || (controller.reservation && controller.reservation.user != user))) {
        return q.reject('room occupied');
    }

    const spots: any = {};
    if (!_.isUndefined(opts.templateName) && !_.isUndefined(opts.x) && !_.isUndefined(opts.y)) {
        return opts;
    } else {
        for (let x = 4; x < 45; x++)
            for (let y = 4; y < 45; y++)
                for (let t of templateNames)
                    if (_.reduce(
                        strongholds.templates[t].structures,
                        (r, s: any) =>
                            r &&
                            !common.checkTerrain(terrain, x + s.dx, y + s.dy, ScreepsConstants.TERRAIN_MASK_WALL) &&
                            !_.some(objects, { x: x + s.dx, y: y + s.dy }), true)) {
                        if (_.isUndefined(spots[t])) {
                            spots[t] = [];
                        }
                        spots[t].push({ x, y });
                    }
    }

    if (!_.some(spots)) {
        return q.reject('No spots');
    }
    const selectedTemplateName = _.sample(_.keys(spots));
    const selectedTemplate = strongholds.templates[selectedTemplateName];
    const spot: any = _.sample(spots[selectedTemplateName]);

    const depositType = _.sample(_.keys(strongholds.coreRewards));

    const deployTime = gameTime + opts.deployTime;
    const strongholdId = `${"" + roomName}_${gameTime}`;
    const structures = _.reduce(selectedTemplate.structures, (acc: any[], i: any) => {
        if (i.type == StructureEnum.STRUCTURE_INVADER_CORE) {
            const core = _.merge({}, i, {
                room: roomName,
                x: 0 + spot.x + i.dx,
                y: 0 + spot.y + i.dy,
                user,
                templateName: selectedTemplateName,
                hits: ScreepsConstants.INVADER_CORE_HITS,
                hitsMax: ScreepsConstants.INVADER_CORE_HITS,
                nextExpandTime: deployTime + ScreepsConstants.INVADER_CORE_EXPAND_TIME[i.level],
                depositType,
                deployTime,
                strongholdId,
                effects: [{
                    effect: ScreepsConstants.EFFECT_INVULNERABILITY,
                    power: ScreepsConstants.EFFECT_INVULNERABILITY,
                    endTime: deployTime,
                    duration: strongholdDeployTime
                }]
            });
            delete core.dx;
            delete core.dy;
            acc.push(core);
        }
        if (i.type == StructureEnum.STRUCTURE_RAMPART) {
            acc.push({
                type: StructureEnum.STRUCTURE_RAMPART,
                room: roomName,
                x: 0 + spot.x + i.dx,
                y: 0 + spot.y + i.dy,
                user,
                hits: 1,
                hitsMax: 1,
                isPublic: true,
                strongholdId,
                nextDecayTime: deployTime
            });
        }
        return acc;
    }, []);

    if (controller) {
        await db['rooms.objects'].update({ _id: controller._id }, {
            $set:
            {
                user,
                level: 8,
                progress: 0,
                downgradeTime: deployTime,
                effects: [{
                    effect: ScreepsConstants.EFFECT_INVULNERABILITY,
                    power: ScreepsConstants.EFFECT_INVULNERABILITY,
                    endTime: deployTime,
                    duration: strongholdDeployTime
                }]
            }
        });
    }

    return db['rooms.objects'].insert(structures)
        .then(() => db['rooms'].update({ _id: roomName }, { $set: { active: true } }));
}

async function selectRoom(sectorCenter: any) {

    const sectorRegex = sectorCenter._id.replace(
        /^([WE]\d*)5([NS]\d*)5$/,
        (_str: any, p1: any, p2: any) => `^${p1}\\d${p2}\\d$`);
    return q.all([
        db['rooms'].find({ _id: { $regex: sectorRegex } }),
        db['rooms.objects'].find({ type: { $in: ['creep', 'controller'] }, room: { $regex: sectorRegex } })
    ])
        .then(([sectorRooms, sectorObjects]) => {

            const possibleRooms = _.filter(
                sectorRooms,
                (r: any) => {
                    const [x, y] = common.roomNameToXY(r._id);
                    if (r.bus || !utils.isCenter(x, y) || utils.isVeryCenter(x, y) || r._id.match('0$') || r._id.match('0[NS]')) {
                        return false;
                    }
                    const controller: any = _(sectorObjects).filter({ type: 'controller', room: r._id }).first();
                    if (!controller) {
                        return true;
                    }
                    if (!!controller.user || !!controller.reservation) {
                        return false;
                    }

                    return !_.some(
                        sectorObjects,
                        (o: any) =>
                            o.room == r._id &&
                            o.type == 'creep' &&
                            _.some(o.body, { type: 'claim' }));
                });
            if (_.some(possibleRooms)) {
                const room = _.sample(possibleRooms);
                return spawnStronghold(room._id, { deployTime: strongholdDeployTime });
            }
        });
}

async function buildMapGrid() {

    const compressedTerrainData = await StorageInstance.env.get(StorageEnvKey.TERRAIN_DATA);

    const buf = Buffer.from(compressedTerrainData, 'base64');
    const terrainData: any = JSON.parse((await util.promisify(zlib.inflate)(buf)).toString());

    const accessibleRooms = JSON.parse(await StorageInstance.env.get(StorageEnvKey.ACCESSIBLE_ROOMS));

    if (!accessibleRooms) return {};
    const dirs: any = {
        t: {
            startx: 0,
            starty: 0,
            dx: 1,
            dy: 0,
        },
        r: {
            startx: 49,
            starty: 0,
            dx: 0,
            dy: 1,
        },
        b: {
            startx: 0,
            starty: 49,
            dx: 1,
            dy: 0,
        },
        l: {
            startx: 0,
            starty: 0,
            dx: 0,
            dy: 1,
        },
    };
    let gridData: any = {};
    for (let roomName of accessibleRooms) {
        let [x, y] = common.roomNameToXY(roomName);
        let terrain = (_.find(terrainData, { room: roomName }) as any).terrain;
        let roomData: any = {};
        for (let dirName in dirs) {
            let { startx, starty, dx, dy } = dirs[dirName];
            let curx = startx;
            let cury = starty;
            let numExits = 0;
            for (let i = 0; i < 50; ++i) {
                if (terrain[cury * 50 + curx] == 0) {
                    numExits++;
                }
                curx += dx;
                cury += dy;
            }
            if (numExits > 0) {
                roomData[dirName] = numExits;
            }
        }
        gridData[`${x},${y}`] = roomData;
    }
    return gridData;
}

async function genStrongholds() {
    const [rooms, objects] = await q.all([
        db['rooms'].find({ $and: [{ _id: { $regex: '^[WE]\\d*5[NS]\\d*5$' } }, { 'status': { $ne: 'out of borders' } }] }),
        db['rooms.objects'].find({ $or: [{ type: 'invaderCore' }, { $and: [{ type: 'ruin' }, { 'structure.type': 'invaderCore' }] }] })
    ]);

    const sectorsWithoutCores = _.reject(
        rooms,
        (r: any) =>
            _.some(objects, (c: any) =>
                r._id == c.room.replace(
                    /^([WE]\d*)\d([NS]\d*)\d$/,
                    (_str: any, p1: any, p2: any) => `${p1}5${p2}5`)));

    for (let s of sectorsWithoutCores) {
        await selectRoom(s);
    }
}

async function expandStronghold(invaderCore: any, { gameTime, mapGrid }: any = {}) {

    if (!mapGrid) {
        mapGrid = await buildMapGrid();
    }
    if (!gameTime) {
        gameTime = await common.getGametime();
    }

    let openList = [invaderCore.room], closedList = [], found;

    let roomInfo = await db['rooms'].findOne({ _id: invaderCore.room });
    if (roomInfo.novice > Date.now() || roomInfo.respawnArea > Date.now()) {
        return false;
    }

    await db['rooms.objects'].update({ _id: invaderCore._id },
        { $set: { nextExpandTime: gameTime + ScreepsConstants.INVADER_CORE_EXPAND_TIME[invaderCore.level] } });

    do {
        let room = openList.shift();
        closedList.push(room);
        let [x, y] = common.roomNameToXY(room);
        let exits = _.shuffle(Object.keys(mapGrid[`${x},${y}`]));
        for (let dir of exits) {
            let dx = 0, dy = 0;
            if (dir == 't') {
                dy = -1;
            }
            if (dir == 'b') {
                dy = 1;
            }
            if (dir == 'l') {
                dx = -1;
            }
            if (dir == 'r') {
                dx = 1;
            }
            if (!mapGrid[`${x + dx},${y + dy}`]) {
                continue;
            }
            let nextRoom = common.getRoomNameFromXY(x + dx, y + dy);
            if (/(W|E)\d*0/.test(nextRoom) || /(N|S)\d*0/.test(nextRoom)) {
                continue;
            }
            let nextRoomInfo = await db['rooms'].findOne({ _id: nextRoom });
            if (nextRoomInfo.novice > Date.now() || nextRoomInfo.respawnArea > Date.now()) {
                continue;
            }
            let controller = await db['rooms.objects'].findOne({ type: 'controller', room: nextRoom });
            let hasCore = await db['rooms.objects'].count({ type: 'invaderCore', room: nextRoom });
            if (controller && !controller.user && !hasCore) {
                found = { room: nextRoom, controller };
                break;
            }
            if ((!controller || hasCore) && openList.indexOf(nextRoom) === -1 && closedList.indexOf(nextRoom) === -1) {
                openList.push(nextRoom);
            }
        }
    }
    while (!found && openList.length > 0);

    if (!found) {
        return false;
    }

    try {
        var { x, y } = await utils.findFreePos(found.room, 1, {
            x1: Math.max(1, found.controller.x - 5),
            x2: Math.min(48, found.controller.x + 5),
            y1: Math.max(1, found.controller.y - 5),
            y2: Math.min(48, found.controller.y + 5)
        }) as any;
    }
    catch (e) {
        logger.info('no pos', e);
        return false;
    }

    await db['rooms.objects'].insert({
        type: 'invaderCore',
        level: 0,
        room: found.room,
        x, y,
        user: '2',
        hits: ScreepsConstants.INVADER_CORE_HITS,
        hitsMax: ScreepsConstants.INVADER_CORE_HITS,
        strongholdId: invaderCore.strongholdId,
        effects: invaderCore.effects
    });
    await db['rooms'].update({ _id: found.room }, { $set: { active: true } });

    return true;
}

async function expandStrongholds() {

    let mapGrid = await buildMapGrid();

    let gameTime = await common.getGametime();
    let invaderCores = await db['rooms.objects'].find({
        type: 'invaderCore',
        deployTime: null,
        level: { $gt: 0 },
        nextExpandTime: { $lt: gameTime }
    });


    for (let invaderCore of invaderCores) {
        await expandStronghold(invaderCore, { gameTime, mapGrid });
    }
}


export { spawnStronghold };
export { selectRoom };
export { genStrongholds };
export { expandStronghold };
export { expandStrongholds };
export var templates = strongholds.templates;
