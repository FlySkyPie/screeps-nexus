import _ from 'lodash';

import { ConfigManager } from '@screeps/common/src/config-manager';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { BodyParts } from '@screeps/common/src/constants/body-parts';
import { POWER_INFO } from '@screeps/common/src/tables/power-info';
import { StructureEnum } from '@screeps/common/src/constants/structure-enum';
import { Resource } from '@screeps/common/src/constants/resource';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';

import * as utils from '../../../../utils';

import * as fakeRuntime from '../../../common/fake-runtime';

import * as defence from './defence';
import creeps from './creeps';
import fortifier from './fortifier';
import simpleMelee from './simple-melee';

const range = (a: any, b: any) => {
    if (
        _.isUndefined(a) || _.isUndefined(a.x) || _.isUndefined(a.y) || _.isUndefined(a.room) ||
        _.isUndefined(b) || _.isUndefined(b.x) || _.isUndefined(b.y) || _.isUndefined(b.room) ||
        a.room != b.room) {
        return Infinity;
    }

    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
};

const deployStronghold = function deployStronghold(context: any) {
    const { scope, core, ramparts, bulk, gameTime } = context;
    const { roomObjects } = scope;

    if (core.deployTime && (core.deployTime <= (1 + gameTime))) {
        const duration = Math.round(ScreepsConstants.STRONGHOLD_DECAY_TICKS * (0.9 + Math.random() * 0.2));
        const decayTime = gameTime + duration;

        core.effects.push({
            effect: ScreepsConstants.EFFECT_COLLAPSE_TIMER,
            power: ScreepsConstants.EFFECT_COLLAPSE_TIMER,
            endTime: gameTime + duration,
            duration
        });
        bulk.update(core, {
            deployTime: null,
            decayTime,
            hits: ScreepsConstants.INVADER_CORE_HITS,
            hitsMax: ScreepsConstants.INVADER_CORE_HITS,
            effects: core.effects
        });

        _.forEach(ramparts, rampart => { bulk.remove(rampart._id); delete roomObjects[rampart._id] });

        const template = ConfigManager.config.common.strongholds.templates[core.templateName];
        const containerAmounts = [0, 500, 4000, 10000, 50000, 360000];

        const objectOptions: Record<string, any> = {};
        objectOptions[StructureEnum.STRUCTURE_RAMPART] = {
            hits: ScreepsConstants.STRONGHOLD_RAMPART_HITS[template.rewardLevel],
            hitsMax: ScreepsConstants.RAMPART_HITS_MAX[8],
            nextDecayTime: decayTime
        };
        objectOptions[StructureEnum.STRUCTURE_TOWER] = {
            hits: ScreepsConstants.TOWER_HITS,
            hitsMax: ScreepsConstants.TOWER_HITS,
            store: { energy: ScreepsConstants.TOWER_CAPACITY },
            storeCapacityResource: { energy: ScreepsConstants.TOWER_CAPACITY },
            actionLog: { attack: null, heal: null, repair: null }
        };
        objectOptions[StructureEnum.STRUCTURE_CONTAINER] = {
            notifyWhenAttacked: false,
            hits: ScreepsConstants.CONTAINER_HITS,
            hitsMax: ScreepsConstants.CONTAINER_HITS,
            nextDecayTime: decayTime,
            store: {},
            storeCapacity: 0
        };
        objectOptions[StructureEnum.STRUCTURE_ROAD] = {
            notifyWhenAttacked: false,
            hits: ScreepsConstants.ROAD_HITS,
            hitsMax: ScreepsConstants.ROAD_HITS,
            nextDecayTime: decayTime
        };

        _.forEach(template.structures, i => {
            const x = 0 + core.x + i.dx, y = 0 + core.y + i.dy;
            const objectsToRemove = _.filter(roomObjects, (o: any) =>
                !o.strongholdId && o.x == x && o.y == y);
            if (_.some(objectsToRemove)) {
                _.forEach(objectsToRemove, o => bulk.remove(o._id));
            }

            if (i.type == StructureEnum.STRUCTURE_INVADER_CORE) {
                return;
            }

            const s = Object.assign({}, i, {
                x,
                y,
                room: core.room,
                user: core.user,
                strongholdId: core.strongholdId,
                decayTime,
                effects: [{
                    effect: ScreepsConstants.EFFECT_COLLAPSE_TIMER,
                    power: ScreepsConstants.EFFECT_COLLAPSE_TIMER,
                    endTime: gameTime + duration,
                    duration
                }]
            }, objectOptions[i.type] || {});
            delete s.dx;
            delete s.dy;

            if (i.type == StructureEnum.STRUCTURE_CONTAINER) {
                s.store = utils.calcReward(
                    ConfigManager.config.common.strongholds.containerRewards,
                    containerAmounts[template.rewardLevel], 3);
            }

            bulk.insert(s);
        });
    }
};

