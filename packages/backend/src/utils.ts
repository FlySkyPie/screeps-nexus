import _ from 'lodash';
import q from 'q';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

import * as common from '@screeps/common/src/index';
import StorageInstance from '@screeps/common/src/storage';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';

const config = common.configManager.config;
const db = StorageInstance.db;

export function roomNameFromXY(_x: number, _y: number) {
    let x = "", y = "";

    if (_x < 0) {
        x = 'W' + (-x - 1);
    }
    else {
        x = 'E' + (x);
    }
    if (_y < 0) {
        y = 'N' + (-y - 1);
    }
    else {
        y = 'S' + (y);
    }
    return "" + x + y;
}

export function roomNameToXY(name: string) {
    let [_, hor, _x, ver, _y] = name.match(/^(\w)(\d+)(\w)(\d+)$/)!;
    let x: number, y: number;

    if (hor == 'W') {
        x = -_x - 1;
    }
    else {
        x = +_x;
        //x--;
    }
    if (ver == 'N') {
        y = -_y - 1;
    }
    else {
        y = +_y;
        //y--;
    }
    return [x, y];
}

export function translateModulesFromDb(modules: any) {
    modules = modules || {};

    for (const key in modules) {
        let newKey = key.replace(/\$DOT\$/g, '.');
        newKey = newKey.replace(/\$SLASH\$/g, '/');
        newKey = newKey.replace(/\$BACKSLASH\$/g, '\\');
        if (newKey != key) {
            modules[newKey] = modules[key];
            delete modules[key];
        }
    }
    return modules;
}

export function translateModulesToDb(modules: any) {
    modules = modules || {};

    for (const key in modules) {
        let newKey = key.replace(/\./g, '$DOT$');
        newKey = newKey.replace(/\//g, '$SLASH$');
        newKey = newKey.replace(/\\/g, '$BACKSLASH$');

        if (newKey[0] == '$') {
            delete modules[key];
            continue;
        }

        if (newKey != key) {
            modules[newKey] = modules[key];
            delete modules[key];
        }
    }

    if (!modules.main) {
        modules.main = '';
    }

    return modules;
}

export function getUserWorldStatus(user: any) {
    return db['rooms.objects'].count({ user: "" + user._id })
        .then((objectsCnt: any) => {
            if (!objectsCnt) {
                return { status: 'empty' };
            }
            return db['rooms.objects'].find({
                $and: [
                    { user: "" + user._id },
                    { type: { $in: ['spawn', 'controller'] } }
                ]
            }).then((objects: any) => {
                let spawns = false;
                if (objects) {
                    objects.forEach((i: any) => {
                        if (i.type == 'spawn') {
                            if (!_.any(objects, { type: 'controller', room: i.room, user: i.user })) {
                                return;
                            }
                            spawns = true;
                        }
                    })
                }
                return { status: spawns ? 'normal' : 'lost' };
            });
        });
}

export async function respawnUser(userId: any) {
    return db['users'].findOne({ username: ScreepsConstants.SYSTEM_USERNAME })
        .then(async (systemUser: any) => {
            if (!systemUser) {
                return q.reject('no system user');
            }
            const gameTime = await common.getGametime();
            await db['rooms.objects'].removeWhere({ $and: [{ user: "" + userId }, { type: { $in: ['creep', 'powerCreep', 'constructionSite'] } }] });
            await db['users.power_creeps'].removeWhere({ user: "" + userId });
            const objects = await db['rooms.objects'].find({ user: "" + userId, type: { $in: _.keys(ScreepsConstants.CONSTRUCTION_COST) } });
            if (objects.length) {
                await db['rooms.objects'].insert(objects.map((i: any) => ({
                    type: 'ruin',
                    user: "" + systemUser._id,
                    room: i.room,
                    x: i.x,
                    y: i.y,
                    structure: {
                        id: i._id,
                        type: i.type,
                        hits: 0,
                        hitsMax: i.hitsMax,
                        user: "" + systemUser._id
                    },
                    store: i.store || {},
                    destroyTime: gameTime,
                    decayTime: gameTime + 500000
                })));
            }
            await db['rooms.objects'].update({ user: "" + userId, type: 'ruin' }, { $set: { user: "" + systemUser._id } });
            await db['rooms.objects'].removeWhere({ user: "" + userId, type: { $ne: 'controller' } });
            await db['rooms.flags'].removeWhere({ user: "" + userId });
            const controllers = db['rooms.objects'].find({ $and: [{ user: "" + userId }, { type: 'controller' }] });
            for (let i in controllers) {
                await db.rooms.update({ _id: controllers[i].room }, { $set: { status: 'normal' } });
            }
            await db['rooms.objects'].update({ $and: [{ user: "" + userId }, { type: 'controller' }] }, {
                $set: {
                    level: 0,
                    hits: 0,
                    hitsMax: 0,
                    progress: 0,
                    progressTotal: 0,
                    user: null,
                    downgradeTime: null,
                    safeMode: null,
                    safeModeAvailable: 0,
                    safeModeCooldown: null
                }
            });
        })
        .then(() => db['users'].update({ _id: "" + userId }, { $set: { rooms: [] } }));
}

export function withHelp(array: [string, Function]) {
    const fn = array[1];
    (fn as any)._help = array[0];
    return fn;
}

export function generateCliHelp(prefix: string, container: any) {
    return `Available methods:\r\n` + Object.keys(container).filter(i => typeof container[i] == 'function').map(i => ' - ' + prefix + (container[i]._help || i)).join('\r\n');
}

export function writePng(colors: any, width: any, height: any, filename: any) {

    const image = new PNG({ width, height });

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (width * y + x) << 2;

            image.data[idx] = colors[y][x][0];
            image.data[idx + 1] = colors[y][x][1];
            image.data[idx + 2] = colors[y][x][2];
            image.data[idx + 3] = colors[y][x][3] === undefined ? 255 : colors[y][x][3];
        }
    }

    const defer = q.defer();
    image.pack().pipe(fs.createWriteStream(filename)).on('finish', () => defer.resolve());
    return defer.promise;
}

