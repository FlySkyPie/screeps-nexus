import StorageInstance from '@screeps/common/src/storage';

export abstract class StorageHelpUtility {
    public static get help() {
        return `The supported commands are:\r
    * help() - Print this help text.\r
    * print(value) - Print a value to the console.\r
    * storage - A global database storage object.\r
    * map - Map editing functions.\r
    * bots - Manage NPC bot players and their AI scripts.\r
    * strongholds - Manage NPC Strongholds\r
    * system - System utility functions.\r
Type help(object) to learn more about specific usage of the object.`;
    }

    public static get main() {
        return `This is the main storage object that allows to perform direct operations on the game database. It contains 3 sub-objects:\r
    * db - An object containing all database collections in it. Use it to fetch or modify game objects. The database is based on LokiJS project, so you can learn more about available functionality in its documentation.
    * env - A simple key-value storage with an interface based on Redis syntax.\r
    * pubsub - A Pub/Sub mechanism allowing to publish events across all processes.`
    }

    public static get db() {
        return `Database collections: \r
${Object.keys(StorageInstance.db).map(i => ' - ' + i).join('\r\n')}\r
Available methods: \r
${Object.keys(StorageInstance.db.users).map(i => ' - ' + i).join('\r\n')}\r
Example: storage.db.users.findOne({username: 'User1'}).then(print);`
    }

    public static get env() {
        return `Keys ('storage.env.keys' object): \r
        ${Object.keys(StorageInstance.env.keys).map(i => ' - ' + i).join('\r\n')}\r    
        Available methods:\r
         - get\r
         - mget\r
         - set\r
         - setex\r
         - expire\r
         - ttl\r
         - del\r
         - hmset\r
        Example: storage.env.get(storage.env.keys.GAMETIME).then(print);`;
    }

    public static get pubsub() {
        return `Keys ('storage.pubsub.keys' object): \r
${Object.keys(StorageInstance.pubsub.keys).map(i => ' - ' + i).join('\r\n')}\r    
Available methods:\r
 - publish\r
 - subscribe\r
Example: storage.pubsub.subscribe(storage.pubsub.keys.ROOMS_DONE, (gameTime) => print(gameTime));`;
    }
};
