import { ScreepsConstants } from '@screeps/common/src/constants/constants';
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

    if (globals.Deposit) {
        return;
    }

    const data = (id: any) => {
        if (!runtimeData.roomObjects[id]) {
            throw new Error("Could not find an object with ID " + id);
        }
        return runtimeData.roomObjects[id];
    };

    const Deposit = register.wrapFn(function (this: any, id: any) {
        const _data = data(id);
        globals.RoomObject.call(this, _data.x, _data.y, _data.room, _data.effects);
        this.id = id;
    });

    Deposit.prototype = Object.create(globals.RoomObject.prototype);
    Deposit.prototype.constructor = Deposit;

    utils.defineGameObjectProperties(Deposit.prototype, data, {
        depositType: (o: any) => o.depositType,
        cooldown: (o: any) => o.cooldownTime && o.cooldownTime > runtimeData.time ? o.cooldownTime - runtimeData.time : 0,
        lastCooldown: (o: any) => Math.ceil(ScreepsConstants.DEPOSIT_EXHAUST_MULTIPLY * Math.pow(o.harvested, ScreepsConstants.DEPOSIT_EXHAUST_POW)),
        ticksToDecay: (o: any) => o.decayTime ? o.decayTime - runtimeData.time : undefined
    });

    Deposit.prototype.toString = register.wrapFn(function (this: any) {
        return `[deposit (${this.depositType}) #${this.id}]`;
    });

    Object.defineProperty(globals, 'Deposit', { enumerable: true, value: Deposit });
}
