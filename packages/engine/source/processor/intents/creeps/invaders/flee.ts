import _ from 'lodash';

import * as utils from '../../../../utils';

import * as fakeRuntime from '../../../common/fake-runtime';

export default (creep: any, range: any, context: any) => {
    const { scope, intents, hostiles } = context;

    const nearCreeps = _.filter(hostiles, c => utils.dist(creep, c) < range);
    if (_.some(nearCreeps)) {
        const direction = fakeRuntime.flee(creep, nearCreeps, range, {}, scope);
        if (direction) {
            intents.set(creep._id, 'move', { direction });
            return true;
        }
    }

    return false;
};
