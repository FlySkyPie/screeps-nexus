import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, intents, scope) => {
    const {gameTime} = scope;
    if(object.landTime == 1 + gameTime) {
        _.forEach(intents.users, userIntents => {
            _.forEach(userIntents.objects, i => {
                if(!!i.createCreep) { i.createCreep = null; }
            });
        });
    }
};
