import _ from 'lodash';

import { ListItems } from '@screeps/common/src/tables/list-items';
import { POWER_INFO } from '@screeps/common/src/tables/power-info';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';
import { Resource } from '@screeps/common/src/constants/resource';

import * as utils from '../../../utils';

export default (object: any, intent: any, { bulk, gameTime }: any) => {

    if (!/^(W|E)\d+(N|S)\d+$/.test(intent.targetRoomName)) {
        return;
    }

    if (!_.contains(ListItems.RESOURCES_ALL, intent.resourceType)) {
        return;
    }
    if (!intent.amount || !object.store || !(object.store[intent.resourceType] >= intent.amount)) {
        return;
    }

    const range = utils.calcRoomsDistance(object.room, intent.targetRoomName, true);
    let cost = utils.calcTerminalEnergyCost(intent.amount, range);

    const effect: any = _.find(object.effects, { power: PWRCode.PWR_OPERATE_TERMINAL });
    if (effect && effect.endTime >= gameTime) {
        cost = Math.ceil(cost * POWER_INFO[PWRCode.PWR_OPERATE_TERMINAL].effect[effect.level - 1]);
    }

    if (intent.resourceType != Resource.RESOURCE_ENERGY && object.store.energy < cost ||
        intent.resourceType == Resource.RESOURCE_ENERGY && object.store.energy < intent.amount + cost) {
        return;
    }

    bulk.update(object, { send: intent });
};
