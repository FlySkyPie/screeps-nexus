import _ from 'lodash';

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

    if (globals.Store) {
        return;
    }

    const Store = register.wrapFn(function (this: any, object: any) {

        Object.entries(object.store).forEach(([resourceType, resourceAmount]) => {
            if (resourceAmount) {
                this[resourceType] = resourceAmount;
            }
        });

        Object.defineProperties(this, {
            getCapacity: {
                value: function getCapacity(resource: any) {
                    if (!resource) {
                        return object.storeCapacityResource ? null : object.storeCapacity || null;
                    }
                    return utils.capacityForResource(object, resource) || null;
                }
            },
            getUsedCapacity: {
                value: function getUsedCapacity(resource: any) {
                    if (!resource) {
                        if (object.storeCapacityResource) {
                            return null;
                        }
                        if (this._sum === undefined) {
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
                value: function getFreeCapacity(resource: any) {
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
            get(target: any, name: any) {
                if (target[name] !== undefined) {
                    return target[name];
                }
                if (ListItems.RESOURCES_ALL.indexOf(name) !== -1) {
                    return 0;
                }
            }
        });
    });

    Object.defineProperty(globals, 'Store', { enumerable: true, value: Store });

};
