import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, {bulk, roomController, gameTime}) => {

    if(!object || object.type != 'source') return;

    if(object.energy < object.energyCapacity) {

        if(!object.nextRegenerationTime) {
            object.nextRegenerationTime = gameTime + ScreepsConstants.ENERGY_REGEN_TIME;
            bulk.update(object, {nextRegenerationTime: object.nextRegenerationTime});
        }

        let effect = _.find(object.effects, {power: ScreepsConstants.PWR_DISRUPT_SOURCE});
        if(effect && effect.endTime > gameTime) {
            bulk.update(object, {
                nextRegenerationTime: object.nextRegenerationTime+1
            });
        }

        if(gameTime >= object.nextRegenerationTime-1) {
            bulk.update(object, {
                nextRegenerationTime: null,
                energy: object.energyCapacity
            });
        }

        effect = _.find(object.effects, {power: ScreepsConstants.PWR_REGEN_SOURCE});
        if(effect && effect.endTime > gameTime) {
            const powerInfo = ScreepsConstants.POWER_INFO[ScreepsConstants.PWR_REGEN_SOURCE];
            if(((effect.endTime - gameTime - 1) % powerInfo.period) === 0) {
                bulk.update(object, {
                    energy: Math.min(object.energyCapacity, object.energy + powerInfo.effect[effect.level - 1])
                });
            }
        }


    }



    if(roomController) {
        if (!roomController.user && !roomController.reservation && object.energyCapacity != ScreepsConstants.SOURCE_ENERGY_NEUTRAL_CAPACITY) {
            bulk.update(object, {
                energyCapacity: ScreepsConstants.SOURCE_ENERGY_NEUTRAL_CAPACITY,
                energy: Math.min(object.energy, ScreepsConstants.SOURCE_ENERGY_NEUTRAL_CAPACITY)
            });
        }
        if ((roomController.user || roomController.reservation) && object.energyCapacity != ScreepsConstants.SOURCE_ENERGY_CAPACITY) {
            bulk.update(object, {energyCapacity: ScreepsConstants.SOURCE_ENERGY_CAPACITY});
        }
    }
    else if(object.energyCapacity != ScreepsConstants.SOURCE_ENERGY_KEEPER_CAPACITY) {
        bulk.update(object, {energyCapacity: ScreepsConstants.SOURCE_ENERGY_KEEPER_CAPACITY});
    }
};