const handleController = function reserveController(context: any) {
    const { gameTime, core, intents, roomController } = context;

    if (roomController) {
        if (roomController.user === core.user) {
            if (roomController.downgradeTime - gameTime < ScreepsConstants.INVADER_CORE_CONTROLLER_DOWNGRADE - 25) {
                intents.set(core._id, 'upgradeController', { id: roomController._id });
            }
        } else if (!roomController.reservation || roomController.reservation.user === core.user) {
            intents.set(core._id, 'reserveController', { id: roomController._id });
        } else {
            intents.set(core._id, 'attackController', { id: roomController._id });
        }
    }
};

const refillTowers = function refillTowers(context: any) {
    const { core, intents, towers, ramparts } = context;
    const underchargedTowers = _.filter(towers, (t: any) =>
        (2 * t.store.energy <= t.storeCapacityResource.energy) &&
        _.some(ramparts, { x: t.x, y: t.y }));
    if (_.some(underchargedTowers)) {
        const towerToCharge: any = _.min(underchargedTowers, 'store.energy');
        if (towerToCharge) {
            intents.set(
                core._id,
                'transfer',
                {
                    id: towerToCharge._id,
                    amount: towerToCharge.storeCapacityResource.energy - towerToCharge.store.energy,
                    resourceType: Resource.RESOURCE_ENERGY
                });
            return true;
        }
    }

    return false;
};

const refillCreeps = function refillCreeps(context: any) {
    const { core, intents, defenders } = context;

    const underchargedCreeps = _.filter(defenders, (c: any) =>
        (c.storeCapacity > 0) && (2 * c.store.energy <= c.storeCapacity));
    if (_.some(underchargedCreeps)) {
        const creep: any = _.min(underchargedCreeps, 'store.energy');
        if (creep) {
            intents.set(core._id, 'transfer', { id: creep._id, amount: creep.storeCapacity - creep.store.energy, resourceType: Resource.RESOURCE_ENERGY });
            return true;
        }
    }

    return false;
};

const focusClosest = function focusClosest(context: any) {
    const { core, intents, defenders, hostiles, towers } = context;

    if (!_.some(hostiles)) {
        return false;
    }

    const target: any = _.min(hostiles, c => utils.dist(c, core));
    if (!target) {
        return false;
    }
    for (let t of towers) {
        intents.set(t._id, 'attack', { id: target._id });
    }

    const meleesNear: any = _.filter(defenders, (d: any) =>
        (range(d, target) == 1)
        && _.some(d.body, { type: BodyParts.ATTACK }));
    for (let melee of meleesNear) {
        intents.set(melee._id, 'attack', { id: target._id, x: target.x, y: target.y });
    }

    const rangersInRange = _.filter(defenders, (d: any) =>
        (range(d, target) <= 3) &&
        _.some(d.body, { type: BodyParts.RANGED_ATTACK }));
    for (let r of rangersInRange) {
        if (range(r, target) == 1) {
            intents.set(r._id, 'rangedMassAttack', {});
        } else {
            intents.set(r._id, 'rangedAttack', { id: target._id });
        }
    }

    return true;
};

