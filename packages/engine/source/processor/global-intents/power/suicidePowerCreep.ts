import q from 'q';
import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (intent, user, scope) => {

    const {roomObjectsByType} = scope;

    const powerCreep = _.find(roomObjectsByType.powerCreep, i => i.user == user._id && i._id == intent.id);
    if (!powerCreep) {
        return;
    }

    require('./_diePowerCreep')(powerCreep, scope);
};