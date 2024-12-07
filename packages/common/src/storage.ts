import q from 'q';
import net from 'net';

import { config } from './config-manager';
import { RpcClient } from './rpc';

config.common.dbCollections = [
    'leaderboard.power',
    'leaderboard.seasons',
    'leaderboard.world',
    'users.intents',
    'market.orders',
    'market.stats',
    'rooms',
    'rooms.objects',
    'rooms.flags',
    'rooms.intents',
    'rooms.terrain',
    'transactions',
    'users',
    'users.code',
    'users.console',
    'users.messages',
    'users.money',
    'users.notifications',
    'users.resources',
    'users.power_creeps'
];

class StorageInstance {
    public static resetAllData: any;

    public static _connected = false;

    public static db: any = {};

    public static queue: any = {};

    public static env: any = {
        keys: {
            ACCESSIBLE_ROOMS: 'accessibleRooms',
            ROOM_STATUS_DATA: 'roomStatusData',
            MEMORY: 'memory:',
            GAMETIME: 'gameTime',
            MAP_VIEW: 'mapView:',
            TERRAIN_DATA: 'terrainData',
            SCRIPT_CACHED_DATA: 'scriptCachedData:',
            USER_ONLINE: 'userOnline:',
            MAIN_LOOP_PAUSED: 'mainLoopPaused',
            ROOM_HISTORY: 'roomHistory:',
            ROOM_VISUAL: 'roomVisual:',
            MEMORY_SEGMENTS: 'memorySegments:',
            PUBLIC_MEMORY_SEGMENTS: 'publicMemorySegments:',
            ROOM_EVENT_LOG: 'roomEventLog:',
            ACTIVE_ROOMS: 'activeRooms',
            MAIN_LOOP_MIN_DURATION: 'tickRate'
        }
    };

    public static pubsub: any = {
        keys: {
            QUEUE_DONE: 'queueDone:',
            RUNTIME_RESTART: 'runtimeRestart',
            TICK_STARTED: "tickStarted",
            ROOMS_DONE: "roomsDone"
        }
    };

    public static _connect() {
        if (StorageInstance._connected) {
            return q.when();
        }

        if (!process.env.STORAGE_PORT) {
            throw new Error('STORAGE_PORT environment variable is not set!');
        }

        /**
         * `process.env.STORAGE_PORT` chould be `storage.sock`.
         */
        const socket = net.connect((process.env.STORAGE_PORT) as any, process.env.STORAGE_HOST);
        const rpcClient = new RpcClient(socket);

        const defer = q.defer();
        const resetDefer = q.defer();

        function wrapCollection(collectionName: any) {
            const wrap: any = {};
            ['find', 'findOne', 'by', 'clear', 'count', 'ensureIndex', 'removeWhere', 'insert'].forEach(method => {
                wrap[method] = function () {
                    return rpcClient.request('dbRequest', collectionName, method, Array.prototype.slice.call(arguments));
                }
            });
            wrap.update = (query: any, update: any, params: any) => {
                return rpcClient.request('dbUpdate', collectionName, query, update, params);
            };
            wrap.bulk = (bulk: any) => {
                return rpcClient.request('dbBulk', collectionName, bulk);
            };
            wrap.findEx = (query: any, opts: any) => {
                return rpcClient.request('dbFindEx', collectionName, query, opts);
            };
            return wrap;
        }

        config.common.dbCollections.forEach((i: any) => StorageInstance.db[i] = wrapCollection(i));

        StorageInstance.resetAllData = () => rpcClient.request('dbResetAllData');

        Object.assign(StorageInstance.queue, {
            fetch: rpcClient.request.bind(rpcClient, 'queueFetch'),
            add: rpcClient.request.bind(rpcClient, 'queueAdd'),
            addMulti: rpcClient.request.bind(rpcClient, 'queueAddMulti'),
            markDone: rpcClient.request.bind(rpcClient, 'queueMarkDone'),
            whenAllDone: rpcClient.request.bind(rpcClient, 'queueWhenAllDone'),
            reset: rpcClient.request.bind(rpcClient, 'queueReset')
        });

        Object.assign(StorageInstance.env, {
            get: rpcClient.request.bind(rpcClient, 'dbEnvGet'),
            mget: rpcClient.request.bind(rpcClient, 'dbEnvMget'),
            set: rpcClient.request.bind(rpcClient, 'dbEnvSet'),
            setex: rpcClient.request.bind(rpcClient, 'dbEnvSetex'),
            expire: rpcClient.request.bind(rpcClient, 'dbEnvExpire'),
            ttl: rpcClient.request.bind(rpcClient, 'dbEnvTtl'),
            del: rpcClient.request.bind(rpcClient, 'dbEnvDel'),
            hmget: rpcClient.request.bind(rpcClient, 'dbEnvHmget'),
            hmset: rpcClient.request.bind(rpcClient, 'dbEnvHmset'),
            hget: rpcClient.request.bind(rpcClient, 'dbEnvHget'),
            hset: rpcClient.request.bind(rpcClient, 'dbEnvHset'),
            sadd: rpcClient.request.bind(rpcClient, 'dbEnvSadd'),
            smembers: rpcClient.request.bind(rpcClient, 'dbEnvSmembers'),
        });

        Object.assign(StorageInstance.pubsub, {
            publish: rpcClient.request.bind(rpcClient, 'publish'),
            subscribe(channel: any, cb: any) {
                rpcClient.subscribe(channel, cb);
            }
        });

        StorageInstance._connected = true;

        defer.resolve();

        socket.on('error', err => {
            console.error('Storage connection lost', err);
            resetDefer.resolve('reset');
            StorageInstance._connected = false;
            setTimeout(exports._connect, 1000);
        });
        socket.on('end', () => {
            console.error('Storage connection lost');
            resetDefer.resolve('reset');
            StorageInstance._connected = false;
            setTimeout(StorageInstance._connect, 1000)
        });

        return defer.promise;
    };
};

export default StorageInstance;

config.common.storage = StorageInstance;
