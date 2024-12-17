import net from 'node:net';
import _ from 'lodash';

import * as common from '@screeps/common/src/index';

import * as pubsub from './pubsub';
import databaseMethods from './db';
import queueMethods from './queue';
import { StorageConstants } from './constants';
import { logger } from './logger';
import { RpcServer } from './rpc';

const { config } = common.configManager;

Object.assign(config.storage, {
    socketListener(socket: net.Socket) {
        const connectionDesc = `${socket.remoteAddress}:${socket.remotePort}`;

        logger.info(`[${connectionDesc}] Incoming connection`);

        socket.on('error', (error: any) => logger.info(`[${connectionDesc}] Connection error: ${error.message}`));

        const pubsubConnection = pubsub.create();

        new RpcServer(socket, _.extend({}, databaseMethods, queueMethods, pubsubConnection.methods));

        socket.on('close', () => {
            pubsubConnection.close();
            logger.info(`[${connectionDesc}] Connection closed`);
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

        logger.info(`Starting storage server`);

        const server = net.createServer(config.storage.socketListener);

        server.on('listening', () => {
            logger.info('Storage listening on', StorageConstants.STORAGE_PORT);
            if (process.send) {
                process.send('storageLaunched');
            }
        });

        server.listen(
            StorageConstants.STORAGE_PORT as any,
            StorageConstants.STORAGE_HOST || 'localhost');
    })
        .catch((error: any) => console.error(error));
};
