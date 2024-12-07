import utils from './../utils';
import rooms from './rooms';
const driver = utils.getRuntimeDriver();

import _ from 'lodash';

let runtimeData, intents, register, globals;

export function make(_runtimeData, _intents, _register, _globals) {

    runtimeData = _runtimeData;
    intents = _intents;
    register = _register;
    globals = _globals;

    if(globals.Flag) {
        return;
    }

    const Flag = register.wrapFn(function(name, color, secondaryColor, roomName, x, y) {
        globals.RoomObject.call(this, Number(x),Number(y),roomName);

        this.name = name;
        this.color = Number(color);
        this.secondaryColor = Number(secondaryColor || color);
    });

    Flag.prototype = Object.create(globals.RoomObject.prototype);
    Flag.prototype.constructor = Flag;

    Object.defineProperty(Flag.prototype, 'memory', {
        get: function() {
            if(_.isUndefined(globals.Memory.flags) || globals.Memory.flags === 'undefined') {
                globals.Memory.flags = {};
            }
            if(!_.isObject(globals.Memory.flags)) {
                return undefined;
            }
            return globals.Memory.flags[this.name] = globals.Memory.flags[this.name] || {};
        },

        set: function(value) {
            if(_.isUndefined(globals.Memory.flags) || globals.Memory.flags === 'undefined') {
                globals.Memory.flags = {};
            }
            if(!_.isObject(globals.Memory.flags)) {
                throw new Error('Could not set flag memory');
            }
            globals.Memory.flags[this.name] = value;
        }
    });

    Flag.prototype.toString = register.wrapFn(function() {
        return `[flag ${this.name}]`;
    });

    Flag.prototype.remove = register.wrapFn(function() {

        intents.pushByName('room', 'removeFlag', {roomName: this.pos.roomName, name: this.name});
        return ScreepsConstants.OK;
    });

    Flag.prototype.setPosition = register.wrapFn(function(firstArg, secondArg) {

        let [x,y,roomName] = utils.fetchXYArguments(firstArg, secondArg, globals);
        roomName = roomName || this.pos.roomName;
        if(_.isUndefined(x) || _.isUndefined(y)) {
            return ScreepsConstants.ERR_INVALID_TARGET;
        }

        intents.pushByName('room', 'removeFlag', {roomName: this.pos.roomName, name: this.name});
        intents.pushByName('room', 'createFlag', {roomName, x, y, name: this.name, color: this.color, secondaryColor: this.secondaryColor});
        return ScreepsConstants.OK;
    });

    Flag.prototype.setColor = register.wrapFn(function(color, secondaryColor) {

        if(!_.contains(ScreepsConstants.COLORS_ALL, color)) {
            return ScreepsConstants.ERR_INVALID_ARGS;
        }

        secondaryColor = secondaryColor || color;

        if(!_.contains(ScreepsConstants.COLORS_ALL, secondaryColor)) {
            return ScreepsConstants.ERR_INVALID_ARGS;
        }

        intents.pushByName('room', 'removeFlag', {roomName: this.pos.roomName, name: this.name});
        intents.pushByName('room', 'createFlag', {roomName: this.pos.roomName, x: this.pos.x, y: this.pos.y, name: this.name, color, secondaryColor});
        return ScreepsConstants.OK;
    });

    Object.defineProperty(globals, 'Flag', {
        enumerable: true,
        value: Flag
    });
}