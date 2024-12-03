import http from 'node:http';
import q from 'q';
import _ from 'lodash';
import express from 'express';
import steamApi from 'steam-webapi';
import jsonResponse from 'q-json-response';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import * as common from '@screeps/common/src';

import socketServer from './socket/server';
import * as auth from './api/auth';

const config = common.configManager.config;

let greenworks;
const storage = common.storage;
const db = storage.db;
const env = storage.env;
const pubsub = storage.pubsub;

steamApi.key = process.env.STEAM_KEY;

const PROTOCOL = 14;

let useNativeAuth: any;

Object.assign(config.backend, {
    welcomeText: `<h4>Welcome to your own Screeps private server!</h4>This text can be changed by adding a mod to your server, see <code>mods.json</code> file in your server folder.`,
    router: express.Router(),
    onGetRoomHistory(_roomName: any, _baseTime: any, callback: any) {
        callback('not implemented');
    },
    customObjectTypes: {},
    historyChunkSize: 20,
    renderer: {
        resources: {},
        metadata: {}
    },
});

function getServerData() {
    return {
        welcomeText: config.backend.welcomeText,
        customObjectTypes: config.backend.customObjectTypes,
        historyChunkSize: config.backend.historyChunkSize,
        socketUpdateThrottle: config.backend.socketUpdateThrottle,
        renderer: config.backend.renderer
    }
}

config.backend.router.get('/version', jsonResponse((_request: any) => {
    return db['users'].count({ $and: [{ active: { $ne: 0 } }, { cpu: { $gt: 0 } }, { bot: { $aeq: null } }] })
        .then((users: any) => {
            const result: any = {
                protocol: PROTOCOL,
                useNativeAuth,
                users,
                serverData: getServerData()
            };
            try {
                result.packageVersion = require('screeps').version;
            }
            catch (e) {
            }
            return result;
        });
}));

function connectToSteam(defer?: any) {
    if (!defer) {
        defer = q.defer();
    }

    console.log(`Connecting to Steam Web API`);

    steamApi.ready((err: any) => {
        if (err) {
            setTimeout(() => connectToSteam(defer), 1000);
            console.log('Steam Web API connection error', err);
        }

        defer.resolve();
    });
    return defer.promise;
}

function startServer() {

    config.backend.router.use('/auth', auth.router);
    config.backend.router.use('/user', require('./api/user'));
    config.backend.router.use('/register', require('./api/register'));
    config.backend.router.use('/game', require('./api/game'));
    config.backend.router.use('/leaderboard', require('./api/leaderboard'));

    if (!process.env.GAME_PORT) {
        throw new Error('GAME_PORT environment variable is not set!');
    }
    if (!process.env.GAME_HOST) {
        throw new Error('GAME_HOST environment variable is not set!');
    }
    if (!process.env.ASSET_DIR) {
        throw new Error('ASSET_DIR environment variable is not set!');
    }

    if (process.env.STEAM_KEY) {
        console.log("STEAM_KEY environment variable found, disabling native authentication");
        useNativeAuth = false;
    }
    else {
        console.log("STEAM_KEY environment variable is not found, trying to connect to local Steam client");
        try {
            greenworks = require('greenworks');
        }
        catch (e) {
            throw new Error('Cannot find greenworks library, please either install it in the /greenworks folder or provide STEAM_KEY environment variable');
        }
        if (!greenworks.isSteamRunning()) {
            throw new Error('Steam client is not running');
        }
        if (!greenworks.initAPI()) {
            throw new Error('greenworks.initAPI() failure');
        }
        useNativeAuth = true;
    }

    return (useNativeAuth ? q.when() : connectToSteam()).then(() => {

        console.log(`Starting game server (protocol version ${PROTOCOL})`);

        const app = express();

        config.backend.emit('expressPreConfig', app);

        app.use('/assets', express.static(process.env.ASSET_DIR ?? ""));

        let buildString = '';
        try {
            buildString = ` v${require('screeps').version} `;
        }
        catch (e) { }

        app.get('/', (_request, response) => {
            response.send(`<html><body>
                            Screeps server ${buildString} is running on ${process.env.GAME_HOST}:${process.env.GAME_PORT}.
                            Use your <a href="http://store.steampowered.com/app/464350">Steam game client</a> to connect.
                            </body></html>`);
        });

        if (process.env.SERVER_PASSWORD) {
            app.use((request, response, next) => {
                if (request.get('X-Server-Password') == process.env.SERVER_PASSWORD) {
                    next();
                    return;
                }
                response.json({ error: 'incorrect server password' });
            })
        }

        app.use(bodyParser.urlencoded({ limit: '8mb', extended: true }));
        app.use(bodyParser.json({
            limit: '8mb',
            verify(request, _response, buf, encoding) {
                request.rawBody = buf.toString(encoding as any);
            }
        }));

        app.use(cookieParser());

        auth.setup(app, useNativeAuth);

        app.use('/api', config.backend.router);

        app.use('/room-history', (request, response) => {
            config.backend.onGetRoomHistory(
                request.query.room,
                request.query.time,
                (error: any, result: any) => {
                    if (error) {
                        response.status(500).send(error);
                    }
                    else {
                        response.send(result);
                    }
                });
        });

        config.backend.emit('expressPostConfig', app);

        const server = http.createServer(app);

        socketServer(server, PROTOCOL);

        server.on('listening', () => {
            console.log(`Game server listening on ${process.env.GAME_HOST}:${process.env.GAME_PORT}`);
            if (process.env.SERVER_PASSWORD) {
                console.log(`Server password is ${process.env.SERVER_PASSWORD}`);
            }
        });
        server.listen(parseInt(process.env.GAME_PORT ?? ""), process.env.GAME_HOST);

    });
}

export { startServer };
