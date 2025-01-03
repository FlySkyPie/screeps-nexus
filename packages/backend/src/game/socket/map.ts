import _ from 'lodash';

import StorageInstance from '@screeps/common/src/storage';
import { ConfigManager } from '@screeps/common/src/config-manager';
import { StorageEnvKey } from '@screeps/common/src/constants/storage-env-key';

const config = ConfigManager.config.backend;

export default (listen: any, _emit: any) => {
    const connectedToRooms: Record<string, any> = {};
    let m;

    listen(/^roomsDone$/, _.throttle(() => {

        const roomsToFetch = [],
            roomsIdx: Record<string, any> = {};

        for (let roomName in connectedToRooms) {
            if (connectedToRooms[roomName].length > 0) {
                roomsIdx[roomName] = roomsToFetch.length;
                roomsToFetch.push(StorageEnvKey.MAP_VIEW + roomName);
            }
        }

        if (!roomsToFetch.length) {
            return;
        }

        StorageInstance.env.mget(roomsToFetch).then((mapViewData: any) => {

            for (let roomName in connectedToRooms) {

                let mapView = mapViewData[roomsIdx[roomName]] || "{}";
                let message = `["roomMap2:${roomName}",${mapView}]`;

                connectedToRooms[roomName].forEach((i: any) => {
                    i.conn._writeEventRaw(message);
                });
            }

        })

    }, config.socketUpdateThrottle));

    return {
        onSubscribe(channel: any, user: any, conn: any) {

            if (user && (m = channel.match(/^roomMap2:([a-zA-Z0-9_-]+)$/))) {

                let roomName = m[1];

                connectedToRooms[roomName] = connectedToRooms[roomName] || [];
                connectedToRooms[roomName].push({
                    conn,
                    user
                });

                // const startTime = Date.now();

                StorageInstance.env.get(StorageEnvKey.MAP_VIEW + roomName).then((data: any) => {
                    data = data || "{}";
                    conn._writeEventRaw(`["roomMap2:${roomName}",${data}]`);
                });

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

            if (m = channel.match(/^roomMap2:([a-zA-Z0-9_-]+)$/)) {
                if (connectedToRooms[m[1]]) {
                    _.remove(connectedToRooms[m[1]], (i: any) => i.conn === conn);
                }
            }
        }
    };
};
