import _ from 'lodash';
import utils from '../../../../utils';
const driver = utils.getDriver();
const C = driver.constants;
import fakeRuntime from '../../../common/fake-runtime';

export default (creep, context) => {
    if(!fakeRuntime.hasActiveBodyparts(creep, C.RANGED_ATTACK)) {
        return;
    }

    const { intents, hostiles, fortifications } = context;

    let targets = _.filter(hostiles, c => utils.dist(creep, c) <= 3);
    if(!_.some(targets)) {
        targets = _.filter(fortifications, c => utils.dist(creep, c) <= 3)
    }

    if(!_.some(targets)){
        return;
    }

    const target = _.min(targets, 'hits');
    intents.set(creep._id, 'rangedAttack', {id: target._id});
};
