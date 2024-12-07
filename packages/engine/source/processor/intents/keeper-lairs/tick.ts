import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, {roomObjects, bulk, gameTime}) => {

    if(!object || object.type != 'keeperLair') return;



    if(!object.nextSpawnTime) {
        var keeper = _.find(roomObjects, (i) => i.type == 'creep' && i.user == '3' && i.name == 'Keeper'+object._id);
        if(!keeper || keeper.hits < 5000) {
            bulk.update(object, {nextSpawnTime: gameTime + ScreepsConstants.ENERGY_REGEN_TIME});
        }
    }

    if(object.nextSpawnTime && gameTime >= object.nextSpawnTime-1) {
        var keeper = _.find(roomObjects, (i) => i.type == 'creep' && i.user == '3' && i.name == 'Keeper'+object._id);
        if(keeper) {
            bulk.remove(keeper._id);
        }

        const body = [];

        for(var i=0;i<17;i++) {
            body.push({
                type: ScreepsConstants.TOUGH,
                hits: 100
            });
        }
        for(var i=0;i<13;i++) {
            body.push({
                type: ScreepsConstants.MOVE,
                hits: 100
            });
        }
        for(var i=0;i<10;i++) {
            body.push({
                type: ScreepsConstants.ATTACK,
                hits: 100
            });
            body.push({
                type: ScreepsConstants.RANGED_ATTACK,
                hits: 100
            });
        }

        bulk.insert({
            name: 'Keeper'+object._id,
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

        bulk.update(object, {nextSpawnTime: null});
    }




};
