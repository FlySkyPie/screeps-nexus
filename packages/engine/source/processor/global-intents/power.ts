import _ from 'lodash';

import _diePowerCreep from './power/_diePowerCreep';
import spawnPowerCreep from './power/spawnPowerCreep';
import suicidePowerCreep from './power/suicidePowerCreep';
import deletePowerCreep from './power/deletePowerCreep';
import upgradePowerCreep from './power/upgradePowerCreep';
import createPowerCreep from './power/createPowerCreep';
import renamePowerCreep from './power/renamePowerCreep';

const modules: Record<string, any> = {
    spawnPowerCreep,
    suicidePowerCreep,
    deletePowerCreep,
    upgradePowerCreep,
    createPowerCreep,
    renamePowerCreep,
}

const intentTypes = Array.from(Object.keys(modules));

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
