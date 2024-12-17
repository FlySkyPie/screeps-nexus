import _ from 'lodash';
import crypto from 'crypto';

import StorageInstance from '@screeps/common/src/storage';

import { logger } from './logger';

const env = StorageInstance.env;
const db = StorageInstance.db;

export function genToken(id: any) {
    const token = crypto.createHmac('sha1', 'hsdhweh342sdbj34e').update(new Date().getTime() + id).digest('hex');
    return env.setex(`auth_${token}`, 60, id)
        .then(() => token);
}


export async function checkToken(token: any, noConsume?: any) {
    logger.info(JSON.stringify({ token }));

    const authKey = `auth_${token}`;

    const data = await env.get(authKey);
    logger.info(data);
    if (!data) {
        throw false;
    }

    if (!noConsume) {
        const ttl = await env.ttl(authKey);

        if (ttl > 100) {
            env.expire(authKey, 60);
        }
    }

    console.log(db.users)

    const user = await db.users.findOne({ _id: data });

    logger.info(JSON.stringify({ user }));
    if (!user) {
        throw false;
    }

    env.set(env.keys.USER_ONLINE + user._id, Date.now());

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
//             env.set(env.keys.USER_ONLINE + user._id, Date.now());
//             return user;
//         });

// };
