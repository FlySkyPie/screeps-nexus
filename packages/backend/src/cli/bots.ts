import q from 'q';
import _ from 'lodash';

import * as  common from '@screeps/common/src';
import StorageInstance from '@screeps/common/src/storage';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { ConfigManager } from '@screeps/common/src/config-manager';
import { StorageEnvKey } from '@screeps/common/src/constants/storage-env-key';

import * as  utils from '../utils';

const bots = ConfigManager.config.common.bots;
const db = StorageInstance.db;

const boyNames = ['Jackson', 'Aiden', 'Liam', 'Lucas', 'Noah', 'Mason', 'Jayden', 'Ethan', 'Jacob', 'Jack', 'Caden', 'Logan', 'Benjamin', 'Michael', 'Caleb', 'Ryan', 'Alexander', 'Elijah', 'James', 'William', 'Oliver', 'Connor', 'Matthew', 'Daniel', 'Luke', 'Brayden', 'Jayce', 'Henry', 'Carter', 'Dylan', 'Gabriel', 'Joshua', 'Nicholas', 'Isaac', 'Owen', 'Nathan', 'Grayson', 'Eli', 'Landon', 'Andrew', 'Max', 'Samuel', 'Gavin', 'Wyatt', 'Christian', 'Hunter', 'Cameron', 'Evan', 'Charlie', 'David', 'Sebastian', 'Joseph', 'Dominic', 'Anthony', 'Colton', 'John', 'Tyler', 'Zachary', 'Thomas', 'Julian', 'Levi', 'Adam', 'Isaiah', 'Alex', 'Aaron', 'Parker', 'Cooper', 'Miles', 'Chase', 'Muhammad', 'Christopher', 'Blake', 'Austin', 'Jordan', 'Leo', 'Jonathan', 'Adrian', 'Colin', 'Hudson', 'Ian', 'Xavier', 'Camden', 'Tristan', 'Carson', 'Jason', 'Nolan', 'Riley', 'Lincoln', 'Brody', 'Bentley', 'Nathaniel', 'Josiah', 'Declan', 'Jake', 'Asher', 'Jeremiah', 'Cole', 'Mateo', 'Micah', 'Elliot'], girlNames = ['Sophia', 'Emma', 'Olivia', 'Isabella', 'Mia', 'Ava', 'Lily', 'Zoe', 'Emily', 'Chloe', 'Layla', 'Madison', 'Madelyn', 'Abigail', 'Aubrey', 'Charlotte', 'Amelia', 'Ella', 'Kaylee', 'Avery', 'Aaliyah', 'Hailey', 'Hannah', 'Addison', 'Riley', 'Harper', 'Aria', 'Arianna', 'Mackenzie', 'Lila', 'Evelyn', 'Adalyn', 'Grace', 'Brooklyn', 'Ellie', 'Anna', 'Kaitlyn', 'Isabelle', 'Sophie', 'Scarlett', 'Natalie', 'Leah', 'Sarah', 'Nora', 'Mila', 'Elizabeth', 'Lillian', 'Kylie', 'Audrey', 'Lucy', 'Maya', 'Annabelle', 'Makayla', 'Gabriella', 'Elena', 'Victoria', 'Claire', 'Savannah', 'Peyton', 'Maria', 'Alaina', 'Kennedy', 'Stella', 'Liliana', 'Allison', 'Samantha', 'Keira', 'Alyssa', 'Reagan', 'Molly', 'Alexandra', 'Violet', 'Charlie', 'Julia', 'Sadie', 'Ruby', 'Eva', 'Alice', 'Eliana', 'Taylor', 'Callie', 'Penelope', 'Camilla', 'Bailey', 'Kaelyn', 'Alexis', 'Kayla', 'Katherine', 'Sydney', 'Lauren', 'Jasmine', 'London', 'Bella', 'Adeline', 'Caroline', 'Vivian', 'Juliana', 'Gianna', 'Skyler', 'Jordyn'];

function genRandomUserName(c?: any) {
    c = c || 0;

    let name;


    const list = Math.random() > 0.5 ? boyNames : girlNames;
    name = list[Math.floor(Math.random() * list.length)];

    if (c > 3) {
        name += list[Math.floor(Math.random() * list.length)];
    }

    return db.users.findOne({ username: name + 'Bot' })
        .then((result: any) => {
            if (result) {
                return genRandomUserName(c + 1);
            }
            return name + 'Bot';
        });
}

function genRandomBadge() {
    const badge: any = {};
    badge.type = Math.floor(Math.random() * 24) + 1;
    badge.color1 = '#' + Math.floor(Math.random() * 0xffffff).toString(16);
    badge.color2 = '#' + Math.floor(Math.random() * 0xffffff).toString(16);
    badge.color3 = '#' + Math.floor(Math.random() * 0xffffff).toString(16);
    badge.flip = Math.random() > 0.5;
    badge.param = Math.floor(Math.random() * 200) - 100;
    return badge;
}

