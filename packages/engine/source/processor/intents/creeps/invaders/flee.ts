import _ from 'lodash';
import utils from '../../../../utils';
const driver = utils.getDriver();
const C = driver.constants;
import fakeRuntime from '../../../common/fake-runtime';

export default (creep, range, context) => {
    const {scope, intents, hostiles} = context;

    const nearCreeps = _.filter(hostiles, c => utils.dist(creep, c) < range);
    if(_.some(nearCreeps)) {
        const direction = fakeRuntime.flee(creep, nearCreeps, range, {}, scope);
        if(direction) {
            intents.set(creep._id, 'move', { direction });
            return true;
        }
    }

    return false;
};
