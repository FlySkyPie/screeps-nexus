import _ from 'lodash';
import * as utils from '../../../../utils';
const driver = utils.getDriver();

import * as fakeRuntime from '../../../common/fake-runtime';
import defence from './defence';

export default (creep, context) => {
    const { ramparts, intents } = context;

    if(!creep.store.energy || !_.some(ramparts)) {
        return;
    }

    const repairRamparts = _.filter(ramparts, r => r.hitsTarget &&  r.hits < r.hitsTarget);
    if(!_.some(repairRamparts)) {
        return;
    }

    const weakestRampart = _.min(repairRamparts, 'hits');
    if(!weakestRampart) {
        return;
    }

    if(utils.dist(creep, weakestRampart) <= 3) {
        intents.set(creep._id, 'repair', {id: weakestRampart._id, x: weakestRampart.x, y: weakestRampart.y});
        return;
    }

    const safeMatrixCallback = defence.createSafeMatrixCallback(context);

    fakeRuntime.walkTo(creep, weakestRampart, { range: 3, costCallback: safeMatrixCallback }, context);
    const weakestInRange = _.min(_.filter(repairRamparts, r => utils.dist(creep, r) <= 3), 'hits');
    intents.set(creep._id, 'repair', {id: weakestInRange._id, x: weakestInRange.x, y: weakestInRange.y});
};
