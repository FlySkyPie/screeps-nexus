import express from 'express';
import _ from 'lodash';
import jsonResponse from 'q-json-response';
import passport from 'passport';
import { Strategy as TokenStrategy } from 'passport-token';

import * as authlib from '../../authlib';

const router = express.Router();

// const sessionSecret = 'gwoif31m947j925hxcy6cj4l62he';

let useNativeAuth = false;

function setup(app: any, _useNativeAuth: any) {

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

function tokenAuth(request: any, response: any, next: any) {
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

export { router };
export { tokenAuth };
export { setup };
