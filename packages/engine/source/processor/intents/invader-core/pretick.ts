import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();

import stronghold from './stronghold/stronghold';

export default (object, scope) => {
    const {gameTime, roomObjects, roomController, bulk} = scope;
    const user = object.user;
    const intents = {
        list: {},
        set(id, name, data) {
            this.list[id] = this.list[id] || {};
            this.list[id][name] = data;
        }
    };

    const behavior = object.deployTime ? 'deploy' : object.strongholdBehavior || 'default';
    if(!stronghold.behaviors[behavior]) {
        return;
    }

    const creeps = [], defenders = [], hostiles = [], towers = [], ramparts = [];
    _.forEach(roomObjects, o => {
        if(o.type == 'creep' && !o.spawning) {
            creeps.push(o);
            if(o.user == user) {
                defenders.push(o);
            } else if(o.user != '3') {
                hostiles.push(o);
            }
            return;
        }
        if(o.type == ScreepsConstants.STRUCTURE_TOWER && o.user == user) {
            towers.push(o);
            return;
        }
        if(o.type == ScreepsConstants.STRUCTURE_RAMPART && o.user == user) {
            ramparts.push(o);
        }
    });

    const context = {scope, intents, roomObjects, gameTime, bulk, creeps, defenders, hostiles, towers, ramparts, roomController, core: object};

    stronghold.behaviors[behavior](context);

    return intents.list;
};
