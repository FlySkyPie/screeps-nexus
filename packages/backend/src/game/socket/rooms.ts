import q from 'q';
import _ from 'lodash';

import * as common from '@screeps/common/src';
import StorageInstance from '@screeps/common/src/storage';
import { ConfigManager } from '@screeps/common/src/config-manager';

import { logger } from '../../logger';

const config = ConfigManager.config.backend;
const db = StorageInstance.db;
const env = StorageInstance.env;

const USER_LIMIT = 2;

const roomBuiltinUsers = {
    '2': { _id: '2', username: 'Invader' },
    '3': { _id: '3', username: 'Source Keeper' }
};

export default (listen: any, _emit: any) => {
    const connectedToRooms: Record<string, any> = {};
    let m;

    let usersLimit: Record<string, any> = {};

    listen(/^roomsDone$/, _.throttle(() => {

        usersLimit = {};

        const roomNames = _.shuffle(_.keys(connectedToRooms));

        roomNames.forEach(roomName => {

            if (connectedToRooms[roomName].length > 0) {

                let skip = true;

                connectedToRooms[roomName].forEach((i: any) => {
                    usersLimit[i.user._id] = usersLimit[i.user._id] || 0;
                    usersLimit[i.user._id]++;
                    if (usersLimit[i.user._id] > USER_LIMIT) {
                        i._skip = true;
                        i.conn._writeEvent(`err@room:${roomName}`, 'subscribe limit reached');
                        return;
                    }
                    else {
                        i._skip = false;
                        skip = false;
                    }
                });

                if (skip) {
                    return;
                }

                // const startTime = Date.now();

                let promises = [
                    db['rooms.objects'].find({ room: roomName }),
                    common.getGametime(),
                    db['rooms.flags'].find({ room: roomName })
                ];

                q.all(promises).then(result => {

                    let roomObjects = result[0],
                        gameTime = parseInt(result[1]),
                        flags = result[2];

                    connectedToRooms[roomName].forEach((i: any) => {

                        if (i._skip) {
                            return;
                        }

                        let userFlagsData: any = _.find(flags, { user: "" + i.user._id });

                        let eventResult: any = {
                            objects: common.getDiff(i.objects, roomObjects),
                            flags: userFlagsData && userFlagsData.data,
                            gameTime
                        };

                        let eventResultPromises = [
                            env.mget([
                                env.keys.ROOM_VISUAL + `${i.user._id},,${gameTime - 1}`,
                                env.keys.ROOM_VISUAL + `${i.user._id},${roomName},${gameTime - 1}`
                            ]).then((data: any) => {
                                eventResult.visual = "";
                                if (data[0]) {
                                    eventResult.visual += data[0];
                                }
                                if (data[1]) {
                                    eventResult.visual += data[1];
                                }
                            })
                        ];

                        i.objects = roomObjects;

                        let unknownUserIds: any[] = [];
                        roomObjects.forEach((object: any) => {
                            if (object.user && !i.users[object.user]) {
                                unknownUserIds.push(object.user);
                            }
                            if (object.reservation && !i.users[object.reservation.user]) {
                                unknownUserIds.push(object.reservation.user);
                            }
                            if (object.sign && !i.users[object.sign.user]) {
                                unknownUserIds.push(object.sign.user);
                            }
                        });
                        if (unknownUserIds.length) {

                            unknownUserIds = _.uniq(unknownUserIds);

                            eventResultPromises.push(
                                db.users.find({ _id: { $in: unknownUserIds } }, { username: true, badge: true })
                                    .then((unknownUsers: any) => {
                                        unknownUsers.forEach((user: any) => i.users[user._id.toString()] = user);
                                        unknownUsers = _.reduce(unknownUsers, (result: any, user: any) => {
                                            result[user._id.toString()] = user;
                                            return result;
                                        }, {});
                                        eventResult.users = unknownUsers;
                                    })
                            );
                        }

                        if (/^(W|E)\d+(N|S)\d+$/.test(roomName)) {
                            eventResult.info = {
                                mode: 'world'
                            };
                        }

                        q.all(eventResultPromises).then(() => {
                            i.conn._writeEvent(`room:${roomName}`, eventResult);
                        });
                    });
                });
            }
        });
    }, config.socketUpdateThrottle));

    return {
        onSubscribe(channel: any, user: any, conn: any) {

            if (!user) {
                return false;
            }

            if (m = channel.match(/^room:([a-zA-Z0-9_-]+)$/)) {

                let roomName = m[1],
                    roomObjects: any;

                db.rooms.findOne({ _id: roomName })
                    .then((data: any) => {
                        if (!data) {
                            return q.reject('invalid room');
                        }

                        if (usersLimit[user._id] > USER_LIMIT) {
                            connectedToRooms[roomName] = connectedToRooms[roomName] || [];
                            connectedToRooms[roomName].push({
                                conn,
                                user,
                                objects: [],
                                users: _.cloneDeep(roomBuiltinUsers)
                            });
                            conn._writeEvent(`err@room:${roomName}`, 'subscribe limit reached');
                            return q.reject();
                        }
                    })
                    .then(() => db['rooms.objects'].find({ room: roomName }))

                    .then((_roomObjects: any) => {
                        roomObjects = _roomObjects;
                        let userIds = _.reduce(roomObjects, (result: any, object: any) => {
                            if (object.user && object.user != '2' && object.user != '3') {
                                result.push(object.user);
                            }
                            return result;
                        }, []);
                        userIds = _.uniq(userIds);
                        return q.all([
                            db.users.find({ _id: { $in: userIds } }, { username: true, badge: true }),
                            db['rooms.flags'].findOne({ $and: [{ room: roomName }, { user: "" + user._id }] })
                        ]);
                    })
                    .then((result: any) => {
                        let roomUsers = _.reduce(result[0], (result: any, i: any) => {
                            result[i._id.toString()] = i;
                            return result;
                        }, {});

                        let roomFlags = result[1];

                        _.extend(roomUsers, roomBuiltinUsers);

                        connectedToRooms[roomName] = connectedToRooms[roomName] || [];
                        connectedToRooms[roomName].push({
                            conn,
                            user,
                            objects: roomObjects,
                            users: roomUsers
                        });
                        conn._writeEvent(`room:${roomName}`, {
                            objects: common.getDiff([], roomObjects),
                            users: roomUsers,
                            flags: roomFlags && roomFlags.data,
                            info: { mode: 'world' }
                        });
                    })
                    .catch(logger.error);

                conn.on('close', () => {
                    if (connectedToRooms[roomName]) {
                        _.remove(connectedToRooms[roomName], (i: any) => i.conn === conn);
                    }
                });

                return true;
            }

            return false;
        },

        onUnsubscribe(channel: any, _user: any, conn: any) {

            if (m = channel.match(/^room:([a-zA-Z0-9_-]+)$/)) {
                if (connectedToRooms[m[1]]) {
                    _.remove(connectedToRooms[m[1]], (i: any) => i.conn === conn);
                }
            }
        }
    };
};