export function createTerrainColorsMap(terrain: any, zoomIn: any) {
    const colors: any = {}, width = 50, height = 50;

    for (let y = 0; y < height; y++) {
        if (zoomIn) {
            colors[y * 3] = {};
            colors[y * 3 + 1] = {};
            colors[y * 3 + 2] = {};
        }
        else {
            colors[y] = {};
        }
        for (let x = 0; x < width; x++) {

            let color;
            if (common.checkTerrain(terrain, x, y, ScreepsConstants.TERRAIN_MASK_WALL)) {
                color = [0, 0, 0];
            }
            else if (common.checkTerrain(terrain, x, y, ScreepsConstants.TERRAIN_MASK_SWAMP)) {
                color = [35, 37, 19];
            }
            else if (x == 0 || y == 0 || x == 49 || y == 49) {
                color = [50, 50, 50];
            }
            else {
                color = [43, 43, 43];
            }
            if (zoomIn) {
                for (let dx = 0; dx < 3; dx++) {
                    for (let dy = 0; dy < 3; dy++) {
                        colors[y * 3 + dy][x * 3 + dx] = color;
                    }
                }
            }
            else {
                colors[y][x] = color;
            }
        }
    }

    return colors;
}

export function writeTerrainToPng(terrain: any, filename: any, zoomIn: any) {

    const colors = exports.createTerrainColorsMap(terrain, zoomIn);
    return exports.writePng(colors, 50 * (zoomIn ? 3 : 1), 50 * (zoomIn ? 3 : 1), filename);
}

