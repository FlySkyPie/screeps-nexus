import { Resource } from './constants/resource';
import { StructureEnum } from './constants/structure-enum';

export const templates: any = {
    'bunker1': {
        description: 'Level 1 bunker-style Stronghold',
        rewardLevel: 1,
        structures: [
            { type: StructureEnum.STRUCTURE_INVADER_CORE, dx: 0, dy: 0, level: 1, strongholdBehavior: 'bunker1' },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 1 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: 1, dy: 1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 1 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: 1, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 0 },
        ]
    },
    'bunker2': {
        description: 'Level 2 bunker-style Stronghold',
        rewardLevel: 2,
        structures: [
            { type: StructureEnum.STRUCTURE_INVADER_CORE, dx: 0, dy: 0, level: 2, strongholdBehavior: 'bunker2' },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 0 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: 1, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 1 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: -1, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -1, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: 1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 1 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: 1, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 0 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: -1, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -1, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: 0 },
        ]
    },
    'bunker3': {
        description: 'Level 3 bunker-style Stronghold',
        rewardLevel: 3,
        structures: [
            { type: StructureEnum.STRUCTURE_INVADER_CORE, dx: 0, dy: 0, level: 3, strongholdBehavior: 'bunker3' },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 0 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: 1, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 1 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: -1, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: -1 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: -1, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: 1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -1, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: 1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -1, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 2 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: 1, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: -1 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: -2, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: 0 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: 0, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 2 },
        ]
    },
    'bunker4': {
        description: 'Level 4 bunker-style Stronghold',
        rewardLevel: 4,
        structures: [
            { type: StructureEnum.STRUCTURE_INVADER_CORE, dx: 0, dy: 0, level: 4, strongholdBehavior: 'bunker4' },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 0 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: 1, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 1 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: -1, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: -1 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: -1, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: 1 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: 1, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: -2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: -2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -1, dy: -2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: -2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: -2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: -2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 2, dy: -2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 2, dy: -2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 2, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 2, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -1, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: 1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 2, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 2, dy: 1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -1, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 2, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 2, dy: 2 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: 2, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 2, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 2, dy: 0 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: -2, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: 0 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: 0, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 2 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: 0, dy: -2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: -2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: -2 },
        ]
    },
    'bunker5': {
        description: 'Level 5 bunker-style Stronghold',
        rewardLevel: 5,
        structures: [
            { type: StructureEnum.STRUCTURE_INVADER_CORE, dx: 0, dy: 0, level: 5, strongholdBehavior: 'bunker5' },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 0 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: 1, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 1 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: -1, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: -1 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: -1, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: 1 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: 1, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: -1 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: 0, dy: -2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: -2 },
            { type: StructureEnum.STRUCTURE_TOWER, dx: 0, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: -3 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: -3 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -1, dy: -3 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: -3 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: -3 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: -3 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: -3 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: -3 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 2, dy: -3 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 2, dy: -3 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -3, dy: -2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -3, dy: -2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -1, dy: -2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: -2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: -2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: -2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 3, dy: -2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 3, dy: -2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -3, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -3, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 2, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 2, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 3, dy: -1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 3, dy: -1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -3, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -3, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -1, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 2, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 2, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 3, dy: 0 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 3, dy: 0 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -3, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -3, dy: 1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: 1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 2, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 2, dy: 1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 3, dy: 1 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 3, dy: 1 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -3, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -3, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -1, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 3, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 3, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: 3 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: 3 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -1, dy: 3 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -1, dy: 3 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 0, dy: 3 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 0, dy: 3 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 1, dy: 3 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 1, dy: 3 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 2, dy: 3 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 2, dy: 3 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: 2, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 2, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 2, dy: 2 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: -2, dy: -2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: -2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: -2 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: 2, dy: -2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: 2, dy: -2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: 2, dy: -2 },
            { type: StructureEnum.STRUCTURE_CONTAINER, dx: -2, dy: 2 },
            { type: StructureEnum.STRUCTURE_ROAD, dx: -2, dy: 2 },
            { type: StructureEnum.STRUCTURE_RAMPART, dx: -2, dy: 2 },
        ]
    }
};

export const coreRewards = {
    [Resource.RESOURCE_SILICON]: [Resource.RESOURCE_WIRE, Resource.RESOURCE_SWITCH, Resource.RESOURCE_TRANSISTOR, Resource.RESOURCE_MICROCHIP, Resource.RESOURCE_CIRCUIT, Resource.RESOURCE_DEVICE],
    [Resource.RESOURCE_METAL]: [Resource.RESOURCE_ALLOY, Resource.RESOURCE_TUBE, Resource.RESOURCE_FIXTURES, Resource.RESOURCE_FRAME, Resource.RESOURCE_HYDRAULICS, Resource.RESOURCE_MACHINE],
    [Resource.RESOURCE_BIOMASS]: [Resource.RESOURCE_CELL, Resource.RESOURCE_PHLEGM, Resource.RESOURCE_TISSUE, Resource.RESOURCE_MUSCLE, Resource.RESOURCE_ORGANOID, Resource.RESOURCE_ORGANISM],
    [Resource.RESOURCE_MIST]: [Resource.RESOURCE_CONDENSATE, Resource.RESOURCE_CONCENTRATE, Resource.RESOURCE_EXTRACT, Resource.RESOURCE_SPIRIT, Resource.RESOURCE_EMANATION, Resource.RESOURCE_ESSENCE]
};

export const coreAmounts = [0, 1000, 16000, 60000, 400000, 3000000];
export const coreDensities = [10, 220, 1400, 5100, 14000, 31500];

export const containerRewards = {
    [Resource.RESOURCE_UTRIUM_BAR]: 5,
    [Resource.RESOURCE_LEMERGIUM_BAR]: 5,
    [Resource.RESOURCE_ZYNTHIUM_BAR]: 5,
    [Resource.RESOURCE_KEANIUM_BAR]: 5,
    [Resource.RESOURCE_OXIDANT]: 5,
    [Resource.RESOURCE_REDUCTANT]: 5,
    [Resource.RESOURCE_PURIFIER]: 5,
    [Resource.RESOURCE_GHODIUM_MELT]: 20,
    [Resource.RESOURCE_BATTERY]: 10,
    [Resource.RESOURCE_COMPOSITE]: 10,
    [Resource.RESOURCE_CRYSTAL]: 15,
    [Resource.RESOURCE_LIQUID]: 30
};

export const containerAmounts = [0, 500, 4000, 10000, 50000, 360000];
