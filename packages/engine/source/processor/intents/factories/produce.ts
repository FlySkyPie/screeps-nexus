import _ from 'lodash';

import { ListItems } from '@screeps/common/src/tables/list-items';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';

import * as utils from '../../../utils';

export default (object: any, intent: any, scope: any) => {
    const { gameTime, roomObjects, roomController, bulk } = scope;

    if (!object || !object.store || !ListItems.COMMODITIES[intent.resourceType] || !!ListItems.COMMODITIES[intent.resourceType].level && object.level != ListItems.COMMODITIES[intent.resourceType].level) {
        return;
    }

    if (!!object.cooldownTime && object.cooldownTime > gameTime) {
        return;
    }

    if (!utils.checkStructureAgainstController(object, roomObjects, roomController)) {
        return;
    }

    if (!!ListItems.COMMODITIES[intent.resourceType].level &&
        (object.level > 0) &&
        !_.some(object.effects, (e: any) =>
            e.power == PWRCode.PWR_OPERATE_FACTORY &&
            e.level == ListItems.COMMODITIES[intent.resourceType].level &&
            e.endTime >= gameTime)) {
        return;
    }

    if (_.some(_.keys(ListItems.COMMODITIES[intent.resourceType].components), p => (object.store[p] || 0) < ListItems.COMMODITIES[intent.resourceType].components[p])) {
        return;
    }

    const targetTotal = utils.calcResources(object);
    const componentsTotal = _.sum(ListItems.COMMODITIES[intent.resourceType].components);
    if (targetTotal - componentsTotal + (ListItems.COMMODITIES[intent.resourceType].amount || 1) > object.storeCapacity) {
        return;
    }

    for (let part in ListItems.COMMODITIES[intent.resourceType].components) {
        object.store[part] = object.store[part] - ListItems.COMMODITIES[intent.resourceType].components[part];
    }
    object.store[intent.resourceType] = (object.store[intent.resourceType] || 0) + (ListItems.COMMODITIES[intent.resourceType].amount || 1);
    bulk.update(object, { store: object.store });

    object.actionLog.produce = { x: object.x, y: object.y, resourceType: intent.resourceType };

    bulk.update(object, { cooldownTime: ListItems.COMMODITIES[intent.resourceType].cooldown + gameTime });
};
