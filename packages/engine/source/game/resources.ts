import { Resource as ResourceData } from '@screeps/common/src/constants/resource';

import * as utils from './../utils';

let runtimeData: any,
    // intents: any,
    register: any,
    globals: any;

export function make(_runtimeData: any, _intents: any, _register: any, _globals: any) {

    runtimeData = _runtimeData;
    // intents = _intents;
    register = _register;
    globals = _globals;

    if (globals.Resource) {
        return;
    }

    const data = (id: any) => {
        if (!runtimeData.roomObjects[id]) {
            throw new Error("Could not find an object with ID " + id);
        }
        return runtimeData.roomObjects[id];
    };

    const Resource = register.wrapFn(function (this: any, id: any) {
        const _data = data(id);
        globals.RoomObject.call(this, _data.x, _data.y, _data.room, _data.effects);
        this.id = id;
    });

    Resource.prototype = Object.create(globals.RoomObject.prototype);
    Resource.prototype.constructor = Resource;

    utils.defineGameObjectProperties(Resource.prototype, data, {
        energy: (o: any) => o.energy,
        amount: (o: any) => o[o.resourceType || ResourceData.RESOURCE_ENERGY],
        resourceType: (o: any) => o.resourceType || ResourceData.RESOURCE_ENERGY
    });

    Resource.prototype.toString = register.wrapFn(function (this: any) {
        return `[resource (${this.resourceType}) #${this.id}]`;
    });

    Object.defineProperty(globals, 'Resource', { enumerable: true, value: Resource });
    Object.defineProperty(globals, 'Energy', { enumerable: true, value: Resource });
}