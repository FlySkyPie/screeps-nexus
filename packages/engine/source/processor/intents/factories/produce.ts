import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, scope) => {
    const {gameTime, roomObjects, roomController, bulk} = scope;

    if(!object ||!object.store || !ScreepsConstants.COMMODITIES[intent.resourceType] || !!ScreepsConstants.COMMODITIES[intent.resourceType].level && object.level != ScreepsConstants.COMMODITIES[intent.resourceType].level) {
        return;
    }

    if(!!object.cooldownTime && object.cooldownTime > gameTime) {
        return;
    }

    if(!utils.checkStructureAgainstController(object, roomObjects, roomController)) {
        return;
    }

    if(!!ScreepsConstants.COMMODITIES[intent.resourceType].level && (object.level > 0) && !_.some(object.effects, e => e.power == ScreepsConstants.PWR_OPERATE_FACTORY && e.level == ScreepsConstants.COMMODITIES[intent.resourceType].level && e.endTime >= gameTime)) {
        return;
    }

    if(_.some(_.keys(ScreepsConstants.COMMODITIES[intent.resourceType].components), p => (object.store[p]||0)<ScreepsConstants.COMMODITIES[intent.resourceType].components[p])) {
        return;
    }

    const targetTotal = utils.calcResources(object);
    const componentsTotal = _.sum(ScreepsConstants.COMMODITIES[intent.resourceType].components);
    if (targetTotal - componentsTotal + (ScreepsConstants.COMMODITIES[intent.resourceType].amount||1) > object.storeCapacity) {
        return;
    }

    for(let part in ScreepsConstants.COMMODITIES[intent.resourceType].components) {
        object.store[part] = object.store[part] - ScreepsConstants.COMMODITIES[intent.resourceType].components[part];
    }
    object.store[intent.resourceType] = (object.store[intent.resourceType]||0) + (ScreepsConstants.COMMODITIES[intent.resourceType].amount || 1);
    bulk.update(object, {store: object.store});

    object.actionLog.produce = {x: object.x, y: object.y, resourceType: intent.resourceType};

    bulk.update(object, {cooldownTime: ScreepsConstants.COMMODITIES[intent.resourceType].cooldown + gameTime});
};
