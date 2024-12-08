import _ from 'lodash';

import { ErrorCode } from '@screeps/common/src/constants/error-code';
import { ListItems } from '@screeps/common/src/tables/list-items';

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

    if (globals.Flag) {
        return;
    }

    const Flag = register.wrapFn(function (this: any, name: any, color: any, secondaryColor: any, roomName: any, x: any, y: any) {
        globals.RoomObject.call(this, Number(x), Number(y), roomName);

        this.name = name;
        this.color = Number(color);
        this.secondaryColor = Number(secondaryColor || color);
    });

    Flag.prototype = Object.create(globals.RoomObject.prototype);
    Flag.prototype.constructor = Flag;

    Object.defineProperty(Flag.prototype, 'memory', {
        get: function () {
            if (_.isUndefined(globals.Memory.flags) || globals.Memory.flags === 'undefined') {
                globals.Memory.flags = {};
            }
            if (!_.isObject(globals.Memory.flags)) {
                return undefined;
            }
            return globals.Memory.flags[this.name] = globals.Memory.flags[this.name] || {};
        },

        set: function (value) {
            if (_.isUndefined(globals.Memory.flags) || globals.Memory.flags === 'undefined') {
                globals.Memory.flags = {};
            }
            if (!_.isObject(globals.Memory.flags)) {
                throw new Error('Could not set flag memory');
            }
            globals.Memory.flags[this.name] = value;
        }
    });

    Flag.prototype.toString = register.wrapFn(function (this: any) {
        return `[flag ${this.name}]`;
    });

    Flag.prototype.remove = register.wrapFn(function (this: any) {

        intents.pushByName('room', 'removeFlag', { roomName: this.pos.roomName, name: this.name });
        return ErrorCode.OK;
    });

    Flag.prototype.setPosition = register.wrapFn(function (this: any, firstArg: any, secondArg: any) {

        let [x, y, roomName] = utils.fetchXYArguments(firstArg, secondArg, globals);
        roomName = roomName || this.pos.roomName;
        if (_.isUndefined(x) || _.isUndefined(y)) {
            return ErrorCode.ERR_INVALID_TARGET;
        }

        intents.pushByName('room', 'removeFlag', { roomName: this.pos.roomName, name: this.name });
        intents.pushByName('room', 'createFlag', { roomName, x, y, name: this.name, color: this.color, secondaryColor: this.secondaryColor });
        return ErrorCode.OK;
    });

    Flag.prototype.setColor = register.wrapFn(function (this: any, color: any, secondaryColor: any) {

        if (!_.contains(ListItems.COLORS_ALL, color)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }

        secondaryColor = secondaryColor || color;

        if (!_.contains(ListItems.COLORS_ALL, secondaryColor)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }

        intents.pushByName('room', 'removeFlag', { roomName: this.pos.roomName, name: this.name });
        intents.pushByName('room', 'createFlag', { roomName: this.pos.roomName, x: this.pos.x, y: this.pos.y, name: this.name, color, secondaryColor });
        return ErrorCode.OK;
    });

    Object.defineProperty(globals, 'Flag', {
        enumerable: true,
        value: Flag
    });
}