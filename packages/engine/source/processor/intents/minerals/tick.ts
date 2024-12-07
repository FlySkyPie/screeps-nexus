import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, {bulk, gameTime}) => {

    if(!object.mineralAmount) {

        if(!object.nextRegenerationTime) {
            object.nextRegenerationTime = gameTime + ScreepsConstants.MINERAL_REGEN_TIME;
            bulk.update(object, {nextRegenerationTime: object.nextRegenerationTime});
        }
        if(gameTime >= object.nextRegenerationTime-1) {
            const update = {
                nextRegenerationTime: null,
                mineralAmount: ScreepsConstants.MINERAL_DENSITY[object.density]
            };
            if(object.density == ScreepsConstants.DENSITY_LOW || object.density == ScreepsConstants.DENSITY_ULTRA ||
                Math.random() < ScreepsConstants.MINERAL_DENSITY_CHANGE) {
                const oldDensity = object.density;
                let newDensity;
                do {
                    const random = Math.random();
                    for (const density in ScreepsConstants.MINERAL_DENSITY_PROBABILITY) {
                        if (random <= ScreepsConstants.MINERAL_DENSITY_PROBABILITY[density]) {
                            newDensity = +density;
                            break;
                        }
                    }
                }
                while(newDensity == oldDensity);

                update.density = object.density = newDensity;
            }
            bulk.update(object, update);
        }
    }

    const effect = _.find(object.effects, {power: ScreepsConstants.PWR_REGEN_MINERAL});
    if(effect && effect.endTime > gameTime && !object.nextRegenerationTime && object.mineralAmount) {
        const powerInfo = ScreepsConstants.POWER_INFO[ScreepsConstants.PWR_REGEN_MINERAL];
        if(((effect.endTime - gameTime - 1) % powerInfo.period) === 0) {
            bulk.update(object, {
                mineralAmount: object.mineralAmount + powerInfo.effect[effect.level - 1]
            });
        }
    }

};
