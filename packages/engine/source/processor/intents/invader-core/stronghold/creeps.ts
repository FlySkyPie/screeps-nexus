import { BodyParts } from '@screeps/common/src/constants/body-parts';
import _ from 'lodash';

const makeBody = (description: any) => {
    return _.reduce(description, (result: any, segment: any) => {
        _.times(segment.count, () => { result.body.push(segment.part); result.boosts.push(segment.boost) });
        return result;
    }, { body: [], boosts: [] });
};

export default {
    'fortifier': makeBody([
        { part: BodyParts.WORK, count: 15, boost: 'XLH2O' },
        { part: BodyParts.CARRY, count: 15 },
        { part: BodyParts.MOVE, count: 15 }
    ]),
    'weakDefender': makeBody([
        { part: BodyParts.ATTACK, count: 15 },
        { part: BodyParts.MOVE, count: 15 }
    ]),
    'fullDefender': makeBody([
        { part: BodyParts.ATTACK, count: 25 },
        { part: BodyParts.MOVE, count: 25 }
    ]),
    'boostedDefender': makeBody([
        { part: BodyParts.ATTACK, count: 25, boost: 'UH2O' },
        { part: BodyParts.MOVE, count: 25 }
    ]),
    'fullBoostedMelee': makeBody([
        { part: BodyParts.ATTACK, count: 44, boost: 'XUH2O' },
        { part: BodyParts.MOVE, count: 6, boost: 'XZHO2' }
    ]),
    'fullBoostedRanger': makeBody([
        { part: BodyParts.RANGED_ATTACK, count: 44, boost: 'XKHO2' },
        { part: BodyParts.MOVE, count: 6, boost: 'XZHO2' }
    ]),
};