const focusMax = function focusMax(context: any) {
    const { intents, defenders, hostiles, towers, gameTime } = context;

    if (!_.some(hostiles)) {
        return false;
    }

    const activeTowers = _.filter(towers, (t: any) => t.store.energy >= ScreepsConstants.TOWER_ENERGY_COST);
    const target: any = _.max(hostiles, creep => {
        let damage = _.sum(activeTowers, (tower: any) => {
            let r = utils.dist(creep, tower);
            let amount = ScreepsConstants.TOWER_POWER_ATTACK;
            if (r > ScreepsConstants.TOWER_OPTIMAL_RANGE) {
                if (r > ScreepsConstants.TOWER_FALLOFF_RANGE) {
                    r = ScreepsConstants.TOWER_FALLOFF_RANGE;
                }
                amount -= amount * ScreepsConstants.TOWER_FALLOFF * (r - ScreepsConstants.TOWER_OPTIMAL_RANGE) / (ScreepsConstants.TOWER_FALLOFF_RANGE - ScreepsConstants.TOWER_OPTIMAL_RANGE);
            }
            [PWRCode.PWR_OPERATE_TOWER, PWRCode.PWR_DISRUPT_TOWER].forEach(power => {
                const effect: any = _.find(tower.effects, { power });
                if (effect && effect.endTime > gameTime) {
                    amount *= POWER_INFO[power].effect[effect.level - 1];
                }
            });
            return Math.floor(amount);
        });
        damage += _.sum(defenders, (defender: any) => {
            let d = 0;
            if ((range(defender, creep) <= 3) &&
                _.some(defender.body, { type: BodyParts.RANGED_ATTACK })) {
                d += utils.calcBodyEffectiveness(
                    defender.body,
                    BodyParts.RANGED_ATTACK,
                    'rangedAttack',
                    ScreepsConstants.RANGED_ATTACK_POWER);
            }
            if ((range(defender, creep) <= 1) &&
                _.some(defender.body, { type: BodyParts.ATTACK })) {
                d += utils.calcBodyEffectiveness(
                    defender.body,
                    BodyParts.ATTACK,
                    'attack',
                    ScreepsConstants.ATTACK_POWER);
            }
            return d;
        });

        return damage;
    });

    const meleesNear: any = _.filter(defenders, (d: any) => (range(d, target) == 1) && _.some(d.body, { type: BodyParts.ATTACK }));
    for (let melee of meleesNear) {
        intents.set(melee._id, 'attack', { id: target._id, x: target.x, y: target.y });
    }

    const rangersInRange = _.filter(defenders, (d: any) => (range(d, target) <= 3) && _.some(d.body, { type: BodyParts.RANGED_ATTACK }));
    for (let r of rangersInRange) {
        if (range(r, target) == 1) {
            intents.set(r._id, 'rangedMassAttack', {});
        } else {
            intents.set(r._id, 'rangedAttack', { id: target._id });
        }
    }

    for (let t of activeTowers) {
        intents.set(t._id, 'attack', { id: target._id });
    }

    return true;
};

const maintainCreep = function maintainCreep(name: any, setup: any, context: any, behavior: any) {
    const { core, intents, defenders } = context;
    const creep = _.find(defenders, { name });
    if (creep && behavior) {
        behavior(creep, context);
        return;
    }

    if (!core.spawning && !core._spawning) {
        intents.set(core._id, 'createCreep', {
            name,
            body: setup.body,
            boosts: setup.boosts
        });
        core._spawning = true;
    }
};

const antinuke = function antinuke(context: any) {
    const { core, ramparts, roomObjects, bulk, gameTime } = context;
    if (!!(gameTime % 10)) {
        return;
    }
    const nukes = _.filter(roomObjects, { type: 'nuke' });

    const baseLevel = ScreepsConstants.STRONGHOLD_RAMPART_HITS[core.level];
    for (let rampart of ramparts) {
        let hitsTarget = baseLevel;
        _.forEach(nukes, n => {
            const range = utils.dist(rampart, n);
            if (range == 0) {
                hitsTarget += ScreepsConstants.NUKE_DAMAGE[0];
                return;
            }
            if (range <= 2) {
                hitsTarget += ScreepsConstants.NUKE_DAMAGE[2];
            }
        });
        if (rampart.hitsTarget != hitsTarget) {
            bulk.update(rampart, { hitsTarget });
        }
    }
};

type IBehaviors = {
    [key: string]: (context: any) => void;
}

