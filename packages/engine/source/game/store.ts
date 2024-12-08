import _ from 'lodash';
import * as utils from './../utils';
const driver = utils.getRuntimeDriver();


let runtimeData, intents, register, globals;

export function make(_runtimeData, _intents, _register, _globals) {

    runtimeData = _runtimeData;
    intents = _intents;
    register = _register;
    globals = _globals;

    if (globals.Store) {
        return;
    }

    const Store = register.wrapFn(function(object) {

        Object.entries(object.store).forEach(([resourceType, resourceAmount]) => {
            if(resourceAmount) {
                this[resourceType] = resourceAmount;
            }
        });

        Object.defineProperties(this, {
            getCapacity: {
                value: function getCapacity(resource) {
                    if(!resource) {
                        return object.storeCapacityResource ? null : object.storeCapacity || null;
                    }
                    return utils.capacityForResource(object, resource) || null;
                }
            },
            getUsedCapacity: {
                value: function getUsedCapacity(resource) {
                    if(!resource) {
                        if(object.storeCapacityResource) {
                            return null;
                        }
                        if(this._sum === undefined) {
                            Object.defineProperty(this, '_sum', {
                                value: _.sum(object.store)
                            });
                        }
                        return this._sum;
                    }
                    return object.store[resource] || 0;
                }
            },
            getFreeCapacity: {
                value: function getFreeCapacity(resource) {
                    return this.getCapacity(resource) - this.getUsedCapacity(resource);
                }
            },
            toString: {
                value: function toString() {
                    return `[store]`;
                }
            }
        });

        return new Proxy(this, {
            get(target, name) {
                if(target[name] !== undefined) {
                    return target[name];
                }
                if(ScreepsConstants.RESOURCES_ALL.indexOf(name) !== -1) {
                    return 0;
                }
            }
        });
    });

    Object.defineProperty(globals, 'Store', {enumerable: true, value: Store});

}
