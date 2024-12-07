import net from 'node:net';
import _ from 'lodash';

import * as common from '@screeps/common/src/index';

import * as databaseMethods from './db';
import * as pubsub from './pubsub';
import * as queueMethods from './queue';
import { StorageConstants } from './constants';

const { RpcServer } = common.rpc;
const { config } = common.configManager;

Object.assign(config.storage, {
    socketListener(socket: any) {
        const connectionDesc = `${socket.remoteAddress}:${socket.remotePort}`;

        console.log(`[${connectionDesc}] Incoming connection`);

        socket.on('error', (error: any) => console.log(`[${connectionDesc}] Connection error: ${error.message}`));

        const pubsubConnection = pubsub.create();

        new RpcServer(socket, _.extend({}, databaseMethods, queueMethods, pubsubConnection.methods));

        socket.on('close', () => {
            pubsubConnection.close();
            console.log(`[${connectionDesc}] Connection closed`);
        });
    }
});

export function start() {

    if (!StorageConstants.STORAGE_PORT) {
        throw new Error('STORAGE_PORT environment variable is not set!');
    }
    if (!StorageConstants.DB_PATH) {
        throw new Error('DB_PATH environment variable is not set!');
    }

    common.configManager.load();

    config.storage.loadDb().then(() => {

        console.log(`Starting storage server`);

        const server = net.createServer(config.storage.socketListener);

        server.on('listening', () => {
            console.log('Storage listening on', StorageConstants.STORAGE_PORT);
            if (process.send) {
                process.send('storageLaunched');
            }
        });

        server.listen(
            parseInt(StorageConstants.STORAGE_PORT ?? ""),
            StorageConstants.STORAGE_HOST);
    })
        .catch((error: any) => console.error(error));
};
