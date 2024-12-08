import _ from 'lodash';

import { ErrorCode } from '@screeps/common/src/constants/error-code';

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

    if (globals.ConstructionSite) {
        return;
    }

    const data = (id: any) => {
        if (!runtimeData.roomObjects[id]) {
            throw new Error("Could not find an object with ID " + id);
        }
        return runtimeData.roomObjects[id];
    };

    const ConstructionSite = register.wrapFn(function (this: any, id: any) {
        const _data = data(id);
        globals.RoomObject.call(this, _data.x, _data.y, _data.room, _data.effects);
        this.id = id;
    });

    ConstructionSite.prototype = Object.create(globals.RoomObject.prototype);
    ConstructionSite.prototype.constructor = ConstructionSite;

    utils.defineGameObjectProperties(ConstructionSite.prototype, data, {
        progress: (o: any) => o.progress,
        progressTotal: (o: any) => o.progressTotal,
        structureType: (o: any) => o.structureType,
        name: (o: any) => o.name,
        owner: (o: any) => new Object({ username: runtimeData.users[o.user].username }),
        my: (o: any) => _.isUndefined(o.user) ? undefined : o.user == runtimeData.user._id
    });


    ConstructionSite.prototype.toString = register.wrapFn(function (this: any) {
        return `[construction site (${data(this.id).structureType}) #${this.id}]`;
    });

    ConstructionSite.prototype.remove = register.wrapFn(function (this: any) {

        if (!this.my && !(this.room && this.room.controller && this.room.controller.my)) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        intents.pushByName('room', 'removeConstructionSite', { roomName: data(this.id).room, id: this.id });
        return ErrorCode.OK;
    });

    Object.defineProperty(globals, 'ConstructionSite', { enumerable: true, value: ConstructionSite });
}