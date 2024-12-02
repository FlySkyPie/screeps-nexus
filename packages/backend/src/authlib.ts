import q from 'q';
import _ from 'lodash';
import crypto from 'crypto';

import * as  common from '@screeps/common/src';

const env = common.storage.env;

export function genToken(id: any) {
    const token = crypto.createHmac('sha1', 'hsdhweh342sdbj34e').update(new Date().getTime() + id).digest('hex');
    return env.setex(`auth_${token}`, 60, id)
        .then(() => token);
}

export function checkToken(token: any, noConsume: any) {

    const authKey = `auth_${token}`;

    return env.get(authKey)
        .then((data: any) => {
            if (!data) {
                return q.reject(false);
            }

            if (!noConsume) {
                env.ttl(authKey)
                    .then((ttl: any) => {
                        if (ttl > 100) {
                            env.expire(authKey, 60);
                        }
                    });
            }
            return common.storage.db.users.findOne({ _id: data })
        })
        .then((user: any) => {
            if (!user) {
                return q.reject(false);
            }
            env.set(env.keys.USER_ONLINE + user._id, Date.now());
            return user;
        });

};
