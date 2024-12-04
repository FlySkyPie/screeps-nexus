import type { ISandboxObject } from '../interfaces/sandbox-object';
import { StorageHelpUtility } from '../utilities/storage-help.utility';

function helpFn(this: ISandboxObject, object: any) {
    if (object === undefined) {
        return StorageHelpUtility.help;
    }
    if (object === this.storage) {
        return StorageHelpUtility.main;
    }
    if (object === this.storage.db) {
        return StorageHelpUtility.db;
    }
    if (object === this.storage.env) {
        return StorageHelpUtility.env;
    }
    if (object === this.storage.pubsub) {
        return StorageHelpUtility.pubsub;
    }
    if (object._help) {
        return object._help;
    }
    return 'There is no help page for this object.';
}

export default function cliHelp(sandbox: ISandboxObject) {
    sandbox.help = helpFn.bind(sandbox);
};
