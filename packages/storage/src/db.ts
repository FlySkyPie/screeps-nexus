import loki from 'lokijs';
import q from 'q';
import fs from 'fs';
import _ from 'lodash';

import { Resource } from '@screeps/common/src/constants/resource';
import { ListItems } from '@screeps/common/src/tables/list-items';
import { ConfigManager } from '@screeps/common/src/config-manager';

import { StorageConstants } from './constants';
import { logger } from './logger';

const config = ConfigManager.config;

/**
 * @type Loki
 */
let db: loki;

Object.assign(config.storage, {
    dbOptions: { autosave: true, autosaveInterval: 10000 },
    getDb() {
        try {
            fs.statSync(StorageConstants.DB_PATH ?? "");
        }
        catch (e) {
            fs.writeFileSync(StorageConstants.DB_PATH ?? "", '');
        }
        return new loki(StorageConstants.DB_PATH ?? "", config.storage.dbOptions);
    },
    async loadDb() {
        db = config.storage.getDb();
        return q.ninvoke(db, 'loadDatabase', {})
            .then(upgradeDb);
    }
});

function upgradeDb() {

    let upgradeInterval;
    if (process.send) {
        upgradeInterval = setInterval(() => {
            process.send && process.send('storageUpgrading');
        }, 1000);
    }

    let env = db.getCollection('env');
    let envData = env.get(1);
    if (!envData) {
        return;
    }
    if (!envData.databaseVersion || envData.databaseVersion < 4) {
        logger.info("Upgrading database to version 4");

        const innerRooms = db.getCollection('rooms').find({ _id: { $regex: '^[WE][1-9][NS][1-9]$' } });
        innerRooms.forEach((room: any) => {
            room.bus = false;
            return db.getCollection('rooms').update(room);
        });

        const depositTypes = [Resource.RESOURCE_SILICON, Resource.RESOURCE_METAL, Resource.RESOURCE_BIOMASS, Resource.RESOURCE_MIST];
        const busRooms = db.getCollection('rooms').find({ $or: [{ _id: { $regex: '^[WE]\\d*0' } }, { _id: { $regex: '0$' } }] });
        busRooms.forEach((room: any) => {
            const result: any = /^[WE](\d+)[NS](\d+)$/.exec(room._id);
            const [match, longitude, latitude] = result ?? [];
            if (match) {
                room.depositType = depositTypes[(longitude + latitude) % 4];
                return db.getCollection('rooms').update(room);
            }
        });
        envData.databaseVersion = 4;
        env.update(envData);
    }

    if (envData.databaseVersion < 5) {
        logger.info("Upgrading database to version 5");

        const energyOnly = function energyOnly(structure: any) {
            structure.store = { energy: structure.energy };
            structure.storeCapacityResource = { energy: structure.energyCapacity };
            delete structure.energy;
            delete structure.energyCapacity;
        };

        const storeOnly = function storeOnly(structure: any) {
            if (!_.isUndefined(structure.energyCapacity)) {
                structure.storeCapacity = structure.energyCapacity;
                delete structure.energyCapacity;
            }

            structure.store = {};
            ListItems.RESOURCES_ALL.forEach((r: any) => {
                if (!_.isUndefined(structure[r])) {
                    structure.store[r] = structure[r];
                    delete structure[r];
                }
            });
        };

        const converters: any = {
            spawn: energyOnly,
            extension: energyOnly,
            tower: energyOnly,
            link: energyOnly,
            storage: storeOnly,
            terminal: storeOnly,
            container: storeOnly,
            factory: storeOnly,
            creep: storeOnly,
            powerCreep: storeOnly,
            tombstone: storeOnly,
            nuker: function nuker(structure: any) {
                structure.store = { energy: structure.energy, G: structure.G };
                structure.storeCapacityResource = { energy: structure.energyCapacity, G: structure.GCapacity };

                delete structure.energy;
                delete structure.energyCapacity;
                delete structure.G;
                delete structure.GCapacity;
            },
            powerSpawn: function powerSpawn(structure: any) {
                structure.store = { energy: structure.energy, power: structure.power };
                structure.storeCapacityResource = { energy: structure.energyCapacity, power: structure.powerCapacity };

                delete structure.energy;
                delete structure.energyCapacity;
                delete structure.power;
                delete structure.powerCapacity;
            },
            lab: function lab(structure: any) {
                structure.store = { energy: structure.energy };
                structure.storeCapacityResource = { energy: structure.energyCapacity };
                if (structure.mineralType && structure.mineralAmount) {
                    structure.store[structure.mineralType] = structure.mineralAmount;
                    structure.storeCapacityResource[structure.mineralType] = structure.mineralCapacity;
                } else {
                    structure.storeCapacity = structure.energyCapacity + structure.mineralCapacity;
                }

                delete structure.energy;
                delete structure.energyCapacity;
                delete structure.mineralType;
                delete structure.mineralAmount;
                delete structure.mineralCapacity;
            }
        };

        const powerCreepsCollection = db.getCollection("users.power_creeps");
        if (powerCreepsCollection) {
            const powerCreeps = powerCreepsCollection.find({});
            powerCreeps.forEach((powerCreep: any) => {
                logger.info(`powerCreep${powerCreep._id}`);
                converters.powerCreep(powerCreep);
                return powerCreepsCollection.update(powerCreep);
            });
        }

        const roomObjects = db.getCollection("rooms.objects").find({ type: { $in: _.keys(converters) } });
        roomObjects.forEach((object: any) => {
            logger.info(`${object.type}#${object._id}`);
            converters[object.type](object);
            return db.getCollection("rooms.objects").update(object);
        });

        const nowTimestamp = new Date().getTime();
        const orders = db.getCollection("market.orders").find({});
        orders.forEach((order: any) => {
            if (!order.createdTimestamp) {
                logger.info(`order#${order._id}`);
                order.createdTimestamp = nowTimestamp;
                return db.getCollection("market.orders").update(order);
            }
        });
        envData.databaseVersion = 5;
        env.update(envData);
    }

    if (envData.databaseVersion < 6) {
        logger.info("Upgrading database to version 6");

        const roomObjects = db.getCollection("rooms.objects").find({ type: 'powerBank' });
        roomObjects.forEach((object: any) => {
            logger.info(`${object.type}#${object._id}`);
            object.store = { power: object.power };
            delete object.power;
            return db.getCollection("rooms.objects").update(object);
        });

        envData.databaseVersion = 6;
        env.update(envData);
    }

    if (envData.databaseVersion < 7) {
        logger.info("Upgrading database to version 7");

        const user = db.getCollection("users").findOne({ _id: "2" });
        user.badge = {
            "type": {
                "path1": "m 60.493413,13.745781 -1.122536,7.527255 -23.302365,-6.118884 -24.097204,26.333431 6.412507,0.949878 -5.161481,19.706217 26.301441,24.114728 1.116562,-7.546193 23.350173,6.122868 24.097202,-26.318478 -6.462307,-0.95785 5.16845,-19.699243 z m -1.58271,10.611118 -0.270923,1.821013 C 57.330986,25.69819 55.969864,25.331543 54.570958,25.072546 Z m -8.952409,4.554029 c 11.653612,0 21.055294,9.408134 21.055294,21.069735 0,11.661603 -9.401682,21.068738 -21.055294,21.068738 -11.65361,0 -21.055297,-9.407135 -21.055297,-21.068738 0,-11.661601 9.401687,-21.069735 21.055297,-21.069735 z M 26.634018,40.123069 c -0.262324,0.618965 -0.494865,1.252967 -0.708185,1.895768 l -0.0508,-0.104656 -0.194228,-0.417627 c 0.261245,-0.385697 0.631962,-0.909531 0.953211,-1.373485 z m 47.391601,17.714764 0.115539,0.237219 0.214148,0.462479 c -0.380159,0.55986 -0.886342,1.281124 -1.3835,1.988466 0.400298,-0.870957 0.752837,-1.767746 1.053813,-2.688164 z M 41.364458,73.812322 c 0.694434,0.251619 1.40261,0.471895 2.123558,0.662817 l -2.303841,0.558165 z",
                "path2": "m 60.857962,24.035953 -6.397566,1.055531 c 6.084137,1.084905 11.78633,4.394548 15.786244,9.746957 5.741405,7.682749 6.465607,17.544704 2.736121,25.67958 1.511089,-2.147013 2.622575,-3.851337 2.622575,-3.851337 l 1.628526,0.241209 c 0.726895,-2.869027 1.004942,-5.843252 0.811775,-8.806053 l 1.185288,-8.634615 -3.768025,-3.072898 -2.908435,-3.21842 c -0.0103,-0.01383 -0.01958,-0.02805 -0.02988,-0.04186 -3.118009,-4.172293 -7.17889,-7.228662 -11.666624,-9.098091 z M 50.001124,37.965163 A 12.020784,12.029027 0 0 0 37.979913,49.994617 12.020784,12.029027 0 0 0 50.001124,62.024074 12.020784,12.029027 0 0 0 62.022337,49.994617 12.020784,12.029027 0 0 0 50.001124,37.965163 Z M 27.019485,39.55693 c -1.481686,2.114179 -2.5658,3.779575 -2.5658,3.779575 l -1.647451,-0.244197 c -0.69707,2.775045 -0.977606,5.64628 -0.81476,8.511019 l -1.22015,8.890775 3.768021,3.072896 3.422394,3.786551 c 2.921501,3.715734 6.608397,6.499915 10.668588,8.29872 l 5.050921,-1.223973 C 38.324728,73.038607 33.383805,69.887984 29.806406,65.100956 28.655972,63.561522 27.71377,61.932905 26.961715,60.249903 L 24.8272,48.359991 c 0.194234,-3.030146 0.935183,-6.015406 2.192285,-8.803061 z"
            },
            "color1": "#735252",
            "color2": "#390305",
            "color3": "#ff0d39",
            "flip": false
        };
        db.getCollection("users").update(user);

        envData.databaseVersion = 7;
        env.update(envData);
    }

    clearInterval(upgradeInterval);
}


