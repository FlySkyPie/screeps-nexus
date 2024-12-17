import express from 'express';
import _ from 'lodash';
import jsonResponse from 'q-json-response';
import passport from 'passport';
import { Strategy as TokenStrategy } from 'passport-token';
import q from 'q';

import StorageInstance from '@screeps/common/src/storage';

import * as authlib from '../../authlib';
import { genToken } from '../../authlib';
import { logger } from '../../logger';

const env = StorageInstance.env;
const db = StorageInstance.db;

export const router = express.Router();

// const sessionSecret = 'gwoif31m947j925hxcy6cj4l62he';

let useNativeAuth = false;

router.post('/login', jsonResponse(async (_request: any, _response: any) => {
    const token = await genToken("Nobody");
    return {
        token
    };
}));


function steamFindOrCreateUser(request: any, steamId: any) {

    let user: any;

    return (request.user ? q.when(request.user) : db.users.findOne({ 'steam.id': steamId }))
        .then((data: any) => {

            let steamData = {
                id: steamId
            };

            if (data) {
                user = data;

                steamData = _.extend(user.steam, steamData);

                const $set = {
                    steam: steamData
                };

                user.steam = steamData;
                return db.users.update({ _id: user._id }, { $set });
            }
            else {

                user = {
                    steam: steamData,
                    cpu: 100,
                    cpuAvailable: 0,
                    registeredDate: new Date(),
                    credits: 0,
                    gcl: 0,
                    powerExperimentations: 30
                };

                return db.users.insert(user)
                    .then((result: any) => {
                        user = result;
                        return db['users.code'].insert({
                            user: user._id,
                            modules: { main: '' },
                            branch: 'default',
                            activeWorld: true,
                            activeSim: true
                        })
                    })
                    .then(() => env.set('scrUserMemory:' + user._id, JSON.stringify({})))
            }
        })
        .then(() => user);
}

export function setup(app: any, _useNativeAuth: any) {

    useNativeAuth = _useNativeAuth;

    if (!useNativeAuth) {
        // steam = new steamApi();
    }

    passport.use(new TokenStrategy((_email: any, token: any, done: any) => {

        authlib.checkToken(token)
            .then((user: any) => {
                done(null, user);
            })
            .catch((error: any) => {
                error === false ? done(null, false) : done(error)
            });
    }));

    app.use(passport.initialize());
}

export function tokenAuth(request: any, response: any, next: any) {
    passport.authenticate('token', { session: false }, (err: any, user: any) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            response.status(401).send({ error: 'unauthorized' });
            return;
        }
        request.user = user;
        authlib.genToken(user._id).then((token: any) => {
            response.set('X-Token', token);
            next();
        });
    })(request, response, next);
}

router.get('/me', tokenAuth, jsonResponse((request: any, _response: any) => {

    const result = {
        _id: request.user._id,
        email: request.user.email,
        emailDirty: request.user.emailDirty,
        username: request.user.username,
        cpu: request.user.cpu,
        badge: request.user.badge,
        password: !!request.user.password,
        lastRespawnDate: request.user.lastRespawnDate,
        notifyPrefs: request.user.notifyPrefs,
        gcl: request.user.gcl,
        lastChargeTime: request.user.lastChargeTime,
        blocked: request.user.blocked,
        customBadge: request.user.customBadge,
        power: request.user.power,
        money: (request.user.money || 0) / 1000,
        steam: _.pick(request.user.steam, ['id', 'displayName', 'ownership']),
        powerExperimentations: request.user.powerExperimentations || 0,
        powerExperimentationTime: request.user.powerExperimentationTime || 0
    };

    return result;
}));


router.post('/steam-ticket', jsonResponse((request: any) => {
    const steamId = "Dummy";

    return steamFindOrCreateUser(request, "steamId")
        .then((user: any) => {
            logger.info(`Sign in: ${user.username} (${user._id}), IP=${request.ip}, steamid=${steamId}`);
            return authlib.genToken(user._id);
        })
        .then((token: any) => ({ token, steamid: steamId }));

}));

// export { router };
// export { tokenAuth };
// export { setup };
