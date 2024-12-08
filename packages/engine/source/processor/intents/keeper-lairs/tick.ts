import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { BodyParts } from '@screeps/common/src/constants/body-parts';

export default (object: any, { roomObjects, bulk, gameTime }: any) => {

    if (!object || object.type != 'keeperLair') return;



    if (!object.nextSpawnTime) {
        var keeper: any = _.find(roomObjects, (i) => i.type == 'creep' && i.user == '3' && i.name == 'Keeper' + object._id);
        if (!keeper || keeper.hits < 5000) {
            bulk.update(object, { nextSpawnTime: gameTime + ScreepsConstants.ENERGY_REGEN_TIME });
        }
    }

    if (object.nextSpawnTime && gameTime >= object.nextSpawnTime - 1) {
        var keeper: any = _.find(roomObjects, (i) => i.type == 'creep' && i.user == '3' && i.name == 'Keeper' + object._id);
        if (keeper) {
            bulk.remove(keeper._id);
        }

        const body = [];

        for (var i = 0; i < 17; i++) {
            body.push({
                type: BodyParts.TOUGH,
                hits: 100
            });
        }
        for (var i = 0; i < 13; i++) {
            body.push({
                type: BodyParts.MOVE,
                hits: 100
            });
        }
        for (var i = 0; i < 10; i++) {
            body.push({
                type: BodyParts.ATTACK,
                hits: 100
            });
            body.push({
                type: BodyParts.RANGED_ATTACK,
                hits: 100
            });
        }

        bulk.insert({
            name: 'Keeper' + object._id,
            x: object.x,
            y: object.y,
            body,
            store: { energy: 0 },
            storeCapacity: 0,
            type: 'creep',
            room: object.room,
            user: '3',
            hits: 5000,
            hitsMax: 5000,
            spawning: false,
            fatigue: 0
        });

        bulk.update(object, { nextSpawnTime: null });
    }
};
