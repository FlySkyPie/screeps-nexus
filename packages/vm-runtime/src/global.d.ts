import ivm from 'isolated-vm';
import type { Isolate, Context, Reference } from 'isolated-vm';

declare global {
    var _worldSize: number;

    var _init: (() => void) | undefined;

    var _isolate: Isolate;

    var _context: Context;

    var _ivm: ivm;

    var _halt: Reference;


    var _setStaticTerrainData: any;

    var _evalFn: any;

    var _start: any;
}
