import _ from 'lodash';

const messages: Record<string, any> = {};
const commandResults: Record<string, any> = {};
const visual: Record<string, any> = {};

export function makeConsole(id: any, sandboxedFunctionWrapper: any) {
    messages[id] = [];
    commandResults[id] = [];
    visual[id] = {};
    return Object.create(null, {
        log: {
            writable: true,
            configurable: true,
            value: sandboxedFunctionWrapper(function () {

                if (typeof self != 'undefined' && self.navigator.userAgent) {
                    self['console']['log'].apply(console, (arguments as any));
                }

                messages[id].push(
                    _.map((arguments as any), (i) => {
                        if (i && i.toString) return i.toString();
                        if (typeof i === 'undefined') return 'undefined';
                        return JSON.stringify(i);
                    }).join(' '));
            })
        },
        commandResult: {
            value: sandboxedFunctionWrapper((message: any) => {
                if (typeof self != 'undefined' && self.navigator.userAgent) {
                    self['console']['log'].call(console, message);
                }
                commandResults[id].push(String(message));
            })
        },
        addVisual: {
            value: sandboxedFunctionWrapper((roomName: any, data: any) => {
                roomName = roomName || "";
                visual[id][roomName] = visual[id][roomName] || "";
                if (visual[id][roomName].length > 500 * 1024) {
                    throw new Error(`RoomVisual size in room ${roomName} has exceeded 500 KB limit`);
                }
                visual[id][roomName] += JSON.stringify(data) + "\n";
            })
        },
        getVisualSize: {
            value: sandboxedFunctionWrapper((roomName: any) => {
                roomName = roomName || "";
                if (!visual[id][roomName]) {
                    return 0;
                }
                return visual[id][roomName].length;
            })
        },
        clearVisual: {
            value: sandboxedFunctionWrapper((roomName: any) => {
                roomName = roomName || "";
                visual[id][roomName] = "";
            })
        }
    });
}

export function getMessages(id: any) {
    const result = messages[id];
    messages[id] = [];
    return result;
}

export function getCommandResults(id: any) {
    const result = commandResults[id];
    commandResults[id] = [];
    return result;
}

export function getVisual(id: any) {
    const result = visual[id];
    visual[id] = [];
    return result;
}