export var spawn = utils.withHelp([
    `spawn(botAiName, roomName, [opts]) - Create a new NPC player with bot AI scripts, and spawn it to the specified room. 'opts' is an object with the following optional properties:\r
    * username - the name of a bot player, default is randomly generated\r
    * cpu - the CPU limit of a bot user, default is 100\r
    * gcl - the Global Control Level of a bot user, default is 1\r
    * x - the X position of the spawn in the room, default is random\r
    * y - the Y position of the spawn in the room, default is random`,
    function spawn(botAiName: any, roomName: any, opts: any) {
        opts = opts || {};
        try {
            const modules = utils.loadBot(botAiName);
            let user: any;
            return db['rooms.objects'].findOne({ $and: [{ room: roomName }, { type: 'controller' }] })
                .then((controller: any) => {
                    if (!controller) {
                        return q.reject(`Room controller not found in ${roomName}`);
                    }
                    if (controller.user) {
                        return q.reject(`Room ${roomName} is already owned`);
                    }
                })
                .then(() => !opts.username ? genRandomUserName() :
                    db.users.findOne({ username: opts.username }).then((user: any) => user ? q.reject(`User with the name "${opts.username}" already exists`) : opts.username))
                .then((username: any) => {
                    const _user = {
                        username,
                        usernameLower: username.toLowerCase(),
                        cpu: opts.cpu || 100,
                        gcl: opts.gcl ? ScreepsConstants.GCL_MULTIPLY * Math.pow(opts.gcl - 1, ScreepsConstants.GCL_POW) : 0,
                        cpuAvailable: 0,
                        registeredDate: new Date(),
                        bot: botAiName,
                        active: 10000,
                        badge: genRandomBadge()
                    };
                    return db.users.insert(_user);
                })
                .then((_user: any) => {
                    user = _user;
                    return db['users.code'].insert({
                        user: user._id,
                        modules,
                        branch: 'default',
                        activeWorld: true,
                        activeSim: true
                    });
                })
                .then(() => StorageInstance.env.set(StorageEnvKey.MEMORY + user._id, "{}"))
                .then(() => db['rooms.terrain'].findOne({ room: roomName }))
                .then((terrainItem: any) => {
                    let x = opts.x || Math.floor(3 + Math.random() * 46);
                    let y = opts.y || Math.floor(3 + Math.random() * 46);
                    while (common.checkTerrain(terrainItem.terrain, x, y, ScreepsConstants.TERRAIN_MASK_WALL)) {
                        x = Math.floor(3 + Math.random() * 46);
                        y = Math.floor(3 + Math.random() * 46);
                    }
                    return db['rooms.objects'].insert({
                        type: 'spawn',
                        room: roomName,
                        x,
                        y,
                        name: 'Spawn1',
                        user: user._id,
                        store: { energy: ScreepsConstants.SPAWN_ENERGY_START },
                        storeCapacityResource: { energy: ScreepsConstants.SPAWN_ENERGY_CAPACITY },
                        hits: ScreepsConstants.SPAWN_HITS,
                        hitsMax: ScreepsConstants.SPAWN_HITS,
                        spawning: null,
                        notifyWhenAttacked: false
                    });
                })
                .then(common.getGametime)
                .then((gameTime: any) => db['rooms.objects'].update({ $and: [{ room: roomName }, { type: 'controller' }] }, {
                    $set: {
                        user: user._id, level: 1, progress: 0, downgradeTime: null, safeMode: gameTime + 20000
                    }
                }))
                .then(() => db.rooms.update({ _id: roomName }, { $set: { active: true, invaderGoal: 1000000 } }))
                .then(() => `User ${user.username} with bot AI "${botAiName}" spawned in ${roomName}`);
        }
        catch (e) {
            return q.reject(e);
        }
    }
]);

export var reload = utils.withHelp([
    "reload(botAiName) - Reload scripts for the specified bot AI.",
    function reload(botAiName: any) {
        return utils.reloadBotUsers(botAiName);
    }
]);

export var removeUser = utils.withHelp([
    "removeUser(username) - Delete the specified bot player and all its game objects.",
    function removeUser(username: any) {
        return db.users.findOne({ username })
            .then((user: any) => {
                if (!user) {
                    return q.reject('User not found');
                }
                if (!user.bot) {
                    return q.reject('User is not a bot');
                }
                return utils.respawnUser(user._id)
                    .then(db.users.removeWhere({ _id: user._id }))
                    .then(db['users.code'].removeWhere({ user: user._id }))
                    .then(StorageInstance.env.del(StorageEnvKey.MEMORY + user._id))
                    .then(() => `User removed successfully`);
            })
    }
]);

export var _help = utils.generateCliHelp('bots.', exports) + `\r\nBot AIs:\r\n` +
    Object.keys(bots).map(botName => ` - ${botName} [${bots[botName]}]`).join(`\r\n`);
