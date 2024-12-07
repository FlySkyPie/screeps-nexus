import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, {bulk, gameTime}) => {

    if(!object.mineralAmount) {

        if(!object.nextRegenerationTime) {
            object.nextRegenerationTime = gameTime + C.MINERAL_REGEN_TIME;
            bulk.update(object, {nextRegenerationTime: object.nextRegenerationTime});
        }
        if(gameTime >= object.nextRegenerationTime-1) {
            const update = {
                nextRegenerationTime: null,
                mineralAmount: C.MINERAL_DENSITY[object.density]
            };
            if(object.density == C.DENSITY_LOW || object.density == C.DENSITY_ULTRA ||
                Math.random() < C.MINERAL_DENSITY_CHANGE) {
                const oldDensity = object.density;
                let newDensity;
                do {
                    const random = Math.random();
                    for (const density in C.MINERAL_DENSITY_PROBABILITY) {
                        if (random <= C.MINERAL_DENSITY_PROBABILITY[density]) {
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

    const effect = _.find(object.effects, {power: C.PWR_REGEN_MINERAL});
    if(effect && effect.endTime > gameTime && !object.nextRegenerationTime && object.mineralAmount) {
        const powerInfo = C.POWER_INFO[C.PWR_REGEN_MINERAL];
        if(((effect.endTime - gameTime - 1) % powerInfo.period) === 0) {
            bulk.update(object, {
                mineralAmount: object.mineralAmount + powerInfo.effect[effect.level - 1]
            });
        }
    }

};
