import { EventEmitter } from 'node:events';
import _ from 'lodash';
import sockjs from 'sockjs';
import zlib from 'zlib';

import * as common from '@screeps/common/src';
import StorageInstance from '@screeps/common/src/storage';

import * as authlib from '../../authlib';
import system from './system';
import rooms from './rooms';
import user from './user';
import map from './map';

const config = common.configManager.config;

const env = StorageInstance.env;
const pubsub = StorageInstance.pubsub;

Object.assign(config.backend, {
    socketModules: {
        system,
        rooms,
        user,
        map,
    },
    socketUpdateThrottle: 200
});

export default function installSocketServer(server: any, PROTOCOL: any) {
    const socketServer = sockjs.createServer();
    const eventEmitter = new EventEmitter();
    let socketModules: any[] = [];
    let m: any;

    eventEmitter.setMaxListeners(0);

    socketServer.on('connection', (conn: any) => {

        if (!conn) {
            return;
        }

        conn.setMaxListeners(0);

        let gzip = false;

        conn._writeEventRaw = (message: any) => {
            if (gzip) {
                zlib.deflate(message, { level: 1 }, (_err, data) => {
                    const gzippedMessage = 'gz:' + data.toString('base64');
                    if (gzippedMessage.length < message.length) {
                        message = gzippedMessage;
                    }
                    conn.write(message);
                });
            }
            else {
                conn.write(message);
            }
        };

        conn._writeEvent = (channel: any, data: any) => {
            const message = JSON.stringify([channel, data]);
            conn._writeEventRaw(message);
        };

        const listener = (channel: any, data: any) => {
            if (conn.readyState != 1) {
                eventEmitter.removeListener(channel, listener);
                eventsListening[channel] = 0;
                return;
            }

            conn._writeEvent(channel, data);
        };

        var eventsListening: Record<string, any> = {};

        const registerListener = (channel: any) => {
            if (!eventsListening[channel])
                eventsListening[channel] = 0;
            eventsListening[channel]++;
            if (eventsListening[channel] == 1)
                eventEmitter.addListener(channel, listener);
        };
        const unregisterListener = (channel: any) => {
            eventsListening[channel]--;
            if (eventsListening[channel] == 0)
                eventEmitter.removeListener(channel, listener);
        };

        let user: any = null;

        conn.write('time ' + new Date().getTime());
        conn.write('protocol ' + PROTOCOL);

        conn.on('data', (message: any) => {

            if (m = message.match(/^subscribe (.*)$/)) {
                socketModules.forEach(socketMod => {
                    try {
                        if (socketMod.onSubscribe(m[1], user, conn)) {
                            registerListener(m[1]);
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                });
            }
            if (m = message.match(/^unsubscribe (.*)$/)) {
                socketModules.forEach(socketMod => {
                    try {
                        socketMod.onUnsubscribe && socketMod.onUnsubscribe(m[1], user, conn);
                    }
                    catch (e) {
                        console.error(e);
                    }
                });
                unregisterListener(m[1]);
            }

            if (m = message.match(/^auth (.*)$/)) {

                authlib.checkToken(m[1])
                    .then((_user: any) => {
                        user = _user;
                        env.set(env.keys.USER_ONLINE + user._id, Date.now());
                        return authlib.genToken(user._id);
                    })
                    .then((token: any) => {
                        conn.write('auth ok ' + token);
                    })
                    .catch(() => conn.write('auth failed'));
            }

            if (message == 'gzip on') {
                gzip = true;
            }

            if (message == 'gzip off') {
                gzip = false;
            }
        });
        conn.on('close', () => {
            for (const i in eventsListening)
                eventEmitter.removeListener(i, listener);
        });
    });

    socketServer.installHandlers(server, { prefix: '/socket' });

    /**
     * Modules
     */

    function emit(channel: any, data: any) {
        eventEmitter.emit(channel, channel, data);
    }

    const regexps: any[] = [];

    function listen(regexp: any, fn: any) {
        regexps.push({
            regexp, fn: function (data: any, match: any) {
                try {
                    fn(data, match);
                }
                catch (e) {
                    console.error(e);
                }
            }
        });
    }

    pubsub.subscribe('*', function (data: any) {
        let match;
        regexps.forEach((i) => {
            if (match = i.regexp.exec(this.channel)) {
                i.fn(data, match);
            }
        })
    });

    socketModules = _.values(config.backend.socketModules).map((i: any) => i(listen, emit));
};
