import cp from 'child_process';
import path from 'path';
import _ from 'lodash';
import ini from 'ini';
import fs from 'fs';
import { readFile, writeFile, mkdir, stat, rename, } from 'fs/promises';

import common from '@screeps/common';

const DEFAULTS = {
    modfile: 'mods.json',
    runners_threads: 2,
    processors_cnt: 2,
    storage_timeout: 5000,
    storage_disabled: false,
    log_console: false,
    log_rotate_keep: 5,
    restart_interval: 3600
}

interface IOptions {
    logdir?: string;

    modfile: string,
    runners_threads: number,
    processors_cnt: number,
    storage_timeout: number,
    storage_disabled: boolean,
    log_console: boolean,
    log_rotate_keep: number,
    restart_interval: number,

    /**
     * @deprecated Fix this later.
     */
    runners_cnt: any;

    [key: string]: unknown;
}

export default async function start(_opts: IOptions, output: any) {

    let opts: IOptions = {} as any;
    try {
        opts = ini.parse(await readFile('./.screepsrc', { encoding: 'utf8' })) as any;
    } catch (e: any) {
        if (e.code === 'ENOENT') {
            console.error(`Warning: file .screepsrc not found. Did you run "screeps init" in this directory?`);
        }
    }
    opts = Object.assign({}, DEFAULTS, opts);
    for (let i in _opts) {
        if (_opts[i]) {
            opts[i] = _opts[i];
        }
    }
    if (!opts.assetdir) {
        throw new Error('`assetdir` option is not defined!');
    }

    try {
        await stat('./steam_appid.txt');
    } catch (e) {
        await writeFile('./steam_appid.txt', '464350');
    }

    interface IResult {
        gamePort?: number;
        cliPort?: number;

        processes: Record<string, cp.ChildProcess>;

        [key: string]: unknown;
    };

    const result: IResult = {
        processes: {},
        logdir: opts.logdir
    };

    if (opts.port) {
        result.gamePort = +opts.port;
    } else {
        result.gamePort = await common.findPort(21025);
    }
    if (opts.cli_port) {
        result.cliPort = +opts.cli_port;
    } else {
        result.cliPort = await common.findPort(result.gamePort! + 1);
    }
    if (opts.storage_port) {
        result.storagePort = +opts.storage_port;
    } else {
        if (process.platform == 'linux') {
            try {
                fs.unlinkSync('storage.sock');
            }
            catch (e) { }
            result.storagePort = 'storage.sock';
        }
        else {
            result.storagePort = await common.findPort(result.cliPort! + 1);
        }
    }

    if (output) {
        try {
            output.write(`Server version ${require('screeps').version}\r\n`);
        } catch (e) { }
        output.write(`Starting all processes. Ports: ${result.gamePort} (game), ${result.cliPort} (cli)\r\n`);
    }

    try {
        const statRes = await stat(opts.logdir ?? "");
        if (!statRes.isDirectory()) {
            throw new Error(opts.logdir + ' is not a directory!');
        }
    } catch (e) {
        await mkdir(opts.logdir ?? "");
    }

    async function rotateLogs(logPath: any) {
        for (let i = opts.log_rotate_keep; i > 1; i--) {
            const oldName = `${logPath}.${i - 1}`
            const newName = `${logPath}.${i}`

            try {
                await rename(oldName, newName)
            } catch (e) { }
        }
        try {
            await rename(logPath, `${logPath}.1`)
        } catch (e) { }
    }

    async function _startProcess(name: any, execPath: any, env: any, restartInterval = 0) {
        const logPath = path.resolve(opts.logdir ?? "", name + '.log')
        await rotateLogs(logPath)
        const str = fs.createWriteStream(logPath, 'utf-8');

        result.processes[name] = cp.fork(path.resolve(execPath), {
            stdio: [0, 'pipe', 'pipe', 'ipc'],
            env: Object.assign(env, process.env)
        });
        result.processes[name].stdout?.pipe(str);
        result.processes[name].stderr?.pipe(str);

        if (opts.log_console) {
            result.processes[name].stdout?.on('data', (data: any) => output.write(`[${name}] ${data.toString()}`))
            result.processes[name].stderr?.on('data', (data: any) => output.write(`[${name}] ${data.toString()}`))
        }

        if (output) {
            output.write(`[${name}] process ${result.processes[name].pid} started\r\n`);
        }

        if (restartInterval) {
            setTimeout(() => result.processes[name].kill(), restartInterval * 1000)
        }

        result.processes[name].on('exit', async (code: any) => {
            if (output) {
                output.write(`[${name}] process ${result.processes[name].pid} exited with code ${code}, restarting...\r\n`);
            }
            await str.close();
            setTimeout(() => _startProcess(name, execPath, env), result.processes[name].killed ? 1 : 1000);
        });
        return result.processes[name];
    }

    function _waitForLaunch(storageProcess: any) {
        return new Promise<void>((resolve, reject) => {
            let errorTimeout = setTimeout(() => {
                reject(new Error('Could not launch the storage process'));
            }, opts.storage_timeout);

            const handler = (msg: any) => {
                if (msg === 'storageLaunched') {
                    clearTimeout(errorTimeout);
                    storageProcess.removeListener('message', handler);
                    resolve();
                }
                if (msg === 'storageUpgrading') {
                    clearTimeout(errorTimeout);
                    errorTimeout = setTimeout(() => {
                        reject(new Error('Could not launch the storage process'));
                    }, opts.storage_timeout);
                }
            };
            storageProcess.on('message', handler);
        })
    }

    if (!opts.storage_disabled) {
        const storageProcess = await _startProcess('storage',
            path.resolve(path.dirname(require.resolve('@screeps/storage')), '../dist/index.js'), {
            STORAGE_PORT: result.storagePort,
            MODFILE: opts.modfile,
            DB_PATH: opts.db
        });
        await _waitForLaunch(storageProcess)
    }

    await _startProcess('backend',
        path.resolve(path.dirname(require.resolve('@screeps/backend')), '../dist/index.js'), {
        GAME_PORT: result.gamePort,
        GAME_HOST: opts.host,
        CLI_PORT: result.cliPort,
        CLI_HOST: opts.cli_host,
        STORAGE_PORT: result.storagePort,
        MODFILE: opts.modfile,
        ASSET_DIR: opts.assetdir,
        SERVER_PASSWORD: opts.password,
        STEAM_KEY: opts.steam_api_key
    });

    await _startProcess('engine_main',
        path.resolve(path.dirname(require.resolve('@screeps/engine')), 'main.js'), {
        STORAGE_PORT: result.storagePort,
        MODFILE: opts.modfile,
        DRIVER_MODULE: '@screeps/driver'
    });

    for (var i = 1; i <= opts.runners_cnt; i++) {
        await _startProcess('engine_runner' + i,
            path.resolve(path.dirname(require.resolve('@screeps/engine')), 'runner.js'), {
            STORAGE_PORT: result.storagePort,
            MODFILE: opts.modfile,
            DRIVER_MODULE: '@screeps/driver',
            RUNNER_THREADS: opts.runner_threads
        }, opts.restart_interval);
    }

    for (var i = 1; i <= opts.processors_cnt; i++) {
        await _startProcess('engine_processor' + i,
            path.resolve(path.dirname(require.resolve('@screeps/engine')), 'processor.js'), {
            STORAGE_PORT: result.storagePort,
            MODFILE: opts.modfile,
            DRIVER_MODULE: '@screeps/driver'
        }, opts.restart_interval);
    }

    return result;
};
