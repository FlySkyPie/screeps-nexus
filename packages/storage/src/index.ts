import net from 'node:net';
import { EventEmitter } from 'node:events';
import _ from 'lodash';

import common from '@screeps/common';

import * as databaseMethods from './db';
import * as pubsub from './pubsub';
import * as queueMethods from './queue';

const { RpcServer } = common.rpc;
const config = Object.assign(common.configManager.config, { storage: new EventEmitter() });
// databaseMethods = require('./db'),
// pubsub = require('./pubsub'),
// queueMethods = require('./queue');

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

    if (!process.env.STORAGE_PORT) {
        throw new Error('STORAGE_PORT environment variable is not set!');
    }
    if (!process.env.DB_PATH) {
        throw new Error('DB_PATH environment variable is not set!');
    }

    common.configManager.load();

    config.storage.loadDb().then(() => {

        console.log(`Starting storage server`);

        const server = net.createServer(config.storage.socketListener);

        server.on('listening', () => {
            console.log('Storage listening on', process.env.STORAGE_PORT);
            if (process.send) {
                process.send('storageLaunched');
            }
        });

        server.listen(
            parseInt(process.env.STORAGE_PORT ?? ""),
            process.env.STORAGE_HOST || 'localhost');
    })
        .catch((error: any) => console.error(error));
};