export default {
    behaviors: {
        'deploy': function (context: any) {
            handleController(context);
            deployStronghold(context);
        },
        'default': function (context: any) {
            handleController(context);
            refillTowers(context);
            focusClosest(context);
        },
        'bunker1': function (context: any) {
            handleController(context);
            refillTowers(context) || refillCreeps(context);
            focusClosest(context);
        },
        'bunker2': function (context: any) {
            handleController(context);
            refillTowers(context) || refillCreeps(context);

            maintainCreep('defender1', creeps['weakDefender'], context, simpleMelee);

            focusClosest(context);
        },
        'bunker3': function (context: any) {
            handleController(context);
            refillTowers(context);

            maintainCreep('defender1', creeps['fullDefender'], context, simpleMelee);
            maintainCreep('defender2', creeps['fullDefender'], context, simpleMelee);

            focusClosest(context);
        },
        'bunker4': function (context: any) {
            handleController(context);
            refillTowers(context);

            maintainCreep('defender1', creeps['boostedDefender'], context, simpleMelee);
            maintainCreep('defender2', creeps['boostedDefender'], context, simpleMelee);
            maintainCreep('defender3', creeps['boostedDefender'], context, simpleMelee);
            maintainCreep('defender4', creeps['boostedDefender'], context, simpleMelee);

            focusMax(context);
        },
        'bunker5': function (context: any) {
            handleController(context);
            refillTowers(context) || refillCreeps(context);

            antinuke(context);

            let rangerSpots: any[] = [],
                meleeSpots: any[] = [];
            _.forEach(context.hostiles, h => {
                meleeSpots.push(..._.filter(context.ramparts, r => utils.dist(h, r) <= 1));
                rangerSpots.push(..._.filter(context.ramparts, r => utils.dist(h, r) <= 3));
            });
            meleeSpots = _.unique(meleeSpots);
            rangerSpots = _.unique(_.without(rangerSpots, ...meleeSpots));
            const rangers: any[] = [],
                melees: any[] = [];
            _.forEach(context.defenders, d => {
                if (_.some(d.body, { type: BodyParts.ATTACK })) { melees.push(d._id.toString()); }
                if (_.some(d.body, { type: BodyParts.RANGED_ATTACK })) { rangers.push(d._id.toString()); }
            });

            let spots: Record<any, any> = {};
            if (_.some(meleeSpots) && _.some(melees)) {
                spots = defence.distribute(meleeSpots, melees);
            }
            if (_.some(rangerSpots) && _.some(rangers)) {
                Object.assign(spots, defence.distribute(rangerSpots, rangers));
            }

            const coordinatedDefender = (_creep: any, context: any) => {
                for (let spot in spots) {
                    const creep = context.roomObjects[spots[spot]];
                    if (!creep) {
                        continue;
                    }
                    if (50 * creep.x + creep.y == spot) {
                        continue;
                    }
                    const safeMatrixCallback = defence.createSafeMatrixCallback(context);
                    fakeRuntime.walkTo(
                        creep,
                        {
                            x: Math.floor((spot as any) / 50),
                            y: (spot as any) % 50,
                            room: creep.room
                        },
                        {
                            range: 0,
                            costCallback: safeMatrixCallback
                        },
                        context);
                }
            };

            maintainCreep('fortifier', creeps['fortifier'], context, fortifier);
            maintainCreep('defender1', creeps['fullBoostedMelee'], context, coordinatedDefender);
            maintainCreep('defender2', creeps['fullBoostedMelee'], context, coordinatedDefender);
            maintainCreep('defender3', creeps['fullBoostedRanger'], context, coordinatedDefender);
            maintainCreep('defender4', creeps['fullBoostedRanger'], context, coordinatedDefender);
            maintainCreep('defender5', creeps['fullBoostedRanger'], context, coordinatedDefender);
            maintainCreep('defender6', creeps['fullBoostedRanger'], context, coordinatedDefender);
            maintainCreep('defender7', creeps['fullBoostedRanger'], context, coordinatedDefender);
            maintainCreep('defender8', creeps['fullBoostedRanger'], context, coordinatedDefender);

            focusMax(context);
        },
    } as IBehaviors,
};
