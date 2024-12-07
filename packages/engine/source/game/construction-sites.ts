import utils from './../utils';
import rooms from './rooms';
const driver = utils.getRuntimeDriver();
const C = driver.constants;
import _ from 'lodash';

let runtimeData, intents, register, globals;

export function make(_runtimeData, _intents, _register, _globals) {

    runtimeData = _runtimeData;
    intents = _intents;
    register = _register;
    globals = _globals;

    if(globals.ConstructionSite) {
        return;
    }

    const data = (id) => {
        if(!runtimeData.roomObjects[id]) {
            throw new Error("Could not find an object with ID "+id);
        }
        return runtimeData.roomObjects[id];
    };

    const ConstructionSite = register.wrapFn(function(id) {
        const _data = data(id);
        globals.RoomObject.call(this, _data.x, _data.y, _data.room, _data.effects);
        this.id = id;
    });

    ConstructionSite.prototype = Object.create(globals.RoomObject.prototype);
    ConstructionSite.prototype.constructor = ConstructionSite;

    utils.defineGameObjectProperties(ConstructionSite.prototype, data, {
        progress: (o) => o.progress,
        progressTotal: (o) => o.progressTotal,
        structureType: (o) => o.structureType,
        name: (o) => o.name,
        owner: (o) => new Object({username: runtimeData.users[o.user].username}),
        my: (o) => _.isUndefined(o.user) ? undefined : o.user == runtimeData.user._id
    });


    ConstructionSite.prototype.toString = register.wrapFn(function() {
        return `[construction site (${data(this.id).structureType}) #${this.id}]`;
    });

    ConstructionSite.prototype.remove = register.wrapFn(function() {

        if(!this.my && !(this.room && this.room.controller && this.room.controller.my)) {
            return C.ERR_NOT_OWNER;
        }
        intents.pushByName('room', 'removeConstructionSite', {roomName: data(this.id).room, id: this.id});
        return C.OK;
    });

    Object.defineProperty(globals, 'ConstructionSite', {enumerable: true, value: ConstructionSite});
}