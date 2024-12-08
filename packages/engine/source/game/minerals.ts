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

    if (globals.Mineral) {
        return;
    }

    const data = (id: any) => {
        if (!runtimeData.roomObjects[id]) {
            throw new Error("Could not find an object with ID " + id);
        }
        return runtimeData.roomObjects[id];
    };

    const Mineral = register.wrapFn(function (this: any, id: any) {
        const _data = data(id);
        globals.RoomObject.call(this, _data.x, _data.y, _data.room, _data.effects);
        this.id = id;
    });

    Mineral.prototype = Object.create(globals.RoomObject.prototype);
    Mineral.prototype.constructor = Mineral;

    utils.defineGameObjectProperties(Mineral.prototype, data, {
        mineralType: (o: any) => o.mineralType,
        mineralAmount: (o: any) => o.mineralAmount,
        density: (o: any) => o.density,
        ticksToRegeneration: (o: any) => o.nextRegenerationTime ? o.nextRegenerationTime - runtimeData.time : undefined
    });

    Mineral.prototype.toString = register.wrapFn(function (this: any) {
        return `[mineral (${this.mineralType}) #${this.id}]`;
    });

    Object.defineProperty(globals, 'Mineral', { enumerable: true, value: Mineral });
}