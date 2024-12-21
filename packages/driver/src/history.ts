import _ from 'lodash';

import * as common from '@screeps/common/src';
import StorageInstance from '@screeps/common/src/storage';
import { ConfigManager } from '@screeps/common/src/config-manager';

const env = StorageInstance.env;

export function saveTick(roomId: any, gameTime: any, data: any) {
    return env.hmset(env.keys.ROOM_HISTORY + roomId, { [gameTime]: data });
}

export function upload(roomId: any, baseTime: any) {
    return env.get(env.keys.ROOM_HISTORY + roomId)
        .then((data: any) => {
            if (!data || !data["" + baseTime]) {
                return;
            }

            let curTick = baseTime;
            let curObjects = JSON.parse(data["" + baseTime]);

            const result = {
                timestamp: Date.now(),
                room: roomId,
                base: curTick,
                ticks: {
                    [curTick]: curObjects
                }
            };

            curTick++;
            while (data["" + curTick]) {
                const objects = JSON.parse(data["" + curTick]);
                const diff = common.getDiff(curObjects, objects);
                result.ticks[curTick] = diff;
                curObjects = objects;
                curTick++;
            }

            ConfigManager.config.engine.emit('saveRoomHistory', roomId, baseTime, result);

            return env.del(env.keys.ROOM_HISTORY + roomId);
        });
}
