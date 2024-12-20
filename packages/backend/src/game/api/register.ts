import express from 'express';
import q from 'q';
import _ from 'lodash';
import jsonResponse from 'q-json-response';

import StorageInstance from '@screeps/common/src/storage';

import * as auth from './auth';

const router = express.Router();
const db = StorageInstance.db;

router.get('/check-email', jsonResponse((request: any) => {

    if (!request.query.email) {
        return q.reject('invalid email');
    }

    return db.users.findOne({ email: request.query.email.toLowerCase() })
        .then((data: any) => {
            if (data) {
                return q.reject('exists');
            }
        })
}));


router.get('/check-username', jsonResponse((request: any) => {

    if (!request.query.username) {
        return q.reject('invalid username');
    }

    return db.users.findOne({ usernameLower: request.query.username.toLowerCase() })
        .then((data: any) => {
            if (data) {
                return q.reject('exists');
            }
        })
}));

router.post('/set-username', auth.tokenAuth, jsonResponse((request: any) => {

    const $set: any = {
        username: request.body.username,
        usernameLower: request.body.username.toLowerCase()
    };

    if (request.body.email) {
        if (!/^[\w\d-\.\+&]+\@[\w\d\-\.&]+\.[\w\d\-\.&]{2,}$/.test(request.body.email)) {
            return q.reject('invalid email');
        }
        request.body.email = request.body.email.toLowerCase();
        $set.email = request.body.email;
    }

    if (request.user.username) {
        return q.reject('username already set');
    }
    if (!/^[a-zA-Z0-9_-]{3,}$/.test(request.body.username)) {
        return q.reject('invalid username');
    }

    return db.users.findOne({ usernameLower: request.body.username.toLowerCase() })
        .then((data: any) => {
            if (data) {
                return q.reject('invalid username');
            }
        })
        .then(() => db.users.update({ _id: request.user._id }, { $set }))
}));

export default router;
