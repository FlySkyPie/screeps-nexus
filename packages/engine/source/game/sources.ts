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

    if(globals.Source) {
        return;
    }

    const data = (id) => {
        if(!runtimeData.roomObjects[id]) {
            throw new Error("Could not find an object with ID "+id);
        }
        return runtimeData.roomObjects[id];
    };

    const Source = register.wrapFn(function(id) {
        const _data = data(id);
        globals.RoomObject.call(this, _data.x, _data.y, _data.room, _data.effects);
        this.id = id;
    });

    Source.prototype = Object.create(globals.RoomObject.prototype);
    Source.prototype.constructor = Source;

    utils.defineGameObjectProperties(Source.prototype, data, {
        energy: (o) => o.energy,
        energyCapacity: (o) => o.energyCapacity,
        ticksToRegeneration: (o) => o.nextRegenerationTime ? o.nextRegenerationTime - runtimeData.time : undefined
    });

    Source.prototype.toString = register.wrapFn(function() {
        return `[source #${this.id}]`;
    });

    Object.defineProperty(globals, 'Source', {enumerable: true, value: Source});
}