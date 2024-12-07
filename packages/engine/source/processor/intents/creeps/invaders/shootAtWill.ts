import _ from 'lodash';

import { BodyParts } from '@screeps/common/src/constants/body-parts';

import * as utils from '../../../../utils';

import * as fakeRuntime from '../../../common/fake-runtime';

export default (creep: any, context: any) => {
    if (!fakeRuntime.hasActiveBodyparts(creep, BodyParts.RANGED_ATTACK)) {
        return;
    }

    const { intents, hostiles, fortifications } = context;

    let targets = _.filter(hostiles, c => utils.dist(creep, c) <= 3);
    if (!_.some(targets)) {
        targets = _.filter(fortifications, c => utils.dist(creep, c) <= 3)
    }

    if (!_.some(targets)) {
        return;
    }

    const target: any = _.min(targets, 'hits');
    intents.set(creep._id, 'rangedAttack', { id: target._id });
};