function updateDocument(doc: any, update: any) {
    if (update.$set) {
        _.extend(doc, update.$set);
    }
    if (update.$merge) {
        _.merge(doc, update.$merge);
    }
    if (update.$inc) {
        _.forEach(update.$inc, (val, key: any) => doc[key] = (doc[key] || 0) + val);
    }
    if (update.$unset) {
        for (const j in update.$unset) {
            delete doc[j];
        }
    }
    if (update.$addToSet) {
        for (let i in update.$addToSet) {
            if (!doc[i]) {
                doc[i] = [];
            }
            if (doc[i].indexOf(update.$addToSet[i]) == -1) {
                doc[i].push(update.$addToSet[i]);
            }
        }
    }
    if (update.$pull) {
        for (let i in update.$pull) {
            if (!doc[i]) {
                continue;
            }
            const idx = doc[i].indexOf(update.$pull[i]);
            if (idx != -1) {
                doc[i].splice(idx, 1);
            }
        }
    }
}

setInterval(function envCleanExpired() {
    const env = db.getCollection('env');
    const values = env.get(1);
    const expiration = env.get(2);
    let dirty = false;
    if (expiration) {
        for (const name in expiration.data) {
            if (Date.now() > expiration.data[name]) {
                dirty = true;
                if (values.data[name]) {
                    delete values.data[name];
                }
                delete expiration.data[name];
            }
        }
    }
    if (dirty) {
        env.update(values);
        env.update(expiration);
    }
}, 10000);

