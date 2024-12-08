import _ from 'lodash';
import * as utils from '../utils';
const driver = utils.getRuntimeDriver();

import util from 'util';

export function make(runtimeData, intents, register) {
    let ordersCreatedDuringTick = 0;
    const cachedOrders = {};
    const cachedHistory = {};
    let _incomingTransactions;
    let _outgoingTransactions;
    let _orders;

    function _getOrders(resourceType) {
        if(!resourceType) {
            resourceType = 'all';
        }
        if(!cachedOrders[resourceType]) {
            if(resourceType != 'all' && !_.contains(ScreepsConstants.RESOURCES_ALL, resourceType) && !_.contains(ScreepsConstants.INTERSHARD_RESOURCES, resourceType)) {
                return {};
            }
            cachedOrders[resourceType] = JSON.parse(JSON.stringify(runtimeData.market.orders[resourceType]) || '{}');
            for(const i in cachedOrders[resourceType]) {
                cachedOrders[resourceType][i].price /= 1000;
            }
        }
        return cachedOrders[resourceType];
    }

    const market = {

        calcTransactionCost: register.wrapFn((amount, roomName1, roomName2) => {
            const distance = utils.calcRoomsDistance(roomName1, roomName2, true);
            return utils.calcTerminalEnergyCost(amount, distance);
        }),

        getAllOrders: register.wrapFn(filter => {
            const orders = _getOrders(filter && filter.resourceType);
            return _.filter(orders, filter);
        }),

        getHistory: register.wrapFn(resourceType => {
            if(!resourceType) {
                resourceType = 'all';
            }

            if(!cachedHistory[resourceType]) {
                if(resourceType != 'all' && !_.contains(ScreepsConstants.RESOURCES_ALL, resourceType) && !_.contains(ScreepsConstants.INTERSHARD_RESOURCES, resourceType)) {
                    return {};
                }
                cachedHistory[resourceType] = JSON.parse(JSON.stringify(runtimeData.market.history[resourceType] || {}));
                return cachedHistory[resourceType];
            }
        }),

        getOrderById: register.wrapFn(function(id) {
            const order = runtimeData.market.orders.all[id] || this.orders[id];
            if(!order) {
                return null;
            }
            const result = JSON.parse(JSON.stringify(order));
            result.price /= 1000;
            return result;
        }),

        createOrder: register.wrapFn(function(type, resourceType, price, totalAmount, roomName) {
            if(_.isObject(type)) {
                var {type, resourceType, price, totalAmount, roomName} = type;
            }
            if(!_.contains(ScreepsConstants.RESOURCES_ALL, resourceType) && !_.contains(ScreepsConstants.INTERSHARD_RESOURCES, resourceType)) {
                return ScreepsConstants.ERR_INVALID_ARGS;
            }
            if(type != ScreepsConstants.ORDER_BUY && type != ScreepsConstants.ORDER_SELL) {
                return ScreepsConstants.ERR_INVALID_ARGS;
            }
            price = parseFloat(price);
            totalAmount = parseInt(totalAmount);
            if(!price || price <= 0 || !totalAmount) {
                return ScreepsConstants.ERR_INVALID_ARGS;
            }
            if(price * totalAmount * ScreepsConstants.MARKET_FEE > this.credits) {
                return ScreepsConstants.ERR_NOT_ENOUGH_RESOURCES;
            }
            if(!_.contains(ScreepsConstants.INTERSHARD_RESOURCES, resourceType) &&
                (!roomName || !_.any(runtimeData.userObjects, {type: 'terminal', room: roomName}))) {
                return ScreepsConstants.ERR_NOT_OWNER;
            }
            if(_.size(this.orders) + ordersCreatedDuringTick >= ScreepsConstants.MARKET_MAX_ORDERS) {
                return ScreepsConstants.ERR_FULL;
            }
            ordersCreatedDuringTick++;
            intents.pushByName('global', 'createOrder', {
                type, resourceType, price, totalAmount, roomName
            });
            return ScreepsConstants.OK;
        }),

        cancelOrder: register.wrapFn(function(orderId) {
            if(!this.orders[orderId]) {
                return ScreepsConstants.ERR_INVALID_ARGS;
            }
            intents.pushByName('global', 'cancelOrder', {orderId}, 50);
            return ScreepsConstants.OK;
        }),

        deal: register.wrapFn(function(orderId, amount, targetRoomName) {
            const order = runtimeData.market.orders.all[orderId];
            if(!order) {
                return ScreepsConstants.ERR_INVALID_ARGS;
            }
            amount = parseInt(amount);
            if(!amount || amount < 0) {
                return ScreepsConstants.ERR_INVALID_ARGS;
            }
            if(_.contains(ScreepsConstants.INTERSHARD_RESOURCES, order.resourceType)) {
                if(order.resourceType == ScreepsConstants.SUBSCRIPTION_TOKEN) {
                    if(order.type == ScreepsConstants.ORDER_BUY && (runtimeData.user.subscriptionTokens||0) < amount) {
                        return ScreepsConstants.ERR_NOT_ENOUGH_RESOURCES;
                    }
                }
            }
            else {
                if(!targetRoomName) {
                    return ScreepsConstants.ERR_INVALID_ARGS;
                }
                const terminal = _.find(runtimeData.userObjects, {type: 'terminal', room: targetRoomName}), transferCost = this.calcTransactionCost(amount, targetRoomName, order.roomName);
                if(!terminal) {
                    return ScreepsConstants.ERR_NOT_OWNER;
                }
                if(!terminal.store || terminal.store[ScreepsConstants.RESOURCE_ENERGY] < transferCost) {
                    return ScreepsConstants.ERR_NOT_ENOUGH_RESOURCES;
                }
                if(terminal.cooldownTime > runtimeData.time) {
                    return ScreepsConstants.ERR_TIRED;
                }
                if(order.type == ScreepsConstants.ORDER_BUY) {
                    if(order.resourceType != ScreepsConstants.RESOURCE_ENERGY && (!terminal.store[order.resourceType] || terminal.store[order.resourceType] < amount) ||
                         order.resourceType == ScreepsConstants.RESOURCE_ENERGY && terminal.store[ScreepsConstants.RESOURCE_ENERGY] < amount + transferCost) {
                        return ScreepsConstants.ERR_NOT_ENOUGH_RESOURCES;
                    }
                }
            }

            if(order.type == ScreepsConstants.ORDER_SELL && (runtimeData.user.money || 0) < amount * order.price) {
                return ScreepsConstants.ERR_NOT_ENOUGH_RESOURCES;
            }

            if(!intents.pushByName('global', 'deal', {orderId, targetRoomName, amount}, 10)) {
                return ScreepsConstants.ERR_FULL;
            }
            return ScreepsConstants.OK;
        }),

        changeOrderPrice: register.wrapFn(function(orderId, newPrice) {
            const order = this.orders[orderId];
            if(!order) {
                return ScreepsConstants.ERR_INVALID_ARGS;
            }
            newPrice = parseFloat(newPrice);
            if(!newPrice || newPrice <= 0) {
                return ScreepsConstants.ERR_INVALID_ARGS;
            }
            if(newPrice > order.price && (newPrice - order.price) * order.remainingAmount * ScreepsConstants.MARKET_FEE > this.credits) {
                return ScreepsConstants.ERR_NOT_ENOUGH_RESOURCES;
            }

            intents.pushByName('global', 'changeOrderPrice', {
                orderId, newPrice
            }, 50);
            return ScreepsConstants.OK;
        }),

        extendOrder: register.wrapFn(function(orderId, addAmount) {
            const order = this.orders[orderId];
            if(!order) {
                return ScreepsConstants.ERR_INVALID_ARGS;
            }
            addAmount = parseInt(addAmount);
            if(!addAmount || addAmount <= 0) {
                return ScreepsConstants.ERR_INVALID_ARGS;
            }
            if(order.price * addAmount * ScreepsConstants.MARKET_FEE > this.credits) {
                return ScreepsConstants.ERR_NOT_ENOUGH_RESOURCES;
            }

            intents.pushByName('global', 'extendOrder', {
                orderId, addAmount
            }, 50);
            return ScreepsConstants.OK;
        }),
    };

    Object.defineProperties(market, {

        credits: {
            enumerable: true,
            get() {
                return (runtimeData.user.money || 0)/1000;
            }
        },

        incomingTransactions: {
            enumerable: true,
            get() {
                if(!_incomingTransactions) {
                    _incomingTransactions = _.map(runtimeData.transactions.incoming || [], i => {
                        i.transactionId = "" + i._id;
                        delete i._id;
                        i.sender = i.sender ? {username: runtimeData.users[i.sender].username} : undefined;
                        i.recipient = i.recipient ? {username: runtimeData.users[i.recipient].username} : undefined;
                        return i;
                    });
                }
                return _incomingTransactions;
            }
        },

        outgoingTransactions: {
            enumerable: true,
            get() {
                if(!_outgoingTransactions) {
                    _outgoingTransactions = _.map(runtimeData.transactions.outgoing || [], i => {
                        i.transactionId = ""+i._id;
                        delete i._id;
                        i.sender = i.sender ? {username: runtimeData.users[i.sender].username} : undefined;
                        i.recipient = i.recipient ? {username: runtimeData.users[i.recipient].username} : undefined;
                        return i;
                    });
                }
                return _outgoingTransactions;
            }
        },

        orders: {
            enumerable: true,
            get() {
                if(!_orders) {
                    _orders = _(runtimeData.market.myOrders).map(i => {
                        i.id = ""+i._id;
                        delete i._id;
                        delete i.user;
                        i.price /= 1000;
                        return i;
                    }).indexBy('id').value();
                }
                return _orders;
            }
        }
    });

    return market;
}
