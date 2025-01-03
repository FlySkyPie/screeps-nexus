import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { EventAttackType } from '@screeps/common/src/constants/event-attack-type';

import _die from '../creeps/_die';
import _damage from '../_damage';

export default (object: any, scope: any) => {

    const { roomObjects, bulk, roomController, gameTime, roomInfo } = scope;

    if (roomInfo.novice && roomInfo.novice > Date.now() || roomInfo.respawnArea && roomInfo.respawnArea > Date.now()) {
        bulk.remove(object._id);
        delete roomObjects[object._id];
        return;
    }

    if (gameTime == object.landTime - 1) {

        _.forEach(roomObjects, target => {
            if (!target) {
                return;
            }
            if (target.type == 'creep') {
                _die(target, 0, true, scope, EventAttackType.EVENT_ATTACK_TYPE_NUKE);
            }
            if (target.type == 'powerCreep') {
                bulk.update(target, { hits: 0 });
            }
            if (target.type == 'constructionSite' || target.type == 'energy' || target.type == 'tombstone' || target.type == 'ruin') {
                bulk.remove(target._id);
                delete roomObjects[target._id];
            }
            if (target.type == 'spawn' && target.spawning != null) {
                bulk.update(target, {
                    spawning: null
                });
            }
        });

        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                let x = object.x + dx,
                    y = object.y + dy,
                    range = Math.max(Math.abs(dx), Math.abs(dy)),
                    damage = range == 0 ? ScreepsConstants.NUKE_DAMAGE[0] : ScreepsConstants.NUKE_DAMAGE[2];

                let objects = _.filter(roomObjects, { x, y });
                let rampart: any = _.find(objects, { type: 'rampart' });
                if (rampart) {
                    let rampartHits = rampart.hits;
                    _.pull(objects, rampart);
                    _damage(object, rampart, damage, EventAttackType.EVENT_ATTACK_TYPE_NUKE, scope);
                    damage -= rampartHits;
                }
                if (damage > 0) {
                    objects.forEach(target => {
                        _damage(object, target, damage, EventAttackType.EVENT_ATTACK_TYPE_NUKE, scope);
                    });
                }
            }
        }

        if (roomController) {
            if (roomController.safeMode > gameTime) {
                bulk.update(roomController, {
                    safeMode: gameTime,
                    safeModeCooldown: null
                });
            }

            if (roomController.user &&
                !_.some(roomController.effects, (e: any) => e.effect == ScreepsConstants.EFFECT_INVULNERABILITY && e.endTime > gameTime) &&
                !roomController.upgradeBlocked || roomController.upgradeBlocked < gameTime) {
                bulk.update(roomController, {
                    upgradeBlocked: gameTime + ScreepsConstants.CONTROLLER_NUKE_BLOCKED_UPGRADE
                });
            }
        }
    }

    if (gameTime >= object.landTime) {
        bulk.remove(object._id);
        delete roomObjects[object._id];
    };


};