function getRandomString() {
    for (var val = Math.floor(Math.random() * 0x10000).toString(16); val.length < 4; val = '0' + val);
    return val;
}

function genId(obj: any) {
    const id = getRandomString() + Date.now().toString(16).slice(4) + getRandomString();
    if (obj && !obj._id) {
        obj._id = id;
    }
    return id;
}

function getOrAddCollection(collectionName: any) {
    let collection = db.getCollection(collectionName);
    if (!collection) {
        collection = db.addCollection(collectionName);
    }
    collection.ensureUniqueIndex('_id');
    switch (collectionName) {
        case 'rooms.objects': {
            collection.ensureIndex('room');
            collection.ensureIndex('user');
            break;
        }
        case 'rooms.intents': {
            collection.ensureIndex('room');
            break;
        }
        case 'users': {
            collection.ensureIndex('username');
            break;
        }
        case 'rooms.flags': {
            collection.ensureIndex('room');
            collection.ensureIndex('user');
            break;
        }
        case 'rooms.terrain': {
            collection.ensureIndex('room');
            break;
        }
        case 'transactions': {
            collection.ensureIndex('user');
            break;
        }
        case 'users.code': {
            collection.ensureIndex('user');
            break;
        }
        case 'users.console': {
            collection.ensureIndex('user');
            break;
        }
        case 'users.money': {
            collection.ensureIndex('user');
            break;
        }
        case 'users.notifications': {
            collection.ensureIndex('user');
            break;
        }
        case 'users.resources': {
            collection.ensureIndex('user');
            break;
        }
        case 'users.power_creeps': {
            collection.ensureIndex('user');
            break;
        }
    }
    return collection;
}

