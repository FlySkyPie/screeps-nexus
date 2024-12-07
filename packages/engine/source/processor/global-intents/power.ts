import q from 'q';
import _ from 'lodash';
import utils from '../../utils';
const driver = utils.getDriver();
import path from 'path';
const C = driver.constants;

const intentTypes = ['spawnPowerCreep','suicidePowerCreep','deletePowerCreep','upgradePowerCreep','createPowerCreep','renamePowerCreep'];

const modules = require('bulk-require')(path.resolve(__dirname, 'power'), ['*.js']);

export default scope => {

    const {usersById, userIntents, roomObjectsByType, gameTime} = scope;

    if(userIntents) {
        userIntents.forEach(iUserIntents => {
            const user = usersById[iUserIntents.user];

            intentTypes.forEach(intentType => {
                if(iUserIntents.intents[intentType]) {
                    iUserIntents.intents[intentType].forEach(intent => {
                        modules[intentType](intent, user, scope);
                    })
                }
            });
        })
    }

    if(roomObjectsByType.powerCreep) {
        roomObjectsByType.powerCreep.forEach(creep => {
            if(gameTime >= creep.ageTime-1 || creep.hits <= 0) {
               require('./power/_diePowerCreep')(creep, scope);
            }
        })
    }
};