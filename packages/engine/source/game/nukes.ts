import utils from './../utils';
import rooms from './rooms';
const driver = utils.getRuntimeDriver();
const C = driver.constants;

let runtimeData, intents, register, globals;

export function make(_runtimeData, _intents, _register, _globals) {

    runtimeData = _runtimeData;
    intents = _intents;
    register = _register;
    globals = _globals;

    if(globals.Nuke) {
        return;
    }

    const data = (id) => {
        if(!runtimeData.roomObjects[id]) {
            throw new Error("Could not find an object with ID "+id);
        }
        return runtimeData.roomObjects[id];
    };

    const Nuke = register.wrapFn(function(id) {
        const _data = data(id);
        globals.RoomObject.call(this, _data.x, _data.y, _data.room, _data.effects);
        this.id = id;
    });

    Nuke.prototype = Object.create(globals.RoomObject.prototype);
    Nuke.prototype.constructor = Nuke;

    utils.defineGameObjectProperties(Nuke.prototype, data, {
        timeToLand: (o) => o.landTime - runtimeData.time,
        launchRoomName: o => o.launchRoomName
    });

    Nuke.prototype.toString = register.wrapFn(function() {
        return `[nuke #${this.id}]`;
    });

    Object.defineProperty(globals, 'Nuke', {enumerable: true, value: Nuke});
}