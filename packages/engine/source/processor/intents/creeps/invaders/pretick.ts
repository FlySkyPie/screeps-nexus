import _ from 'lodash';

import { BodyParts } from '@screeps/common/src/constants/body-parts';
import { StructureEnum } from '@screeps/common/src/constants/structure-enum';

import * as fakeRuntime from '../../../common/fake-runtime';

export default (creep: any, scope: any) => {
    const { roomObjects } = scope;

    const intents: any = {
        list: {},
        set(id: any, name: any, data: any) {
            this.list[id] = this.list[id] || {};
            this.list[id][name] = data;
        }
    };

    const creeps: any[] = [],
        invaders: any[] = [],
        healers: any[] = [],
        hostiles: any[] = [],
        defenders: any[] = [],
        fortifications: any[] = [];
    _.forEach(roomObjects, object => {
        if (!object.spawning && object.type == 'creep' || object.type == 'powerCreep') {
            creeps.push(object);
            if (creep.user == object.user) {
                invaders.push(object);
                if (fakeRuntime.hasActiveBodyparts(object, BodyParts.HEAL)) {
                    healers.push(object);
                }
            } else {
                if (object.user != 3) {
                    hostiles.push(object);
                    if (_.some(object.body, (i: any) =>
                        (i.hits > 0) &&
                        (i.type == BodyParts.ATTACK) ||
                        (i.type == BodyParts.RANGED_ATTACK))) {
                        defenders.push(object);
                    }
                }
            }
        }
        if (object.type == StructureEnum.STRUCTURE_RAMPART ||
            object.type == StructureEnum.STRUCTURE_WALL) {
            fortifications.push(object);
        }
    });

    const context = { scope, intents, roomObjects, creeps, invaders, healers, hostiles, defenders, fortifications };

    if (_.some(creep.body, { type: BodyParts.HEAL })) {
        require('./healer')(creep, context);
    } else {
        require('./findAttack')(creep, context);
    }

    require('./shootAtWill')(creep, context);

    return intents.list;
};
