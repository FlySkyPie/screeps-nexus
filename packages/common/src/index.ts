import q from 'q';
import _ from 'lodash';

import * as storage from './storage';
import StorageInstance from './storage';
import * as rpc from './rpc';
import { StorageEnvKey } from './constants/storage-env-key';

export {  storage, rpc };

// export var configManager = require('./config-manager');
// export var storage = require('./storage');
// export var rpc = require('./rpc');

export function encodeTerrain(terrain: any) {
    let result = '';
    for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
            const objects = _.filter(terrain, { x, y });
            let code = 0;
            if (_.any(objects, { type: 'wall' })) {
                code = code | 1;
            }
            if (_.any(objects, { type: 'swamp' })) {
                code = code | 2;
            }
            result = result + code;
        }
    }
    return result;
}

export function decodeTerrain(str: any, room: any) {
    const result = [];

    for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
            const code = str.charAt(y * 50 + x);
            if (code & 1) {
                result.push({ room, x, y, type: 'wall' });
            }
            if (code & 2) {
                result.push({ room, x, y, type: 'swamp' });
            }
        }
    }

    return result;
}

export function checkTerrain(terrain: any, x: any, y: any, mask: any) {
    return (parseInt(terrain.charAt(y * 50 + x)) & mask) > 0;
}

export function getGametime() {
    return StorageInstance.env.get(StorageEnvKey.GAMETIME).then((data: any) => parseInt(data));
}

export function getDiff(oldData: any, newData: any) {

    function getIndex(data: any) {
        const index: any = {};
        _.forEach(data, (obj) => index[obj._id] = obj);
        return index;
    }


    const result: any = {};
    const oldIndex: any = getIndex(oldData);
    const newIndex: any = getIndex(newData);

    _.forEach(oldData, (obj) => {
        if (newIndex[obj._id]) {
            const newObj = newIndex[obj._id];
            const objDiff: any = result[obj._id] = {};
            for (var key in obj) {
                if (_.isUndefined(newObj[key])) {
                    objDiff[key] = null;
                }
                else if ((typeof obj[key]) != (typeof newObj[key]) || obj[key] && !newObj[key]) {
                    objDiff[key] = newObj[key];
                }
                else if (_.isObject(obj[key])) {

                    objDiff[key] = {};

                    for (var subkey in obj[key]) {
                        if (!_.isEqual(obj[key][subkey], newObj[key][subkey])) {
                            objDiff[key][subkey] = newObj[key][subkey];
                        }
                    }
                    for (var subkey in newObj[key]) {
                        if (_.isUndefined(obj[key][subkey])) {
                            objDiff[key][subkey] = newObj[key][subkey];
                        }
                    }
                    if (!_.size(objDiff[key])) {
                        delete result[obj._id][key];
                    }
                }
                else if (!_.isEqual(obj[key], newObj[key])) {
                    objDiff[key] = newObj[key];
                }
            }
            for (var key in newObj) {
                if (_.isUndefined(obj[key])) {
                    objDiff[key] = newObj[key];
                }
            }
            if (!_.size(objDiff)) {
                delete result[obj._id];
            }
        }
        else {
            result[obj._id] = null;
        }
    });

    _.forEach(newData, (obj) => {
        if (!oldIndex[obj._id]) {
            result[obj._id] = obj;
        }
    });

    return result;
}

export function qSequence(collection: any, fn: any) {
    return _.reduce(collection, (promise, element, key) => promise.then(() => fn(element, key)), q.when());
}

export function roomNameToXY(name: any) {

    name = name.toUpperCase();

    const match = name.match(/^(\w)(\d+)(\w)(\d+)$/);
    if (!match) {
        return [undefined, undefined];
    }
    let [, hor, x, ver, y] = match;

    if (hor == 'W') {
        x = -x - 1;
    }
    else {
        x = +x;
    }
    if (ver == 'N') {
        y = -y - 1;
    }
    else {
        y = +y;
    }
    return [x, y];
}

export function getRoomNameFromXY(x: any, y: any) {
    if (x < 0) {
        x = 'W' + (-x - 1);
    }
    else {
        x = 'E' + (x);
    }
    if (y < 0) {
        y = 'N' + (-y - 1);
    }
    else {
        y = 'S' + (y);
    }
    return "" + x + y;
}

export function calcWorldSize(rooms: any) {
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    rooms.forEach((room: any) => {
        const [x, y] = roomNameToXY(room._id);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    });
    return Math.max(maxX - minX + 1, maxY - minY + 1);
}
