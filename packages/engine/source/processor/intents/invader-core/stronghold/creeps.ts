import _ from 'lodash';
import * as utils from '../../../../utils';
const driver = utils.getDriver();


const makeBody = description => {
    return _.reduce(description, (result, segment) => {
        _.times(segment.count, () => {result.body.push(segment.part); result.boosts.push(segment.boost)});
        return result;
    }, { body: [], boosts: [] });
};

export default {
    'fortifier': makeBody([
        {part: ScreepsConstants.WORK, count: 15, boost: 'XLH2O'},
        {part: ScreepsConstants.CARRY, count: 15},
        {part: ScreepsConstants.MOVE, count: 15}
    ]),
    'weakDefender': makeBody([
        {part: ScreepsConstants.ATTACK, count: 15},
        {part: ScreepsConstants.MOVE, count: 15}
    ]),
    'fullDefender': makeBody([
        {part: ScreepsConstants.ATTACK, count: 25},
        {part: ScreepsConstants.MOVE, count: 25}
    ]),
    'boostedDefender': makeBody([
        {part: ScreepsConstants.ATTACK, count: 25, boost: 'UH2O'},
        {part: ScreepsConstants.MOVE, count: 25}
    ]),
    'fullBoostedMelee': makeBody([
        {part: ScreepsConstants.ATTACK, count: 44, boost: 'XUH2O'},
        {part: ScreepsConstants.MOVE, count: 6, boost: 'XZHO2'}
    ]),
    'fullBoostedRanger': makeBody([
        {part: ScreepsConstants.RANGED_ATTACK, count: 44, boost: 'XKHO2'},
        {part: ScreepsConstants.MOVE, count: 6, boost: 'XZHO2'}
    ]),
};
