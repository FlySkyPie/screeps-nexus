
export interface INativeMod {
    version: number;

    loadTerrain(terrainData: any): void;

    search(...arg: any[]): any;
};
