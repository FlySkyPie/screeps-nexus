import _ from 'lodash';
import q from 'q';

import * as common from '@screeps/common/src';
import StorageInstance from '@screeps/common/src/storage';

import * as utils from '../utils';
import * as strongholds from '../strongholds';

const C = common.configManager.config.common.constants;
const db = StorageInstance.db;

export var spawn = utils.withHelp([
    `spawn(roomName, [opts]) - Create a new NPC Stronghold, and spawn it to the specified room. 'opts' is an object with the following optional properties:\r
    * templateName - the name of stronghold template to spawn, default is random\r
    * x - the X position of the spawn in the room, default is random\r
    * y - the Y position of the spawn in the room, default is random\r
    * user - id of user which stronghold structures should belong to, default is "2" (Invader)\r
    * deployTime - delay in ticks until the stronghold is deployed`,
    function spawn(roomName: any, opts = {}) {
        try {
            return strongholds.spawnStronghold(roomName, opts);
        }
        catch (e) {
            return q.reject(e);
        }
    }
]);

export var expand = utils.withHelp([
    `expand(roomName) - Force an NPC Stronghold to spawn a new lesser Invader Core in a nearby room.`,
    async function expand(roomName: any) {
        const invaderCore = await db['rooms.objects'].findOne({ type: 'invaderCore', level: { $gt: 0 }, room: roomName });
        if (!invaderCore) {
            throw 'There is no NPC Stronghold in this room';
        }
        const result = await strongholds.expandStronghold(invaderCore);
        if (!result) {
            throw 'Could not expand this NPC Stronghold';
        }
        return 'OK';
    }
]);

export var _help = utils.generateCliHelp('strongholds.', exports) +
    `\r\nStronghold templates:\r\n` +
    Object.keys(strongholds.templates).map(n => ` - ${n} [${strongholds.templates[n].description}]`).join(`\r\n`);
