import { ncp } from 'ncp';
import path from 'path';
import fs from 'fs';
import prompt from 'prompt';

export default (dir: any) => {

    dir = path.resolve(dir);
    try {
        let stat = fs.statSync(dir);
        if (stat && !stat.isDirectory()) {
            console.error(`${dir} is not a directory!`);
            return;
        }
        try {
            stat = fs.statSync(path.resolve(dir, '.screepsrc'));
            if (stat) {
                console.error(`Existing .screepsrc found in this directory!`);
                return;
            }
        }
        catch (e) { }
    }
    catch (e: any) {
        if (e.code == 'ENOENT') {
            fs.mkdirSync(dir);
        }
        else {
            throw e;
        }
    }

    prompt.message = 'A Steam Web API key is required to run the server without the Steam client installed.\nYou can obtain a key on this page: https://steamcommunity.com/dev/apikey\n';
    prompt.delimiter = '';
    prompt.start();

    prompt.get([{
        name: 'steamApiKey',
        description: 'Enter your Steam API key:',
        type: 'string'
    }], (err, results) => {

        if (err) {
            console.error(err);
            return;
        }

        ncp(path.resolve(__dirname, '../../init_dist'), dir, (err) => {
            if (err) {
                console.error("Error while creating world data:", err);
            }
            else {
                const configFilename = path.resolve(dir, '.screepsrc');
                let config = fs.readFileSync(configFilename, { encoding: 'utf8' });
                config = config.replace(/{{STEAM_KEY}}/, (results as any).steamApiKey);
                fs.writeFileSync(configFilename, config);
                fs.chmodSync(path.resolve(dir, 'node_modules/.hooks/install'), '755');
                fs.chmodSync(path.resolve(dir, 'node_modules/.hooks/uninstall'), '755');
                try {
                    fs.writeFileSync(path.resolve(dir, 'package.json'), JSON.stringify({
                        name: 'my-screeps-world',
                        version: '0.0.1',
                        private: true
                    }, undefined, '  '), { encoding: 'utf8', flag: 'wx' });
                }
                catch (e) { }
                console.log(`Screeps world data created in "${dir}".\nRun "screeps start" to launch your server.`);
            }
        })
    });
};