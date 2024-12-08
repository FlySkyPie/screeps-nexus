import _ from 'lodash';

import * as utils from '../utils';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { BodyParts } from '@screeps/common/src/constants/body-parts';

let runtimeData: any,
    intents: any,
    register: any,
    globals: any;

function _storeGetter(this: any, o: any) {
    if (!o) {
        o = { store: {}, storeCapacity: this.carryCapacity };
    }
    return new globals.Store(o);
}

export function make(_runtimeData: any, _intents: any, _register: any, _globals: any) {

    runtimeData = _runtimeData;
    intents = _intents;
    register = _register;
    globals = _globals;

    if (globals.Tombstone) {
        return;
    }

    const data = (id: any) => {
        if (!runtimeData.roomObjects[id]) {
            throw new Error("Could not find an object with ID " + id);
        }
        return runtimeData.roomObjects[id];
    };

    const Tombstone = register.wrapFn(function (this: any, id: any) {
        const _data = data(id);
        globals.RoomObject.call(this, _data.x, _data.y, _data.room, _data.effects);
        this.id = id;
    });

    Tombstone.prototype = Object.create(globals.RoomObject.prototype);
    Tombstone.prototype.constructor = Tombstone;
    utils.defineGameObjectProperties(Tombstone.prototype, data, {
        deathTime: (o: any) => o.deathTime,
        store: _storeGetter,
        ticksToDecay: (o: any) => o.decayTime - runtimeData.time,
        creep: (o: any) => {
            if (o.creepId) {
                let creep = new globals.Creep();
                globals.RoomObject.call(creep, o.x, o.y, o.room);
                Object.defineProperties(creep, {
                    id: {
                        enumerable: true,
                        get() {
                            return o.creepId;
                        }
                    },
                    name: {
                        enumerable: true,
                        get() {
                            return o.creepName;
                        }
                    },
                    spawning: {
                        enumerable: true,
                        get() {
                            return false;
                        }
                    },
                    my: {
                        enumerable: true,
                        get() {
                            return o.user == runtimeData.user._id;
                        }
                    },
                    body: {
                        enumerable: true,
                        get() {
                            return _.map(o.creepBody, type => ({ type, hits: 0 }))
                        }
                    },
                    owner: {
                        enumerable: true,
                        get() {
                            return _.isUndefined(o.user) || o.user === null ? undefined : {
                                username: runtimeData.users[o.user].username
                            }
                        }
                    },
                    ticksToLive: {
                        enumerable: true,
                        get() {
                            return o.creepTicksToLive;
                        }
                    },
                    carryCapacity: {
                        enumerable: true,
                        get() {
                            return _.reduce(o.creepBody,
                                (result, type) => result += type === BodyParts.CARRY ?
                                    ScreepsConstants.CARRY_CAPACITY :
                                    0, 0);
                        }
                    },
                    carry: {
                        enumerable: true,
                        get: _storeGetter as any,
                    },
                    store: {
                        enumerable: true,
                        get: _storeGetter as any,
                    },
                    fatigue: {
                        enumerable: true,
                        get() {
                            return 0;
                        }
                    },
                    hits: {
                        enumerable: true,
                        get() {
                            return 0;
                        }
                    },
                    hitsMax: {
                        enumerable: true,
                        get() {
                            return o.creepBody.length * 100;
                        }
                    },
                    saying: {
                        enumerable: true,
                        get() {
                            return o.creepSaying;
                        }
                    }
                });
                return creep;
            }

            if (o.powerCreepId) {

                let powerCreep = new globals.PowerCreep();
                globals.RoomObject.call(powerCreep, o.x, o.y, o.room);
                Object.defineProperties(powerCreep, {
                    id: {
                        enumerable: true,
                        get() {
                            return o.powerCreepId;
                        }
                    },
                    name: {
                        enumerable: true,
                        get() {
                            return o.powerCreepName;
                        }
                    },
                    className: {
                        enumerable: true,
                        get() {
                            return o.powerCreepClassName;
                        }
                    },
                    level: {
                        enumerable: true,
                        get() {
                            return o.powerCreepLevel;
                        }
                    },
                    my: {
                        enumerable: true,
                        get() {
                            return o.user == runtimeData.user._id;
                        }
                    },
                    body: {
                        enumerable: true,
                        get() {
                            return _.map(o.creepBody, type => ({ type, hits: 0 }))
                        }
                    },
                    owner: {
                        enumerable: true,
                        get() {
                            return _.isUndefined(o.user) || o.user === null ? undefined : {
                                username: runtimeData.users[o.user].username
                            }
                        }
                    },
                    ticksToLive: {
                        enumerable: true,
                        get() {
                            return o.powerCreepTicksToLive;
                        }
                    },
                    carryCapacity: {
                        enumerable: true,
                        get() {
                            return o.powerCreepLevel * 100;
                        }
                    },
                    carry: {
                        enumerable: true,
                        get: _storeGetter as any,
                    },
                    store: {
                        enumerable: true,
                        get: _storeGetter as any,
                    },
                    hits: {
                        enumerable: true,
                        get() {
                            return 0;
                        }
                    },
                    hitsMax: {
                        enumerable: true,
                        get() {
                            return o.powerCreepLevel * 1000;
                        }
                    },
                    saying: {
                        enumerable: true,
                        get() {
                            return o.powerCreepSaying;
                        }
                    },
                    powers: {
                        enumerable: true,
                        get() {
                            return o.powerCreepPowers;
                        }
                    }
                });
                return powerCreep;
            }
        },
    });

    Tombstone.prototype.toString = register.wrapFn(function (this: any) {
        return `[Tombstone #${this.id}]`;
    });

    Object.defineProperty(globals, 'Tombstone', { enumerable: true, value: Tombstone });
}
