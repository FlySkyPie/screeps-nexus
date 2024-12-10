import _ from 'lodash';

import * as fakeConsole from '@screeps/engine/source/game/console';
import * as utils from '@screeps/engine/source/utils';

import * as game from './game';
import WorldMapGrid from './mapgrid';

global._init = (() => {
    const isolate: any = _isolate;
    // const context: any = _context;
    const ivm: any = _ivm;
    const cpuHalt: any = _halt;
    let mapGrid: any;
    let staticTerrainData: any = {};
    // let _scope: any;

    function nowCpuTime() {
        return isolate.cpuTime[0] * 1e3 + isolate.cpuTime[1] / 1e6;
    }

    // module.exports.isolate = isolate;
    // module.exports.context = context;

    global._setStaticTerrainData = (buffer: any, roomOffsets: any) => {
        for (let room in roomOffsets) {
            staticTerrainData[room] = new Uint8Array(buffer, roomOffsets[room], 2500);
        }
    };

    global._evalFn = (fnString: any) => {
        eval('(' + fnString + ')(scope)');
    };

    global._start = (data: any) => {
        let activeSegments: any;
        let publicSegments: any;
        let defaultPublicSegment: any;
        let activeForeignSegment: any;
        let startTime: any;
        let startDirtyTime = nowCpuTime();
        let intentCpu = 0.2;
        let freeMethods: Record<string, any> = { say: true, pull: true };

        let intents: any = {
            list: {},
            cpu: 0,
            set(id: any, name: any, data: any) {
                this.list[id] = this.list[id] || {};
                if (!freeMethods[name] && !this.list[id][name]) {
                    this.cpu += intentCpu;
                }
                this.list[id][name] = data;
            },
            push(name: any, data: any, maxLen: any) {
                this.list[name] = this.list[name] || [];
                if (maxLen && this.list[name].length >= maxLen) {
                    return false;
                }
                this.list[name].push(data);
                this.cpu += intentCpu;
                return true;
            },
            pushByName(id: any, name: any, data: any, maxLen: any) {
                this.list[id] = this.list[id] || {};
                this.list[id][name] = this.list[id][name] || [];
                if (maxLen && this.list[id][name].length >= maxLen) {
                    return false;
                }
                this.list[id][name].push(data);
                this.cpu += intentCpu;
                return true;
            },
            remove(id: any, name: any) {
                if (this.list[id] && this.list[id][name]) {
                    delete this.list[id][name];
                    return true;
                }
                return false;
            }
        };

        const rawMemory = Object.create(null, {
            get: {
                value: function () {
                    return data.userMemory.data;
                }
            },
            set: {
                value: function (value: any) {
                    if (!_.isString(value)) {
                        throw new Error('Raw memory value is not a string');
                    }
                    if (value.length > 2 * 1024 * 1024) {
                        throw new Error('Raw memory length exceeded 2 MB limit');
                    }
                    if (this._parsed) {
                        delete this._parsed;
                    }
                    data.userMemory.data = value;
                }
            },
            segments: {
                value: Object.create(null)
            },
            interShardSegment: {
                value: '',
                writable: true
            },
            setActiveSegments: {
                value: function (ids: any) {
                    if (!_.isArray<any>(ids)) {
                        throw new Error(`"${ids}" is not an array`);
                    }
                    if (ids.length > 10) {
                        throw new Error('Only 10 memory segments can be active at the same time');
                    }
                    activeSegments = [];
                    for (let i = 0; i < ids.length; i++) {
                        const id = parseInt(ids[i]);
                        if (_.isNaN(id) || id > 99 || id < 0) {
                            throw new Error(`"${ids[i]}" is not a valid segment ID`);
                        }
                        activeSegments.push(id);
                    }

                }
            },
            setPublicSegments: {
                value: function (ids: any) {
                    if (!_.isArray<any>(ids)) {
                        throw new Error(`"${ids}" is not an array`);
                    }
                    publicSegments = [];
                    for (let i = 0; i < ids.length; i++) {
                        const id = parseInt(ids[i]);
                        if (_.isNaN(id) || id > 99 || id < 0) {
                            throw new Error(`"${ids[i]}" is not a valid segment ID`);
                        }
                        publicSegments.push(id);
                    }
                }
            },
            setDefaultPublicSegment: {
                value: function (id: any) {
                    if (id !== null) {
                        id = parseInt(id);
                        if (_.isNaN(id) || id > 99 || id < 0) {
                            throw new Error(`"${id}" is not a valid segment ID`);
                        }
                    }
                    defaultPublicSegment = id;
                }
            },
            setActiveForeignSegment: {
                value: function (username: any, id: any) {
                    if (username === null) {
                        activeForeignSegment = null;
                        return;
                    }
                    if (id !== undefined) {
                        id = parseInt(id);
                        if (_.isNaN(id) || id > 99 || id < 0) {
                            throw new Error(`"${id}" is not a valid segment ID`);
                        }
                    }
                    activeForeignSegment = { username, id };
                }
            }
        });

        if (data.memorySegments) {
            for (const i in data.memorySegments) {
                rawMemory.segments[i] = data.memorySegments[i];
            }
        }

        if (data.foreignMemorySegment) {
            rawMemory.foreignSegment = Object.create(null);
            Object.assign(rawMemory.foreignSegment, data.foreignMemorySegment);
        }

        const getUsedCpu = () => {
            return nowCpuTime() + intents.cpu - startTime;
        };

        if (!mapGrid) {
            mapGrid = new WorldMapGrid(JSON.parse(data.accessibleRooms), staticTerrainData);
        }

        data.mapGrid = mapGrid;
        data.staticTerrainData = staticTerrainData;

        const outMessage: Record<string, any> = {};

        // _scope = game.init(
        game.init(
            global,
            data.userCode,
            data,
            intents,
            rawMemory,
            fakeConsole.makeConsole(data.user._id, (fn: any) => { return fn }),
            data.consoleCommands,
            data.cpu,
            getUsedCpu,
            (_name: any) => { },
            undefined,
            () => {
                return isolate.getHeapStatisticsSync();
            },
            cpuHalt);

        return new ivm.Reference(() => {

            startTime = nowCpuTime();

            try {
                game.run(data.user._id);
                outMessage.type = 'done';
            }
            catch (e: any) {
                outMessage.type = 'error';
                outMessage.error = _.isObject(e) && e.stack || e.toString();
            }

            if (rawMemory._parsed) {
                data.userMemory.data = JSON.stringify(rawMemory._parsed);
            }

            const segmentKeys = Object.keys(rawMemory.segments);
            if (segmentKeys.length > 0) {
                if (segmentKeys.length > 10) {
                    throw 'Cannot save more than 10 memory segments on the same tick';
                }
                outMessage.memorySegments = {};
                for (let i = 0; i < segmentKeys.length; i++) {
                    const key = parseInt(segmentKeys[i]);
                    if (_.isNaN(key) || key < 0 || key > 99) {
                        throw `"${segmentKeys[i]}" is not a valid memory segment ID`;
                    }
                    if (typeof rawMemory.segments[segmentKeys[i]] != 'string') {
                        throw `Memory segment #${segmentKeys[i]} is not a string`;
                    }
                    if (rawMemory.segments[segmentKeys[i]].length > 100 * 1024) {
                        throw `Memory segment #${segmentKeys[i]} has exceeded 100 KB length limit`;
                    }
                    outMessage.memorySegments[key] = "" + rawMemory.segments[segmentKeys[i]];
                }
            }

            outMessage.usedTime = Math.ceil(nowCpuTime() - startTime + intents.cpu);
            outMessage.usedDirtyTime = Math.ceil(nowCpuTime() - startDirtyTime);
            outMessage.intents = utils.storeIntents(data.user._id, intents.list, data);
            outMessage.intentsCpu = intents.cpu;
            outMessage.memory = data.userMemory;
            outMessage.console = {
                log: fakeConsole.getMessages(data.user._id),
                results: fakeConsole.getCommandResults(data.user._id)
            };

            let visual = fakeConsole.getVisual(data.user._id);
            if (Object.keys(visual).length > 0) {
                outMessage.visual = visual;
            }

            outMessage.activeSegments = activeSegments;
            outMessage.activeForeignSegment = activeForeignSegment;
            outMessage.defaultPublicSegment = defaultPublicSegment;
            if (publicSegments) {
                outMessage.publicSegments = publicSegments.join(',');
            }

            data = null;  // Important - preventing memory leak

            return new ivm.ExternalCopy(outMessage).copyInto();
        });
    }
});
