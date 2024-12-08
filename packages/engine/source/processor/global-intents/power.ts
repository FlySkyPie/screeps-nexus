import path from 'node:path';
import _ from 'lodash';
import bulk from 'bulk-require';

import _diePowerCreep from './power/_diePowerCreep';

const intentTypes = [
    'spawnPowerCreep',
    'suicidePowerCreep',
    'deletePowerCreep',
    'upgradePowerCreep',
    'createPowerCreep',
    'renamePowerCreep'
];

const modules = bulk(path.resolve(__dirname, 'power'), ['*.js']);

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
                _diePowerCreep(creep, scope);
            }
        })
    }
};
