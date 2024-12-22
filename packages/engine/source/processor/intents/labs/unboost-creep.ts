import _ from 'lodash';

import * as utils from '../../../utils';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { ListItems } from '@screeps/common/src/tables/list-items';
import { Resource } from '@screeps/common/src/constants/resource';

import _recalcBody from '../creeps/_recalc-body';
import _createEnergy from '../creeps/_create-energy';

export default (object: any, intent: any, scope: any) => {
    const { roomObjects, bulk, roomController, gameTime } = scope;

    if (!!object.cooldownTime && object.cooldownTime > gameTime) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || target.type != 'creep' || target.user != object.user) {
        return;
    }
    if (!utils.checkStructureAgainstController(object, roomObjects, roomController)) {
        return;
    }
    if (Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }
    const boostedParts = _.mapValues(
        _.groupBy(
            _.filter(target.body, (p: any) => !!p.boost),
            'boost'),
        v => v.length);
    if (!_.some(Object.values(boostedParts))) {
        return;
    }

    target.body.forEach((p: any) => { p.boost = null; });
    _recalcBody(target);
    bulk.update(target, { body: target.body, storeCapacity: target.storeCapacity });

    const cooldown = _.reduce(ListItems.RESOURCES_ALL, (a, r) => {
        if (!boostedParts[r]) {
            return a;
        }

        const energyReturn = boostedParts[r] * ScreepsConstants.LAB_UNBOOST_ENERGY;
        if (energyReturn > 0) {
            _createEnergy(target.x, target.y, target.room, energyReturn, Resource.RESOURCE_ENERGY, scope);
        }

        const mineralReturn = boostedParts[r] * ScreepsConstants.LAB_UNBOOST_MINERAL;
        if (mineralReturn > 0) {
            _createEnergy(target.x, target.y, target.room, mineralReturn, r, scope);
        }

        return a + boostedParts[r] * utils.calcTotalReactionsTime(r) * ScreepsConstants.LAB_UNBOOST_MINERAL / ScreepsConstants.LAB_REACTION_AMOUNT;
    }, 0);

    if (cooldown > 0) {
        bulk.update(object, { cooldownTime: cooldown + gameTime });
    }
};
