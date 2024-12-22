import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { ListItems } from '@screeps/common/src/tables/list-items';
import { ErrorCode } from '@screeps/common/src/constants/error-code';
import { IntershardResources } from '@screeps/common/src/constants/intershard-resources';
import { Resource } from '@screeps/common/src/constants/resource';

import { calcRoomsDistance, calcTerminalEnergyCost } from '../utils';

export function make(runtimeData: any, intents: any, register: any) {
    let ordersCreatedDuringTick = 0;
    const cachedOrders: Record<string, any> = {};
    const cachedHistory: Record<string, any> = {};
    let _incomingTransactions: any;
    let _outgoingTransactions: any;
    let _orders: any;

    function _getOrders(resourceType: any) {
        if (!resourceType) {
            resourceType = 'all';
        }
        if (!cachedOrders[resourceType]) {
            if (resourceType != 'all' && !_.contains(ListItems.RESOURCES_ALL, resourceType) && !_.contains(ListItems.INTERSHARD_RESOURCES, resourceType)) {
                return {};
            }
            cachedOrders[resourceType] = JSON.parse(JSON.stringify(runtimeData.market.orders[resourceType]) || '{}');
            for (const i in cachedOrders[resourceType]) {
                cachedOrders[resourceType][i].price /= 1000;
            }
        }
        return cachedOrders[resourceType];
    }

    const market = {

        calcTransactionCost: register.wrapFn((amount: any, roomName1: any, roomName2: any) => {
            const distance = calcRoomsDistance(roomName1, roomName2, true);
            return calcTerminalEnergyCost(amount, distance);
        }),

        getAllOrders: register.wrapFn((filter: any) => {
            const orders = _getOrders(filter && filter.resourceType);
            return _.filter(orders, filter);
        }),

        getHistory: register.wrapFn((resourceType: any) => {
            if (!resourceType) {
                resourceType = 'all';
            }

            if (!cachedHistory[resourceType]) {
                if (resourceType != 'all' && !_.contains(ListItems.RESOURCES_ALL, resourceType) && !_.contains(ListItems.INTERSHARD_RESOURCES, resourceType)) {
                    return {};
                }
                cachedHistory[resourceType] = JSON.parse(JSON.stringify(runtimeData.market.history[resourceType] || {}));
                return cachedHistory[resourceType];
            }
        }),

        getOrderById: register.wrapFn(function (this: any, id: any) {
            const order = runtimeData.market.orders.all[id] || this.orders[id];
            if (!order) {
                return null;
            }
            const result = JSON.parse(JSON.stringify(order));
            result.price /= 1000;
            return result;
        }),

        createOrder: register.wrapFn(function (
            this: any, type: any, resourceType: any, price: any, totalAmount: any, roomName: any) {
            if (_.isObject(type)) {
                var { type, resourceType, price, totalAmount, roomName } = type;
            }
            if (!_.contains(ListItems.RESOURCES_ALL, resourceType) &&
                !_.contains(ListItems.INTERSHARD_RESOURCES, resourceType)) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
            if (type != ScreepsConstants.ORDER_BUY && type != ScreepsConstants.ORDER_SELL) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
            price = parseFloat(price);
            totalAmount = parseInt(totalAmount);
            if (!price || price <= 0 || !totalAmount) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
            if (price * totalAmount * ScreepsConstants.MARKET_FEE > this.credits) {
                return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
            }
            if (!_.contains(ListItems.INTERSHARD_RESOURCES, resourceType) &&
                (!roomName || !_.any(runtimeData.userObjects, _.matches({ type: 'terminal', room: roomName })))) {
                return ErrorCode.ERR_NOT_OWNER;
            }
            if (_.size(this.orders) + ordersCreatedDuringTick >= ScreepsConstants.MARKET_MAX_ORDERS) {
                return ErrorCode.ERR_FULL;
            }
            ordersCreatedDuringTick++;
            intents.pushByName('global', 'createOrder', {
                type, resourceType, price, totalAmount, roomName
            });
            return ErrorCode.OK;
        }),

        cancelOrder: register.wrapFn(function (this: any, orderId: any) {
            if (!this.orders[orderId]) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
            intents.pushByName('global', 'cancelOrder', { orderId }, 50);
            return ErrorCode.OK;
        }),

        deal: register.wrapFn(function (this: any, orderId: any, amount: any, targetRoomName: any) {
            const order = runtimeData.market.orders.all[orderId];
            if (!order) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
            amount = parseInt(amount);
            if (!amount || amount < 0) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
            if (_.contains(ListItems.INTERSHARD_RESOURCES, order.resourceType)) {
                if (order.resourceType == IntershardResources.SUBSCRIPTION_TOKEN) {
                    if (order.type == ScreepsConstants.ORDER_BUY && (runtimeData.user.subscriptionTokens || 0) < amount) {
                        return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
                    }
                }
            }
            else {
                if (!targetRoomName) {
                    return ErrorCode.ERR_INVALID_ARGS;
                }
                const terminal: any = _.find(
                    runtimeData.userObjects,
                    _.matches({ type: 'terminal', room: targetRoomName })),
                    transferCost = this.calcTransactionCost(amount, targetRoomName, order.roomName);
                if (!terminal) {
                    return ErrorCode.ERR_NOT_OWNER;
                }
                if (!terminal.store || terminal.store[Resource.RESOURCE_ENERGY] < transferCost) {
                    return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
                }
                if (terminal.cooldownTime > runtimeData.time) {
                    return ErrorCode.ERR_TIRED;
                }
                if (order.type == ScreepsConstants.ORDER_BUY) {
                    if (order.resourceType != Resource.RESOURCE_ENERGY && (!terminal.store[order.resourceType] || terminal.store[order.resourceType] < amount) ||
                        order.resourceType == Resource.RESOURCE_ENERGY && terminal.store[Resource.RESOURCE_ENERGY] < amount + transferCost) {
                        return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
                    }
                }
            }

            if (order.type == ScreepsConstants.ORDER_SELL && (runtimeData.user.money || 0) < amount * order.price) {
                return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
            }

            if (!intents.pushByName('global', 'deal', { orderId, targetRoomName, amount }, 10)) {
                return ErrorCode.ERR_FULL;
            }
            return ErrorCode.OK;
        }),

        changeOrderPrice: register.wrapFn(function (this: any, orderId: any, newPrice: any) {
            const order = this.orders[orderId];
            if (!order) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
            newPrice = parseFloat(newPrice);
            if (!newPrice || newPrice <= 0) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
            if (newPrice > order.price && (newPrice - order.price) * order.remainingAmount * ScreepsConstants.MARKET_FEE > this.credits) {
                return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
            }

            intents.pushByName('global', 'changeOrderPrice', {
                orderId, newPrice
            }, 50);
            return ErrorCode.OK;
        }),

        extendOrder: register.wrapFn(function (this: any, orderId: any, addAmount: any) {
            const order = this.orders[orderId];
            if (!order) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
            addAmount = parseInt(addAmount);
            if (!addAmount || addAmount <= 0) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
            if (order.price * addAmount * ScreepsConstants.MARKET_FEE > this.credits) {
                return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
            }

            intents.pushByName('global', 'extendOrder', {
                orderId, addAmount
            }, 50);
            return ErrorCode.OK;
        }),
    };

    Object.defineProperties(market, {

        credits: {
            enumerable: true,
            get() {
                return (runtimeData.user.money || 0) / 1000;
            }
        },

        incomingTransactions: {
            enumerable: true,
            get() {
                if (!_incomingTransactions) {
                    _incomingTransactions = _.map(runtimeData.transactions.incoming || [], (i: any) => {
                        i.transactionId = "" + i._id;
                        delete i._id;
                        i.sender = i.sender ? { username: runtimeData.users[i.sender].username } : undefined;
                        i.recipient = i.recipient ? { username: runtimeData.users[i.recipient].username } : undefined;
                        return i;
                    });
                }
                return _incomingTransactions;
            }
        },

        outgoingTransactions: {
            enumerable: true,
            get() {
                if (!_outgoingTransactions) {
                    _outgoingTransactions = _.map(runtimeData.transactions.outgoing || [], (i: any) => {
                        i.transactionId = "" + i._id;
                        delete i._id;
                        i.sender = i.sender ? { username: runtimeData.users[i.sender].username } : undefined;
                        i.recipient = i.recipient ? { username: runtimeData.users[i.recipient].username } : undefined;
                        return i;
                    });
                }
                return _outgoingTransactions;
            }
        },

        orders: {
            enumerable: true,
            get() {
                if (!_orders) {
                    const _a = _.map(runtimeData.market.myOrders, (i: any) => {
                        i.id = "" + i._id;
                        delete i._id;
                        delete i.user;
                        i.price /= 1000;
                        return i;
                    });
                    _orders = _.indexBy(_a, 'id');
                }
                return _orders;
            }
        }
    });

    return market;
}