export function loadBot(name: any) {
    const dir = config.common.bots[name];
    if (!dir) {
        throw new Error(`Bot AI with the name "${name}" doesn't exist`);
    }
    const stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
        throw new Error(`"${dir}" is not a directory`);
    }
    fs.statSync(path.resolve(dir, 'main.js'));
    const files = fs.readdirSync(dir), modules: any = {};
    files.forEach(file => {
        const m = file.match(/^(.*)\.js$/);
        if (!m) {
            return;
        }
        modules[m[1]] = fs.readFileSync(path.resolve(dir, file), { encoding: 'utf8' });
    });
    return exports.translateModulesToDb(modules);
}

export function reloadBotUsers(name: any) {

    return db.users.find({ bot: name })
        .then((users: any) => {
            if (!users.length) {
                return 'No bot players found';
            }
            const modules = exports.loadBot(name);
            const timestamp = Date.now();

            return db['users.code'].insert(users.map((i: any) => ({
                user: i._id,
                branch: 't' + timestamp,
                timestamp,
                activeWorld: true,
                activeSim: true,
                modules
            })))
                .then(() => db['users.code'].removeWhere({
                    $and: [
                        { user: { $in: users.map((i: any) => i._id) } },
                        { branch: { $ne: 't' + timestamp } }
                    ]
                }))
                .then(() => 'Reloaded scripts for users: ' + users.map((i: any) => i.username).join(', '));
        });
}

export function isBus(coord: any) {
    return coord < 0 && (coord + 1) % 10 == 0 || coord > 0 && (coord) % 10 == 0 || coord == 0;
}

export function isCenter(x: number, y: number) {
    return (x < 0 &&
        Math.abs(x + 1) % 10 >= 4 &&
        Math.abs(x + 1) % 10 <= 6 ||
        x >= 0 && Math.abs(x) % 10 >= 4 &&
        Math.abs(x) % 10 <= 6) && (
            y < 0 &&
            Math.abs(y + 1) % 10 >= 4 &&
            Math.abs(y + 1) % 10 <= 6 ||
            y >= 0 && Math.abs(y) % 10 >= 4 &&
            Math.abs(y) % 10 <= 6);
}

export function isVeryCenter(x: any, y: any) {
    return (x < 0 && Math.abs(x + 1) % 10 == 5 || x >= 0 && Math.abs(x) % 10 == 5) &&
        (y < 0 && Math.abs(y + 1) % 10 == 5 || y >= 0 && Math.abs(y) % 10 == 5);
}

export function findFreePos(roomName: any, distance: any, rect: any, exclude?: any) {
    if (!rect) {
        rect = { x1: 4, x2: 45, y1: 4, y2: 45 };
    }

    return q.all([
        db['rooms.objects'].find({ room: roomName }),
        db['rooms.terrain'].findOne({ room: roomName })])
        .then(([objects, terrain]) => {
            if (!terrain) {
                return q.reject();
            }
            let x: any,
                y: any,
                spot,
                hasObjects,
                counter = 0;
            do {

                x = rect.x1 + Math.floor(Math.random() * (rect.x2 - rect.x1));
                y = rect.y1 + Math.floor(Math.random() * (rect.y2 - rect.y1));
                if (exclude && exclude.x == x && exclude.y == y) {
                    continue;
                }
                spot = true;
                for (let dx = -distance; dx <= distance; dx++) {
                    for (let dy = -distance; dy <= distance; dy++) {
                        if (common.checkTerrain(terrain.terrain, x + dx, y + dy, ScreepsConstants.TERRAIN_MASK_WALL)) {
                            spot = false;
                        }
                    }
                }
                hasObjects = _.any(objects, (i: any) =>
                    Math.abs(i.x - x) <= distance &&
                    Math.abs(i.y - y) <= distance &&
                    ScreepsConstants.OBSTACLE_OBJECT_TYPES.concat(['rampart', 'portal']).indexOf(i.type) != -1);
                counter++;
            }
            while ((!spot || hasObjects) && counter < 500);

            if (!spot || hasObjects) {
                return q.reject();
            }

            return { x, y };
        });
}