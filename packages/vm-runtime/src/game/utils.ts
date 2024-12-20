import _ from 'lodash';

import { FindCode } from '@screeps/common/src/constants/find-code';

export function populateRegister(reg: any, spatial?: any) {
    _.extend(reg, {
        creeps: {},
        structures: {},
        ownedStructures: {},
        spawns: {},
        sources: {},
        energy: {},
        flags: {},
        constructionSites: {},
        minerals: {},
        deposits: {},
        tombstones: {},
        nukes: {},
        powerCreeps: {},
        ruins: {},
    });

    if (spatial) {
        const keys = Object.keys(reg);
        reg.spatial = {};
        keys.forEach((i) => {
            reg.spatial[i] = new Array(2500);
        });
    }
};

export const findCacheFn: Record<string, any> = {
    [FindCode.FIND_CREEPS]: (i: any) => !i.spawning,
    [FindCode.FIND_MY_CREEPS]: (i: any) => !i.spawning && i.my,
    [FindCode.FIND_HOSTILE_CREEPS]: (i: any) => !i.spawning && !i.my,
    [FindCode.FIND_MY_POWER_CREEPS]: (i: any) => i.my,
    [FindCode.FIND_HOSTILE_POWER_CREEPS]: (i: any) => !i.my,
    [FindCode.FIND_MY_SPAWNS]: (i: any) => i.my === true,
    [FindCode.FIND_HOSTILE_SPAWNS]: (i: any) => i.my === false,
    [FindCode.FIND_SOURCES_ACTIVE]: (i: any) => i.energy > 0,
    [FindCode.FIND_MY_STRUCTURES]: (i: any) => i.my === true,
    [FindCode.FIND_HOSTILE_STRUCTURES]: (i: any) => i.my === false && i.owner,
    [FindCode.FIND_MY_CONSTRUCTION_SITES]: (i: any) => i.my,
    [FindCode.FIND_HOSTILE_CONSTRUCTION_SITES]: (i: any) => i.my === false
};

export function addObjectToFindCache(register: any, type: any, objectInstance: any, objectRaw: any) {
    if (!findCacheFn[type] || findCacheFn[type](objectInstance)) {
        register.findCache[type] = register.findCache[type] || {};
        register.findCache[type][objectRaw.room] = register.findCache[type][objectRaw.room] || [];
        register.findCache[type][objectRaw.room].push(objectInstance);
    }
};

export function addObjectToRegister(register: any, type: any, objectInstance: any, objectRaw: any) {
    register[type][objectInstance.id] = objectInstance;
    register.byRoom[objectRaw.room][type][objectInstance.id] = objectInstance;
    let index = objectRaw.x * 50 + objectRaw.y;
    let spatial = register.byRoom[objectRaw.room].spatial[type];
    if (spatial[index] === undefined) {
        spatial[index] = [objectInstance];
    } else {
        spatial[index].push(objectInstance);
    }
};
