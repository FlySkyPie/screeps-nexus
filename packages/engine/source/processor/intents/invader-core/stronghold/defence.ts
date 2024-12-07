import _ from 'lodash';
import * as utils from '../../../../utils';
const driver = utils.getDriver();

import * as fakeRuntime from '../../../common/fake-runtime';
import defence from './defence';

export function createSafeMatrixCallback(context) {
    const { hostiles, ramparts, roomObjects } = context;

    if(!_.some(hostiles)) {
        return;
    }

    const safeMatrixCallback = function safeMatrixCallback(room) {
        const matrix = new fakeRuntime.CostMatrix();
        for(let i = 0; i < 50; i++)
            for(let j = 0; j < 50; j++)
                matrix.set(i, j, Infinity);

        for(let rampart of ramparts) {
            matrix.set(rampart.x, rampart.y, 1);
        }

        _.forEach(roomObjects, object => {
            if(object.type != 'creep' && _.includes(ScreepsConstants.OBSTACLE_OBJECT_TYPES, object.type)) {
                matrix.set(object.x, object.y, Infinity);
            }
        });

        return matrix;
    };

    return safeMatrixCallback;
}

export function distribute(positions, agents) {
    if(!_.some(agents)) {
        return {};
    }
    if(agents.length > positions.length) {
        agents = agents.slice(0, positions.length);
    }

    const result = {}, weights = _.map(positions, p => { return {pos: p, weight: 100}});
    while(_.some(agents)) {
        const creep = agents.shift();
        const place = _.max(weights, 'weight');
        _.pull(weights, place);
        result[50*place.pos.x+place.pos.y] = creep;
        _.forEach(weights, w => {
            w.weight -= Math.max(0, _.size(weights)-utils.dist(w.pos, place.pos));
        });
    }
    return result;
}
