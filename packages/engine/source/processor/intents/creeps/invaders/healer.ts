import _ from 'lodash';

import { BodyParts } from '@screeps/common/src/constants/body-parts';
import { Direction } from '@screeps/common/src/constants/direction';

import * as utils from '../../../../utils';

import * as fakeRuntime from '../../../common/fake-runtime';

import flee from './flee';

export default (creep: any, context: any) => {
    const { scope, intents, invaders } = context;

    let healTargets = _.filter(invaders, c => utils.dist(c, creep) <= 3);
    if (_.some(healTargets)) {
        const healTarget: any = _.first(healTargets.sort((a: any, b: any) =>
            (b.hitsMax - b.hits) - (a.hitsMax - a.hits)));
        if (utils.dist(creep, healTarget) <= 1) {
            intents.set(creep._id, 'heal', {
                id: healTarget._id,
                x: healTarget.x,
                y: healTarget.y
            });
        } else {
            intents.set(creep._id, 'rangedHeal', { id: healTarget._id });
        }
    }

    if (creep.hits < creep.hitsMax / 2) {
        if (!flee(creep, 4, context)) {
            const fleeTarget = fakeRuntime.findClosestByPath(
                creep,
                _.filter(invaders, (c: any) =>
                    (c != creep) &&
                    fakeRuntime.hasActiveBodyparts(c, BodyParts.HEAL)),
                null,
                scope);

            if (fleeTarget) {
                const direction = fakeRuntime.moveTo(creep, fleeTarget, { range: 1 }, scope);
                if (direction) {
                    intents.set(creep._id, 'move', { direction });
                }
            }
        }

        return;
    }

    let target: any = fakeRuntime.findClosestByPath(creep, _.filter(invaders, (c: any) => c.hits < c.hitsMax), null, scope);
    if (!target) {
        if (flee(creep, 4, context)) {
            return;
        }
        target = fakeRuntime.findClosestByPath(creep, _.filter(invaders, (c: any) =>
            (c != creep) &&
            !fakeRuntime.hasActiveBodyparts(c, BodyParts.HEAL)), null, scope);
    }

    if (!target) {
        intents.set(creep._id, 'suicide', {});
        return;
    }
    let direction: Direction | 0 | undefined = 0;
    if (utils.dist(creep, target) <= 1) {
        direction = utils.getDirection(target.x - creep.x, target.y - creep.y);
    } else {
        direction = fakeRuntime.moveTo(creep, target, { range: 1 }, scope);
    }
    if (direction) {
        intents.set(creep._id, 'move', { direction });
    }
};
