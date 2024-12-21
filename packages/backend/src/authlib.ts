import _ from 'lodash';
import crypto from 'crypto';

import StorageInstance from '@screeps/common/src/storage';
import { StorageEnvKey } from '@screeps/common/src/constants/storage-env-key';

import { logger } from './logger';

const db = StorageInstance.db;

export function genToken(id: any) {
    const token = crypto.createHmac('sha1', 'hsdhweh342sdbj34e').update(new Date().getTime() + id).digest('hex');
    return StorageInstance.env.setex(`auth_${token}`, 60, id)
        .then(() => token);
}


export async function checkToken(token: any, noConsume?: any) {
    const authKey = `auth_${token}`;

    const data = await StorageInstance.env.get(authKey);
    if (!data) {
        throw false;
    }

    if (!noConsume) {
        const ttl = await StorageInstance.env.ttl(authKey);

        if (ttl > 100) {
            StorageInstance.env.expire(authKey, 60);
        }
    }
    const user = await db.users.findOne({ _id: data });

    logger.debug(JSON.stringify({ user }));
    if (!user) {
        throw false;
    }

    StorageInstance.env.set(StorageEnvKey.USER_ONLINE + user._id, Date.now());

    return user;
};

// export function checkToken(token: any, noConsume?: any) {
//     logger.info(JSON.stringify({ token }));

//     const authKey = `auth_${token}`;

//     return env.get(authKey)
//         .then((data: any) => {
//             logger.info(data);
//             if (!data) {
//                 return q.reject(false);
//             }

//             if (!noConsume) {
//                 env.ttl(authKey)
//                     .then((ttl: any) => {
//                         if (ttl > 100) {
//                             env.expire(authKey, 60);
//                         }
//                     });
//             }
//             return db.users.findOne({ _id: data })
//         })
//         .then((user: any) => {
//             logger.info(JSON.stringify({ user }));
//             if (!user) {
//                 return q.reject(false);
//             }
//             env.set(StorageEnvKey.USER_ONLINE + user._id, Date.now());
//             return user;
//         });

// };
