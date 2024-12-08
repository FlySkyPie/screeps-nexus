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

    if (globals.Source) {
        return;
    }

    const data = (id: any) => {
        if (!runtimeData.roomObjects[id]) {
            throw new Error("Could not find an object with ID " + id);
        }
        return runtimeData.roomObjects[id];
    };

    const Source = register.wrapFn(function (this: any, id: any) {
        const _data = data(id);
        globals.RoomObject.call(this, _data.x, _data.y, _data.room, _data.effects);
        this.id = id;
    });

    Source.prototype = Object.create(globals.RoomObject.prototype);
    Source.prototype.constructor = Source;

    utils.defineGameObjectProperties(Source.prototype, data, {
        energy: (o: any) => o.energy,
        energyCapacity: (o: any) => o.energyCapacity,
        ticksToRegeneration: (o: any) => o.nextRegenerationTime ? o.nextRegenerationTime - runtimeData.time : undefined
    });

    Source.prototype.toString = register.wrapFn(function (this: any) {
        return `[source #${this.id}]`;
    });

    Object.defineProperty(globals, 'Source', { enumerable: true, value: Source });
};
