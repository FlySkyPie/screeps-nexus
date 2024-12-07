import q from 'q';
import _ from 'lodash';

import * as  utils from '../utils';

import marketProcessor from './global-intents/market';
import powerProcessor from './global-intents/power';

const driver = utils.getDriver();
const C = driver.constants;

export default () => {

    return driver.getInterRoom().then((data: any) => {
        if (!data) {
            return;
        }

        const [gameTime, creeps, accessibleRooms, roomObjects, { orders, users, userPowerCreeps, userIntents, shardName } = {}] = data;

        const bulkObjects = driver.bulkObjectsWrite(),
            bulkRooms = driver.bulkRoomsWrite(),
            bulkUsers = driver.bulkUsersWrite(),
            bulkTransactions = driver.bulkTransactionsWrite(),
            bulkUsersMoney = driver.bulkUsersMoney(),
            bulkUsersResources = driver.bulkUsersResources(),
            bulkUsersPowerCreeps = driver.bulkUsersPowerCreeps(),
            bulkMarketOrders = driver.bulkMarketOrders(),
            bulkMarketIntershardOrders = driver.bulkMarketIntershardOrders(),
            activateRooms: Record<string, any> = {},
            usersById = _.indexBy(users, '_id'),
            roomObjectsByType = _.groupBy(roomObjects, 'type');

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
            bulkObjects, bulkUsers, bulkUsersPowerCreeps, shardName
        });

        marketProcessor({
            orders, userIntents, usersById, gameTime, roomObjectsByType, bulkObjects, bulkUsers, bulkTransactions,
            bulkUsersMoney, bulkUsersResources, bulkMarketOrders, bulkMarketIntershardOrders
        });

        return q.all([
            bulkObjects.execute(),
            bulkRooms.execute(),
            bulkUsers.execute(),
            bulkMarketOrders.execute(),
            bulkMarketIntershardOrders.execute(),
            bulkUsersMoney.execute(),
            bulkTransactions.execute(),
            bulkUsersResources.execute(),
            bulkUsersPowerCreeps.execute(),
            driver.clearGlobalIntents()
        ]);
    });
};

