import * as utils from './../utils';

let runtimeData: any,
    intents: any,
    register: any,
    globals: any;

export function make(_runtimeData: any, _intents: any, _register: any, _globals: any) {

    runtimeData = _runtimeData;
    intents = _intents;
    register = _register;
    globals = _globals;

    if (globals.Nuke) {
        return;
    }

    const data = (id: any) => {
        if (!runtimeData.roomObjects[id]) {
            throw new Error("Could not find an object with ID " + id);
        }
        return runtimeData.roomObjects[id];
    };

    const Nuke = register.wrapFn(function (this: any, id: any) {
        const _data = data(id);
        globals.RoomObject.call(this, _data.x, _data.y, _data.room, _data.effects);
        this.id = id;
    });

    Nuke.prototype = Object.create(globals.RoomObject.prototype);
    Nuke.prototype.constructor = Nuke;

    utils.defineGameObjectProperties(Nuke.prototype, data, {
        timeToLand: (o: any) => o.landTime - runtimeData.time,
        launchRoomName: (o: any) => o.launchRoomName
    });

    Nuke.prototype.toString = register.wrapFn(function (this: any) {
        return `[nuke #${this.id}]`;
    });

    Object.defineProperty(globals, 'Nuke', { enumerable: true, value: Nuke });
};
