import _ from 'lodash';
import * as utils from '../../../../utils';


import * as fakeRuntime from '../../../common/fake-runtime';
import * as defence from './defence';

export default (creep: any, context: any) => {
    const { hostiles, intents, scope } = context;

    if (!_.some(hostiles)) {
        return;
    }

    const safeMatrixCallback = defence.createSafeMatrixCallback(context);

    const target: any = fakeRuntime.findClosestByPath(creep, hostiles, { costCallback: safeMatrixCallback }, scope);

    if (!target) {
        return;
    }

    if (utils.dist(creep, target) <= 1) {
        intents.set(creep._id, 'attack', { id: target._id, x: target.x, y: target.y });
    } else {
        fakeRuntime.walkTo(creep, target, { costCallback: safeMatrixCallback }, context);
    }
};