function recursReplaceNeNull(val: any) {
    if (!_.isObject(val)) {
        return;
    }

    for (const i in val) {
        if (_.isEqual(val[i], { $ne: null }) && !val.$and) {
            val.$and = [{ [i]: { $ne: null } }, { [i]: { $ne: undefined } }];
            delete val[i];
        }
        if (_.isEqual(val[i], { $eq: null }) && !val.$or) {
            val.$or = [{ [i]: { $eq: null } }, { [i]: { $eq: undefined } }];
            delete val[i];
        }
        recursReplaceNeNull(val[i]);
    }
}

///

function dbRequest(collectionName: any, method: any, argsArray: any, cb: any) {
    try {
        const collection: any = getOrAddCollection(collectionName);
        if (method == 'insert') {
            if (_.isArray(argsArray[0])) {
                argsArray[0].forEach(genId);
            }
            else {
                genId(argsArray[0]);
            }
        }

        if (method == 'find' || method == 'findOne' || method == 'count' || method == 'removeWhere') {
            recursReplaceNeNull(argsArray[0]);
        }

        const result = collection[method].apply(collection, argsArray);
        cb(null, result);
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
};

function dbUpdate(collectionName: any, query: any, update: any, params: any, cb: any) {
    try {
        recursReplaceNeNull(query);
        const collection = getOrAddCollection(collectionName);
        let result = [];
        if (Object.keys(query).length == 1 && query._id && _.isString(query._id)) {
            const found = collection.by('_id', query._id);
            if (found) {
                result = [found];
            }
        }
        else {
            result = collection.find(query);
        }
        if (result.length) {
            result.forEach((doc: any) => {
                updateDocument(doc, update);
                collection.update(doc);
            });
            cb(null, { modified: result.length });
        }
        else if (params && params.upsert) {
            const item = {};
            if (query.$and) {
                query.$and.forEach((i: any) => _.extend(item, i));
            }
            else {
                _.extend(item, query);
            }
            updateDocument(item, update);
            genId(item);
            collection.insert(item);
            cb(null, { inserted: 1 });
        }
        else {
            cb(null, {});
        }
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbBulk(collectionName: any, bulk: any, cb: any) {
    try {
        const collection = getOrAddCollection(collectionName);
        let result;
        bulk.forEach((i: any) => {
            switch (i.op) {
                case 'update': {
                    result = collection.by('_id', i.id);
                    if (result) {
                        updateDocument(result, i.update);
                        collection.update(result);
                    }
                    break;
                }
                case 'insert': {
                    genId(i.data);
                    collection.insert(i.data);
                    break;
                }
                case 'remove': {
                    result = collection.by('_id', i.id);
                    if (result) {
                        collection.remove(result);
                    }
                    break;
                }
            }
        });
        cb(null);
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbFindEx(collectionName: any, query: any, opts: any, cb: any) {
    try {
        recursReplaceNeNull(query);
        const collection = getOrAddCollection(collectionName);
        let chain = collection.chain().find(query);
        if (opts.sort) {
            for (const field in opts.sort) {
                chain = chain.simplesort(field, opts.sort[field] == -1);
            }
        }
        if (opts.offset) {
            chain = chain.offset(opts.offset);
        }
        if (opts.limit) {
            chain = chain.limit(opts.limit);
        }
        cb(null, chain.data());
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbEnvGet(name: any, cb: any) {
    try {
        const item = db.getCollection('env').get(1) || { data: {} };
        cb(null, item.data[name]);
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbEnvMget(names: any, cb: any) {
    try {
        const item = db.getCollection('env').get(1) || { data: {} };
        const result = names.map((name: any) => item.data[name]);
        cb(null, result);
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbEnvSet(name: any, value: any, cb?: any) {
    try {
        const env = db.getCollection('env');
        let values = env.get(1);
        if (values) {
            values.data[name] = value;
            env.update(values);
        }
        else {
            values = { data: { [name]: value } };
            env.insert(values);
        }
        cb && cb(null, value);
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbEnvExpire(name: any, seconds: any, cb?: any) {
    try {
        const env = db.getCollection('env');
        let expiration = env.get(2);
        if (expiration) {
            expiration.data[name] = Date.now() + seconds * 1000;
            env.update(expiration);
        }
        else {
            expiration = { data: { [name]: Date.now() + seconds * 1000 } };
            env.insert(expiration);
        }
        cb && cb(null);
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbEnvSetex(name: any, seconds: any, value: any, cb: any) {
    try {
        dbEnvSet(name, value);
        dbEnvExpire(name, seconds);
        cb(null);
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbEnvTtl(name: any, cb: any) {
    try {
        const env = db.getCollection('env');
        const expiration = env.get(2);
        if (!expiration || !expiration.data[name] || expiration.data[name] < Date.now()) {
            cb(null, -1);
            return;
        }
        cb(null, (expiration.data[name] - Date.now()) / 1000);
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbEnvDel(name: any, cb: any) {
    try {
        const env = db.getCollection('env');
        const values = env.get(1);
        if (values && values.data[name]) {
            delete values.data[name];
            cb(null, 1);
        }
        else {
            cb(null, 0);
        }
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbEnvHget(name: any, field: any, cb: any) {
    try {
        const env = db.getCollection('env');
        const values = env.get(1);
        if (values && values.data && values.data[name]) {
            cb(null, values.data[name][field]);
        }
        else {
            cb(null);
        }
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbEnvHset(name: any, field: any, value: any, cb: any) {
    try {
        const env = db.getCollection('env');
        let values = env.get(1);
        if (values) {
            values.data[name] = values.data[name] || {};
            values.data[name][field] = value;
            env.update(values);
        }
        else {
            values = { data: { [name]: { [field]: value } } };
            env.insert(values);
        }
        cb(null, values.data[name][field]);
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbEnvHmget(name: any, fields: any, cb: any) {
    try {
        const env = db.getCollection('env');
        const values = env.get(1) || { data: {} };
        values.data[name] = values.data[name] || {};
        const result = fields.map((i: any) => values.data[name][i]);
        cb(null, result);
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbEnvHmset(name: any, data: any, cb: any) {
    try {
        const env = db.getCollection('env');
        let values = env.get(1);
        if (values) {
            values.data[name] = values.data[name] || {};
            _.extend(values.data[name], data);
            env.update(values);
        }
        else {
            values = { data: { [name]: data } };
            env.insert(values);
        }
        cb(null, values.data[name]);
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

function dbResetAllData(cb: any) {
    try {
        db.loadJSON(JSON.stringify(require('../db.original')));
        cb(null);
    }
    catch (e: any) {
        cb(e.message);
        console.error(e);
    }
}

export default {
    dbRequest,
    dbUpdate,
    dbBulk,
    dbFindEx,
    dbEnvGet,
    dbEnvMget,
    dbEnvSet,
    dbEnvExpire,
    dbEnvSetex,
    dbEnvTtl,
    dbEnvDel,
    dbEnvHget,
    dbEnvHset,
    dbEnvHmget,
    dbEnvHmset,
    dbResetAllData,
};
