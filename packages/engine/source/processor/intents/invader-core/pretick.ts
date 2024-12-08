import _ from 'lodash';

import { StructureEnum } from '@screeps/common/src/constants/structure-enum';

import stronghold from './stronghold/stronghold';

export default (object: any, scope: any) => {
    const { gameTime, roomObjects, roomController, bulk } = scope;
    const user = object.user;
    const intents: any = {
        list: {},
        set(id: any, name: any, data: any) {
            this.list[id] = this.list[id] || {};
            this.list[id][name] = data;
        }
    };

    const behavior = object.deployTime ? 'deploy' : object.strongholdBehavior || 'default';
    if (!stronghold.behaviors[behavior]) {
        return;
    }

    const creeps: any[] = [],
        defenders: any[] = [],
        hostiles: any[] = [],
        towers: any[] = [],
        ramparts: any[] = [];
    _.forEach(roomObjects, o => {
        if (o.type == 'creep' && !o.spawning) {
            creeps.push(o);
            if (o.user == user) {
                defenders.push(o);
            } else if (o.user != '3') {
                hostiles.push(o);
            }
            return;
        }
        if (o.type == StructureEnum.STRUCTURE_TOWER && o.user == user) {
            towers.push(o);
            return;
        }
        if (o.type == StructureEnum.STRUCTURE_RAMPART && o.user == user) {
            ramparts.push(o);
        }
    });

    const context = { scope, intents, roomObjects, gameTime, bulk, creeps, defenders, hostiles, towers, ramparts, roomController, core: object };

    stronghold.behaviors[behavior](context);

    return intents.list;
};
