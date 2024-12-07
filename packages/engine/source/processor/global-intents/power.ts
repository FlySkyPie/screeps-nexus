import path from 'node:path';
import _ from 'lodash';

const intentTypes = ['spawnPowerCreep', 'suicidePowerCreep', 'deletePowerCreep', 'upgradePowerCreep', 'createPowerCreep', 'renamePowerCreep'];

const modules = require('bulk-require')(path.resolve(__dirname, 'power'), ['*.js']);

export default (scope: any) => {

    const { usersById, userIntents, roomObjectsByType, gameTime } = scope;

    if (userIntents) {
        userIntents.forEach((iUserIntents: any) => {
            const user = usersById[iUserIntents.user];

            intentTypes.forEach(intentType => {
                if (iUserIntents.intents[intentType]) {
                    iUserIntents.intents[intentType].forEach((intent: any) => {
                        modules[intentType](intent, user, scope);
                    })
                }
            });
        })
    }

    if (roomObjectsByType.powerCreep) {
        roomObjectsByType.powerCreep.forEach((creep: any) => {
            if (gameTime >= creep.ageTime - 1 || creep.hits <= 0) {
                require('./power/_diePowerCreep')(creep, scope);
            }
        })
    }
};
