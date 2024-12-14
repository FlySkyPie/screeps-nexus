import http from 'node:http';
import q from 'q';
import _ from 'lodash';
import express from 'express';
import jsonResponse from 'q-json-response';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import * as common from '@screeps/common/src';
import StorageInstance from '@screeps/common/src/storage';

import { ProjectConfig } from '../constansts/project-config';

import socketServer from './socket/server';
import * as auth from './api/auth';

const config = common.configManager.config;
const db = StorageInstance.db;

const PROTOCOL = 14;

let useNativeAuth: boolean = false;

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
                result.packageVersion = ProjectConfig.SCREEPS_VERSION;
            }
            catch (e) {
            }
            return result;
        });
}));

const startServer = async () => {
    const userRouter = await import('./api/user');
    const registerRouter = await import('./api/register');
    const gameRouter = await import('./api/game');
    const leaderboardRouter = await import('./api/leaderboard');

    config.backend.router.use('/auth', auth.router);
    config.backend.router.use('/user', userRouter.default);
    config.backend.router.use('/register', registerRouter.default);
    config.backend.router.use('/game', gameRouter.default);
    config.backend.router.use('/leaderboard', leaderboardRouter.default);

    if (!ProjectConfig.GAME_PORT) {
        throw new Error('GAME_PORT environment variable is not set!');
    }
    if (!ProjectConfig.GAME_HOST) {
        throw new Error('GAME_HOST environment variable is not set!');
    }
    if (!ProjectConfig.ASSET_DIR) {
        throw new Error('ASSET_DIR environment variable is not set!');
    }

    return (q.when()).then(() => {

        console.log(`Starting game server (protocol version ${PROTOCOL})`);

        const app = express();

        config.backend.emit('expressPreConfig', app);

        app.use('/assets', express.static(ProjectConfig.ASSET_DIR ?? ""));

        let buildString = '';
        try {
            buildString = ` v${ProjectConfig.SCREEPS_VERSION} `;
        }
        catch (e) { }

        app.get('/', (_request, response) => {
            response.send(`<html><body>
                            Screeps server ${buildString} is running on ${ProjectConfig.GAME_HOST}:${ProjectConfig.GAME_PORT}.
                            Use your <a href="http://store.steampowered.com/app/464350">Steam game client</a> to connect.
                            </body></html>`);
        });

        if (ProjectConfig.SERVER_PASSWORD) {
            app.use((request, response, next) => {
                if (request.get('X-Server-Password') == ProjectConfig.SERVER_PASSWORD) {
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
            console.log(`Game server listening on ${ProjectConfig.GAME_HOST}:${ProjectConfig.GAME_PORT}`);
            if (ProjectConfig.SERVER_PASSWORD) {
                console.log(`Server password is ${ProjectConfig.SERVER_PASSWORD}`);
            }
        });
        server.listen(parseInt(ProjectConfig.GAME_PORT ?? ""), ProjectConfig.GAME_HOST);

    });
}

export { startServer };
