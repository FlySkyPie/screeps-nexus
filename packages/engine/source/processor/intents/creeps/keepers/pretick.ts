import _ from 'lodash';

import * as utils from '../../../../utils';

import * as fakeRuntime from '../../../common/fake-runtime';

export default (creep: any, scope: any) => {
    const { roomObjects, bulk } = scope;

    let source = undefined;
    let resources: any[] = [];
    let hostilesInMeleeRange: any[] = [];
    let hostilesInRangedRange: any[] = [];

    const intents: any = {
        list: {},
        set(id: any, name: any, data: any) {
            this.list[id] = this.list[id] || {};
            this.list[id][name] = data;
        }
    };

    _.forEach(roomObjects, object => {
        if ((object.type == 'source') || (object.type == 'mineral')) {
            resources.push(object);
        }
        if ((object.type == 'creep' || object.type == 'powerCreep') && (object.user != 2) && (object.user != 3)) {
            const distance = utils.dist(creep, object);
            if (distance <= 1) { hostilesInMeleeRange.push(object); }
            if (distance <= 3) { hostilesInRangedRange.push(object); }
        }
    });

    if (creep.memory_sourceId && !!roomObjects[creep.memory_sourceId]) {
        source = roomObjects[creep.memory_sourceId];
    }

    if (!source) {
        source = _.find(resources, o => utils.dist(creep, o) <= 5);
        if (source) {
            bulk.update(creep, { memory_sourceId: source._id.toString() });
        }
    }

    if (source && utils.dist(source, creep) > 1) {
        const direction: any = fakeRuntime.moveTo(creep, source, { range: 1, reusePath: 50 }, scope);
        if (direction > 0) {
            intents.set(creep._id, 'move', { direction });
        } else {
            bulk.update(creep, { memory_move: null });
        }
    }

    const meleeTarget = _.min(hostilesInMeleeRange, 'hits');
    if (meleeTarget) {
        intents.set(creep._id, 'attack', { id: meleeTarget._id, x: meleeTarget.x, y: meleeTarget.y });
    }

    if (_.some(hostilesInRangedRange)) {
        const damageByRange = [10, 10, 4, 1];
        const massDamage = _.sum(hostilesInRangedRange, c => damageByRange[utils.dist(creep, c)]);
        if (massDamage > 13) {
            intents.set(creep._id, 'rangedMassAttack', {});
        } else {
            const rangedTarget = _.min(hostilesInRangedRange, 'hits');
            intents.set(creep._id, 'rangedAttack', { id: rangedTarget._id });
        }
    }

    return intents.list;
};
