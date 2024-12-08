import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';
import { POWER_INFO } from '@screeps/common/src/tables/power-info';
import _ from 'lodash';

export default (object: any, { bulk, gameTime }: any) => {

    if (!object.mineralAmount) {

        if (!object.nextRegenerationTime) {
            object.nextRegenerationTime = gameTime + ScreepsConstants.MINERAL_REGEN_TIME;
            bulk.update(object, { nextRegenerationTime: object.nextRegenerationTime });
        }
        if (gameTime >= object.nextRegenerationTime - 1) {
            const update: Record<string, any> = {
                nextRegenerationTime: null,
                mineralAmount: ScreepsConstants.MINERAL_DENSITY[object.density]
            };
            if (object.density == ScreepsConstants.DENSITY_LOW || object.density == ScreepsConstants.DENSITY_ULTRA ||
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
                while (newDensity == oldDensity);

                update.density = object.density = newDensity;
            }
            bulk.update(object, update);
        }
    }

    const effect: any = _.find(object.effects, { power: PWRCode.PWR_REGEN_MINERAL });
    if (effect && effect.endTime > gameTime && !object.nextRegenerationTime && object.mineralAmount) {
        const powerInfo = POWER_INFO[PWRCode.PWR_REGEN_MINERAL];
        if (((effect.endTime - gameTime - 1) % powerInfo.period) === 0) {
            bulk.update(object, {
                mineralAmount: object.mineralAmount + powerInfo.effect[effect.level - 1]
            });
        }
    }
};
