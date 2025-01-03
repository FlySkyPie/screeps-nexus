import * as utils from './../utils';

const scope: Record<string, any> = {};

export default (name: any, parent: any, properties: any, prototypeExtender: any, userOwned: any) => {
    return (_runtimeData: any, _intents: any, _register: any, _globals: any) => {

        scope.runtimeData = _runtimeData;
        scope.intents = _intents;
        scope.register = _register;
        scope.globals = _globals;

        if (scope.globals[name]) {
            return;
        }

        const data = (id: any) => {
            if (!scope.runtimeData.roomObjects[id]) {
                throw new Error("Could not find an object with ID " + id);
            }
            return scope.runtimeData.roomObjects[id];
        };

        const _CustomObject = scope.register.wrapFn(function (this: any, id: any) {
            const _data = data(id);
            if (parent) {
                scope.globals[parent].call(this, id);
            }
            else {
                scope.globals.RoomObject.call(this, _data.x, _data.y, _data.room);
            }
            this.id = id;
        });

        _CustomObject.prototype = Object.create(parent ? scope.globals[parent].prototype : scope.globals.RoomObject.prototype);
        _CustomObject.prototype.constructor = _CustomObject;

        if (properties) {
            utils.defineGameObjectProperties(_CustomObject.prototype, data, properties);
        }

        if (userOwned) {
            utils.defineGameObjectProperties(_CustomObject.prototype, data, {
                my: (o: any) => o.user == scope.runtimeData.user._id,
                owner: (o: any) => new Object({ username: scope.runtimeData.users[o.user].username }),
            });
        }

        if (prototypeExtender) {
            prototypeExtender(_CustomObject.prototype, scope);
        }

        scope.globals[name] = _CustomObject;
    };
};