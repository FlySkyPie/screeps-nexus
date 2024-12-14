import q from 'q';
import _ from 'lodash';

import * as driver from '@screeps/driver/src/index';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { POWER_INFO } from '@screeps/common/src/tables/power-info';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';
import { ListItems } from '@screeps/common/src/tables/list-items';
import { Resource } from '@screeps/common/src/constants/resource';
import { IntershardResources } from '@screeps/common/src/constants/intershard-resources';

import * as  utils from '../../utils';
import { logger } from '../../logger';

export default ({
    orders,
    userIntents,
    usersById,
    gameTime,
    roomObjectsByType,
    bulkObjects,
    bulkUsers,
    bulkTransactions,
    bulkUsersMoney,
    bulkUsersResources,
    bulkMarketOrders,
    bulkMarketIntershardOrders }: any
) => {
    const terminals = roomObjectsByType.terminal;

    const terminalsByRoom: any = _.indexBy(terminals, 'room');

    function executeTransfer(
        fromTerminal: any,
        toTerminal: any,
        resourceType: any,
        amount: any,
        transferFeeTerminal: any,
        additionalFields: any) {

        additionalFields = additionalFields || {};

        if (!fromTerminal || !toTerminal || !transferFeeTerminal) {
            return false;
        }
        if (fromTerminal.user && (!fromTerminal.store || !fromTerminal.store[resourceType] || fromTerminal.store[resourceType] < amount)) {
            return false;
        }
        if (toTerminal.user) {
            const targetResourceTotal = utils.calcResources(toTerminal), freeSpace = Math.max(0, toTerminal.storeCapacity - targetResourceTotal);
            amount = Math.min(amount, freeSpace);
        }
        if (!(amount > 0)) {
            return;
        }

        const range = utils.calcRoomsDistance(fromTerminal.room, toTerminal.room, true);
        let transferCost = utils.calcTerminalEnergyCost(amount, range);

        const effect: any = _.find(transferFeeTerminal.effects, { power: PWRCode.PWR_OPERATE_TERMINAL });
        if (effect && effect.endTime > gameTime) {
            transferCost = Math.ceil(transferCost * POWER_INFO[PWRCode.PWR_OPERATE_TERMINAL].effect[effect.level - 1]);
        }

        if (transferFeeTerminal === fromTerminal &&
            (resourceType != Resource.RESOURCE_ENERGY && fromTerminal.store.energy < transferCost ||
                resourceType == Resource.RESOURCE_ENERGY && fromTerminal.store.energy < amount + transferCost) ||
            transferFeeTerminal === toTerminal && toTerminal.store.energy < transferCost) {
            return false;
        }

        if (toTerminal.user) {
            toTerminal.store = toTerminal.store || {};
            toTerminal.store[resourceType] = (toTerminal.store[resourceType] || 0) + amount;
            bulkObjects.update(toTerminal, { store: { [resourceType]: toTerminal.store[resourceType] } });
        }

        bulkObjects.update(fromTerminal, { store: { [resourceType]: fromTerminal.store[resourceType] - amount } });
        bulkObjects.update(transferFeeTerminal, { store: { energy: transferFeeTerminal.store.energy - transferCost } });

        bulkTransactions.insert(_.extend({
            time: +gameTime,
            sender: fromTerminal.user ? "" + fromTerminal.user : undefined,
            recipient: toTerminal.user ? "" + toTerminal.user : undefined,
            resourceType: resourceType,
            amount: amount,
            from: fromTerminal.room,
            to: toTerminal.room
        }, additionalFields));

        return true;
    }

    _.filter(terminals, (i: any) => !!i.send).forEach(terminal => {

        const intent = terminal.send;

        bulkObjects.update(terminal, { send: null });

        if (terminal.cooldownTime > gameTime) {
            return;
        }
        if (!terminalsByRoom[intent.targetRoomName] ||
            !terminalsByRoom[intent.targetRoomName].user) {
            return;
        }

        let cooldown = ScreepsConstants.TERMINAL_COOLDOWN;
        const effect: any = _.find(terminal.effects, { power: PWRCode.PWR_OPERATE_TERMINAL });
        if (effect && effect.endTime > gameTime) {
            cooldown = Math.round(cooldown * POWER_INFO[PWRCode.PWR_OPERATE_TERMINAL].effect[effect.level - 1]);
        }

        if (executeTransfer(terminal, terminalsByRoom[intent.targetRoomName], intent.resourceType, intent.amount, terminal, {
            description: intent.description ? intent.description.replace(/</g, '&lt;') : undefined
        })) {
            bulkObjects.update(terminal, { cooldownTime: gameTime + cooldown });
        }
    });



    const ordersById: any = _.indexBy(orders, '_id');
    const terminalDeals: any[] = [];
    let directDeals: any[] = [];

    const nowTimestamp = new Date().getTime();

    if (userIntents) {
        userIntents.forEach((iUserIntents: any) => {

            const user = usersById[iUserIntents.user];

            if (iUserIntents.intents.createOrder) {
                iUserIntents.intents.createOrder.forEach((intent: any) => {

                    if (!intent.price || !intent.totalAmount) {
                        return;
                    }
                    if (!_.contains(ListItems.RESOURCES_ALL, intent.resourceType) && !_.contains(ListItems.INTERSHARD_RESOURCES,
                        intent.resourceType)) {
                        return;
                    }
                    if (!_.contains(ListItems.INTERSHARD_RESOURCES, intent.resourceType) &&
                        (!terminalsByRoom[intent.roomName] || terminalsByRoom[intent.roomName].user != iUserIntents.user)) {
                        return;
                    }
                    if (intent.price <= 0 || intent.totalAmount <= 0) {
                        return;
                    }

                    const fee = Math.ceil(intent.price * intent.totalAmount * ScreepsConstants.MARKET_FEE);

                    if (user.money < fee) {
                        return;
                    }

                    bulkUsers.inc(user, 'money', -fee);

                    const order: any = _.extend({
                        createdTimestamp: nowTimestamp,
                        user: iUserIntents.user,
                        active: false,
                        type: intent.type == ScreepsConstants.ORDER_SELL ? ScreepsConstants.ORDER_SELL : ScreepsConstants.ORDER_BUY,
                        amount: 0,
                        remainingAmount: intent.totalAmount
                    }, intent);

                    let bulk = bulkMarketIntershardOrders;
                    if (!_.contains(ListItems.INTERSHARD_RESOURCES, intent.resourceType)) {
                        bulk = bulkMarketOrders;
                        order.created = gameTime;
                    }

                    bulk.insert(order);

                    intent.price /= 1000;

                    bulkUsersMoney.insert({
                        date: new Date(),
                        tick: gameTime,
                        user: iUserIntents.user,
                        type: 'market.fee',
                        balance: user.money / 1000,
                        change: -fee / 1000,
                        market: {
                            order: intent
                        }
                    });
                });
            }

            if (iUserIntents.intents.changeOrderPrice) {
                iUserIntents.intents.changeOrderPrice.forEach((intent: any) => {
                    const order: any = ordersById[intent.orderId];
                    if (!order || order.user != iUserIntents.user) {
                        return;
                    }

                    if (!intent.newPrice || intent.newPrice <= 0) {
                        return;
                    }

                    if (intent.newPrice > order.price) {

                        const fee = Math.ceil((intent.newPrice - order.price) * order.remainingAmount * ScreepsConstants.MARKET_FEE);

                        if (user.money < fee) {
                            return;
                        }

                        bulkUsers.inc(user, 'money', -fee);

                        bulkUsersMoney.insert({
                            date: new Date(),
                            tick: gameTime,
                            user: iUserIntents.user,
                            type: 'market.fee',
                            balance: user.money / 1000,
                            change: -fee / 1000,
                            market: {
                                changeOrderPrice: {
                                    orderId: intent.orderId,
                                    oldPrice: order.price / 1000,
                                    newPrice: intent.newPrice / 1000
                                }
                            }
                        });
                    }

                    const bulk = _.contains(ListItems.INTERSHARD_RESOURCES,
                        order.resourceType) ? bulkMarketIntershardOrders : bulkMarketOrders;
                    bulk.inc(order, 'price', intent.newPrice - order.price);
                });
            }

            if (iUserIntents.intents.extendOrder) {
                iUserIntents.intents.extendOrder.forEach((intent: any) => {
                    const order: any = ordersById[intent.orderId];
                    if (!order || order.user != iUserIntents.user) {
                        return;
                    }
                    if (!intent.addAmount || intent.addAmount <= 0) {
                        return;
                    }

                    const fee = Math.ceil(order.price * intent.addAmount * ScreepsConstants.MARKET_FEE);

                    if (user.money < fee) {
                        return;
                    }

                    bulkUsers.inc(user, 'money', -fee);

                    bulkUsersMoney.insert({
                        date: new Date(),
                        tick: gameTime,
                        user: iUserIntents.user,
                        type: 'market.fee',
                        balance: user.money / 1000,
                        change: -fee / 1000,
                        market: {
                            extendOrder: {
                                orderId: intent.orderId,
                                addAmount: intent.addAmount
                            }
                        }
                    });

                    const bulk = _.contains(ListItems.INTERSHARD_RESOURCES,
                        order.resourceType) ? bulkMarketIntershardOrders : bulkMarketOrders;
                    bulk.inc(order, 'remainingAmount', intent.addAmount);
                    bulk.inc(order, 'totalAmount', intent.addAmount);
                });
            }


            if (iUserIntents.intents.cancelOrder) {
                iUserIntents.intents.cancelOrder.forEach((intent: any) => {
                    if (ordersById[intent.orderId] && ordersById[intent.orderId].user == iUserIntents.user) {
                        ordersById[intent.orderId].remainingAmount = 0;
                        ordersById[intent.orderId]._cancelled = true;
                        //logger.info('Order cancelled ',JSON.stringify(ordersById[intent.orderId]));
                    }
                });
            }

            if (iUserIntents.intents.deal) {
                iUserIntents.intents.deal.forEach((intent: any) => {
                    intent.user = iUserIntents.user;

                    if (!ordersById[intent.orderId]) {
                        return;
                    }
                    if (intent.amount <= 0) {
                        return;
                    }
                    if (_.contains(ListItems.INTERSHARD_RESOURCES, ordersById[intent.orderId].resourceType)) {
                        directDeals.push(intent);
                        return;
                    }
                    if (!terminalsByRoom[intent.targetRoomName] || terminalsByRoom[intent.targetRoomName].user != iUserIntents.user) {
                        return;
                    }

                    terminalDeals.push(intent);
                });
            }
        });
    }

    terminalDeals.sort((a, b) => utils.calcRoomsDistance(a.targetRoomName, ordersById[a.orderId].roomName, true) - utils.calcRoomsDistance(b.targetRoomName, ordersById[b.orderId].roomName, true))

    terminalDeals.forEach(deal => {
        const order = ordersById[deal.orderId];
        const orderTerminal = terminalsByRoom[order.roomName];
        const targetTerminal = terminalsByRoom[deal.targetRoomName];
        let buyer;
        let seller;

        if (!orderTerminal || !targetTerminal) {
            return;
        }
        if (targetTerminal.cooldownTime > gameTime) {
            return;
        }
        orderTerminal.store = orderTerminal.store || {};
        targetTerminal.store = targetTerminal.store || {};

        if (order.type == ScreepsConstants.ORDER_SELL) {
            buyer = targetTerminal;
            seller = orderTerminal;
        }
        else {
            seller = targetTerminal;
            buyer = orderTerminal;
        }

        let amount = Math.min(deal.amount, order.remainingAmount);
        if (seller.user) {
            amount = Math.min(amount, seller.store[order.resourceType] || 0);
        }
        if (buyer.user) {
            const targetResourceTotal = utils.calcResources(buyer), targetFreeSpace = Math.max(0, buyer.storeCapacity - targetResourceTotal);
            amount = Math.min(amount, targetFreeSpace);
        }
        if (!(amount > 0)) {
            return;
        }

        let dealCost = amount * order.price;

        if (buyer.user) {
            dealCost = Math.min(dealCost, usersById[buyer.user].money || 0);
            amount = Math.floor(dealCost / order.price);
            dealCost = amount * order.price;
            if (!amount) {
                return;
            }
        }

        if (executeTransfer(seller, buyer, order.resourceType, amount, targetTerminal, {
            order: {
                id: "" + order._id,
                type: order.type,
                price: order.price / 1000
            }
        })) {

            if (seller.user) {
                bulkUsers.inc(usersById[seller.user], 'money', dealCost);
                bulkUsersMoney.insert({
                    date: new Date(),
                    tick: gameTime,
                    user: seller.user,
                    type: 'market.sell',
                    balance: usersById[seller.user].money / 1000,
                    change: dealCost / 1000,
                    market: {
                        resourceType: order.resourceType,
                        roomName: order.roomName,
                        targetRoomName: deal.targetRoomName,
                        price: order.price / 1000,
                        npc: !buyer.user,
                        owner: order.user,
                        dealer: deal.user,
                        amount
                    }
                });
            }
            if (buyer.user) {
                bulkUsers.inc(usersById[buyer.user], 'money', -dealCost);
                bulkUsersMoney.insert({
                    date: new Date(),
                    tick: gameTime,
                    user: buyer.user,
                    type: 'market.buy',
                    balance: usersById[buyer.user].money / 1000,
                    change: -dealCost / 1000,
                    market: {
                        resourceType: order.resourceType,
                        roomName: order.roomName,
                        targetRoomName: deal.targetRoomName,
                        price: order.price / 1000,
                        npc: !seller.user,
                        owner: order.user,
                        dealer: deal.user,
                        amount
                    }
                });
            }
            bulkMarketOrders.update(order, {
                amount: order.amount - amount,
                remainingAmount: order.remainingAmount - amount
            });
            let cooldown = ScreepsConstants.TERMINAL_COOLDOWN;
            const effect: any = _.find(targetTerminal.effects, { power: PWRCode.PWR_OPERATE_TERMINAL });
            if (effect && effect.endTime > gameTime) {
                cooldown = Math.round(cooldown * POWER_INFO[PWRCode.PWR_OPERATE_TERMINAL].effect[effect.level - 1]);
            }
            bulkObjects.update(targetTerminal, { cooldownTime: gameTime + cooldown });
        }
    });

    directDeals = _.shuffle(directDeals);

    directDeals.forEach(deal => {
        const order = ordersById[deal.orderId];
        let buyer;
        let seller;
        const userFieldNames: Record<string, any> = {
            [IntershardResources.SUBSCRIPTION_TOKEN]: 'subscriptionTokens'
        };

        if (order.type == ScreepsConstants.ORDER_SELL) {
            buyer = usersById[deal.user];
            seller = usersById[order.user];
        }
        else {
            seller = usersById[deal.user];
            buyer = usersById[order.user];
        }

        if (!seller || !buyer) {
            return;
        }

        const amount = Math.min(deal.amount, order.remainingAmount, seller[userFieldNames[order.resourceType]] || 0);
        if (!amount || amount < 0) {
            return;
        }

        const dealCost = amount * order.price;

        if (buyer.user && (!buyer.money || buyer.money < dealCost)) {
            return;
        }

        bulkUsers.inc(seller, 'money', dealCost);
        bulkUsers.inc(seller, userFieldNames[order.resourceType], -amount);

        bulkUsersMoney.insert({
            date: new Date(),
            tick: gameTime,
            user: "" + seller._id,
            type: 'market.sell',
            balance: seller.money / 1000,
            change: dealCost / 1000,
            market: {
                resourceType: order.resourceType,
                price: order.price / 1000,
                amount
            }
        });
        bulkUsersResources.insert({
            date: new Date(),
            resourceType: order.resourceType,
            user: "" + seller._id,
            change: -amount,
            balance: seller[userFieldNames[order.resourceType]],
            marketOrderId: "" + order._id,
            market: {
                orderId: "" + order._id,
                anotherUser: "" + buyer._id
            }
        });

        bulkUsers.inc(buyer, 'money', -dealCost);
        bulkUsers.inc(buyer, userFieldNames[order.resourceType], amount);

        bulkUsersMoney.insert({
            date: new Date(),
            tick: gameTime,
            user: "" + buyer._id,
            type: 'market.buy',
            balance: buyer.money / 1000,
            change: -dealCost / 1000,
            market: {
                resourceType: order.resourceType,
                price: order.price / 1000,
                amount
            }
        });
        const bulk = _.contains(ListItems.INTERSHARD_RESOURCES, order.resourceType) ? bulkMarketIntershardOrders : bulkMarketOrders;
        bulk.inc(order, 'amount', -amount);
        bulk.inc(order, 'remainingAmount', -amount);
        bulkUsersResources.insert({
            date: new Date(),
            resourceType: order.resourceType,
            user: "" + buyer._id,
            change: amount,
            balance: buyer[userFieldNames[order.resourceType]],
            market: {
                orderId: "" + order._id,
                anotherUser: "" + seller._id
            }
        });
    });

    if (orders) {
        orders.forEach((order: any) => {
            const bulk = _.contains(ListItems.INTERSHARD_RESOURCES,
                order.resourceType) ? bulkMarketIntershardOrders : bulkMarketOrders;

            if (order._cancelled) {
                bulk.remove(order._id);
                return;
            }

            if (order.user && (nowTimestamp - order.createdTimestamp > ScreepsConstants.MARKET_ORDER_LIFE_TIME)) {
                const remainingFee = order.remainingAmount * order.price * ScreepsConstants.MARKET_FEE;
                logger.info(`${order.id} remaining fee: ${remainingFee}`);
                if (remainingFee > 0) {
                    const user = usersById[order.user];
                    bulkUsers.inc(user, 'money', remainingFee);
                    bulkUsersMoney.insert({
                        date: new Date(),
                        tick: gameTime,
                        user: user._id.toString(),
                        type: 'market.fee',
                        balance: user.money / 1000,
                        change: remainingFee / 1000,
                        market: {
                            order: {
                                orderId: order._id.toString(),
                                type: order.type,
                                resourceType: order.resourceType,
                                price: order.price / 1000,
                                remainingAmount: order.remainingAmount,
                                roomName: order.roomName
                            }
                        }
                    });
                }

                bulk.remove(order._id);
                return;
            }

            if (!order.user) {
                return;
            }

            const terminal = terminalsByRoom[order.roomName];

            if (order.type == ScreepsConstants.ORDER_SELL) {

                let availableResourceAmount = order.resourceType == IntershardResources.SUBSCRIPTION_TOKEN ?
                    (usersById[order.user].subscriptionTokens || 0) :
                    terminal && terminal.user == order.user ? terminal.store[order.resourceType] || 0 : 0;

                availableResourceAmount = Math.min(availableResourceAmount, order.remainingAmount);

                if (order.active) {
                    if (!availableResourceAmount || availableResourceAmount < 0) {
                        bulk.update(order, { active: false, amount: 0 });
                        return;
                    }
                    if (order.amount != availableResourceAmount) {
                        bulk.update(order, { amount: availableResourceAmount });
                    }
                }
                else {
                    if (availableResourceAmount > 0) {
                        bulk.update(order, {
                            active: true,
                            amount: availableResourceAmount
                        });
                    }
                }
            }

            if (order.type == ScreepsConstants.ORDER_BUY) {

                const user = usersById[order.user], userMoney = user.money || 0;
                const isOwner = _.contains(ListItems.INTERSHARD_RESOURCES,
                    order.resourceType) || (!!terminal && terminal.user == order.user);

                let newAmount = Math.min(Math.floor(userMoney / order.price), order.remainingAmount);
                if (terminal && terminal.user) {
                    const targetResourceTotal = utils.calcResources(terminal), targetFreeSpace = Math.max(0, terminal.storeCapacity - targetResourceTotal);
                    newAmount = Math.min(newAmount, targetFreeSpace);
                }

                const newActive = isOwner && newAmount > 0;

                if (order.amount != newAmount || order.active != newActive) {
                    bulk.update(order, { amount: newAmount, active: newActive });
                }
            }
        });
    }

    return () => q.all([
        bulkUsers.execute(),
        bulkMarketOrders.execute(),
        bulkMarketIntershardOrders.execute(),
        bulkUsersMoney.execute(),
        bulkTransactions.execute(),
        bulkUsersResources.execute(),
        driver.clearMarketIntents()
    ]);
};
