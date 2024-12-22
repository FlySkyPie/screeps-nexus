import q from 'q';
import _ from 'lodash';

import {
    bulkMarketIntershardOrders, bulkMarketOrders,
    bulkObjectsWrite, bulkRoomsWrite,
    bulkTransactionsWrite, bulkUsersMoney,
    bulkUsersPowerCreeps, bulkUsersResources,
    bulkUsersWrite, clearGlobalIntents, getInterRoom
} from '@screeps/driver/src';

import marketProcessor from './global-intents/market';
import powerProcessor from './global-intents/power';

export default () => {

    return getInterRoom().then((data: any) => {
        if (!data) {
            return;
        }

        const [gameTime, creeps, accessibleRooms, roomObjects, { orders, users, userPowerCreeps, userIntents, shardName } = {}] = data;

        const bulkObjects = bulkObjectsWrite(),
            bulkRooms = bulkRoomsWrite(),
            bulkUsers = bulkUsersWrite(),
            bulkTransactions = bulkTransactionsWrite(),
            _bulkUsersMoney = bulkUsersMoney(),
            _bulkUsersResources = bulkUsersResources(),
            _bulkUsersPowerCreeps = bulkUsersPowerCreeps(),
            _bulkMarketOrders = bulkMarketOrders(),
            _bulkMarketIntershardOrders = bulkMarketIntershardOrders(),
            activateRooms: Record<string, any> = {},
            usersById = _.indexBy(users, '_id'),
            roomObjectsByType = _.groupBy(roomObjects, _.property('type'));

        // creeps

        creeps.forEach((creep: any) => {
            if (!accessibleRooms[creep.interRoom.room]) {
                return;
            }
            if (!activateRooms[creep.interRoom.room]) {
                bulkRooms.update(creep.interRoom.room, { active: true });
            }
            activateRooms[creep.interRoom.room] = true;

            bulkObjects.update(creep, { room: creep.interRoom.room, x: creep.interRoom.x, y: creep.interRoom.y, interRoom: null });
        });

        powerProcessor({
            userIntents, usersById, roomObjectsByType, userPowerCreeps, gameTime,
            bulkObjects, bulkUsers, bulkUsersPowerCreeps: _bulkUsersPowerCreeps, shardName
        });

        marketProcessor({
            orders, userIntents, usersById, gameTime, roomObjectsByType, bulkObjects, bulkUsers, bulkTransactions,
            bulkUsersMoney: _bulkUsersMoney, bulkUsersResources: _bulkUsersResources, bulkMarketOrders: _bulkMarketOrders, bulkMarketIntershardOrders: _bulkMarketIntershardOrders
        });

        return q.all([
            bulkObjects.execute(),
            bulkRooms.execute(),
            bulkUsers.execute(),
            _bulkMarketOrders.execute(),
            _bulkMarketIntershardOrders.execute(),
            _bulkUsersMoney.execute(),
            bulkTransactions.execute(),
            _bulkUsersResources.execute(),
            _bulkUsersPowerCreeps.execute(),
            clearGlobalIntents()
        ]);
    });
};

