export abstract class ScreepsConstants {
    public static readonly BODYPART_COST: Record<string, number> = {
        "move": 50,
        "work": 100,
        "attack": 80,
        "carry": 50,
        "heal": 250,
        "ranged_attack": 150,
        "tough": 10,
        "claim": 600
    };

    // WORLD_WIDTH and WORLD_HEIGHT constants are deprecated; please use Game.map.getWorldSize() instead
    public static readonly WORLD_WIDTH = 202;
    public static readonly WORLD_HEIGHT = 202;

    public static readonly CREEP_LIFE_TIME = 1500;
    public static readonly CREEP_CLAIM_LIFE_TIME = 600;
    public static readonly CREEP_CORPSE_RATE = 0.2;
    public static readonly CREEP_PART_MAX_ENERGY = 125;

    public static readonly CARRY_CAPACITY = 50;
    public static readonly HARVEST_POWER = 2;
    public static readonly HARVEST_MINERAL_POWER = 1;
    public static readonly HARVEST_DEPOSIT_POWER = 1;
    public static readonly REPAIR_POWER = 100;
    public static readonly DISMANTLE_POWER = 50;
    public static readonly BUILD_POWER = 5;
    public static readonly ATTACK_POWER = 30;
    public static readonly UPGRADE_CONTROLLER_POWER = 1;
    public static readonly RANGED_ATTACK_POWER = 10;
    public static readonly HEAL_POWER = 12;
    public static readonly RANGED_HEAL_POWER = 4;
    public static readonly REPAIR_COST = 0.01;
    public static readonly DISMANTLE_COST = 0.005;

    public static readonly RAMPART_DECAY_AMOUNT = 300;
    public static readonly RAMPART_DECAY_TIME = 100;
    public static readonly RAMPART_HITS = 1;

    public static readonly RAMPART_HITS_MAX = {
        2: 300000, 3: 1000000, 4: 3000000, 5: 10000000, 6: 30000000, 7: 100000000, 8: 300000000
    };

    public static readonly ENERGY_REGEN_TIME = 300;
    public static readonly ENERGY_DECAY = 1000;

    public static readonly SPAWN_HITS = 5000;
    public static readonly SPAWN_ENERGY_START = 300;
    public static readonly SPAWN_ENERGY_CAPACITY = 300;
    public static readonly CREEP_SPAWN_TIME = 3;
    public static readonly SPAWN_RENEW_RATIO = 1.2;

    public static readonly SOURCE_ENERGY_CAPACITY = 3000;
    public static readonly SOURCE_ENERGY_NEUTRAL_CAPACITY = 1500;
    public static readonly SOURCE_ENERGY_KEEPER_CAPACITY = 4000;

    public static readonly WALL_HITS = 1;
    public static readonly WALL_HITS_MAX = 300000000;

    public static readonly EXTENSION_HITS = 1000;
    public static readonly EXTENSION_ENERGY_CAPACITY = {
        0: 50, 1: 50, 2: 50, 3: 50, 4: 50, 5: 50, 6: 50, 7: 100, 8: 200
    };

    public static readonly ROAD_HITS = 5000;
    public static readonly ROAD_WEAROUT = 1;
    public static readonly ROAD_WEAROUT_POWER_CREEP = 100;
    public static readonly ROAD_DECAY_AMOUNT = 100;
    public static readonly ROAD_DECAY_TIME = 1000;

    public static readonly LINK_HITS = 1000;
    public static readonly LINK_HITS_MAX = 1000;
    public static readonly LINK_CAPACITY = 800;
    public static readonly LINK_COOLDOWN = 1;
    public static readonly LINK_LOSS_RATIO = 0.03;

    public static readonly STORAGE_CAPACITY = 1000000;
    public static readonly STORAGE_HITS = 10000;

    public static readonly CONSTRUCTION_COST: any = {
        "spawn": 15000,
        "extension": 3000,
        "road": 300,
        "constructedWall": 1,
        "rampart": 1,
        "link": 5000,
        "storage": 30000,
        "tower": 5000,
        "observer": 8000,
        "powerSpawn": 100000,
        "extractor": 5000,
        "lab": 50000,
        "terminal": 100000,
        "container": 5000,
        "nuker": 100000,
        "factory": 100000
    };
    public static readonly CONSTRUCTION_COST_ROAD_SWAMP_RATIO = 5;
    public static readonly CONSTRUCTION_COST_ROAD_WALL_RATIO = 150;


    public static readonly CONTROLLER_LEVELS: Record<number, number> = {
        1: 200,
        2: 45000,
        3: 135000,
        4: 405000,
        5: 1215000,
        6: 3645000,
        7: 10935000,
    };

    public static readonly CONTROLLER_STRUCTURES: any = {
        "spawn": { 0: 0, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 3 },
        "extension": { 0: 0, 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 },
        "link": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 3, 7: 4, 8: 6 },
        "road": { 0: 2500, 1: 2500, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500 },
        "constructedWall": { 1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500 },
        "rampart": { 1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500 },
        "storage": { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 },
        "tower": { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 6 },
        "observer": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1 },
        "powerSpawn": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1 },
        "extractor": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1 },
        "terminal": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1 },
        "lab": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 3, 7: 6, 8: 10 },
        "container": { 0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5 },
        "nuker": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1 },
        "factory": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 1 }
    };
    public static readonly CONTROLLER_DOWNGRADE: Record<number, number> = {
        1: 20000,
        2: 10000,
        3: 20000,
        4: 40000,
        5: 80000,
        6: 120000,
        7: 150000,
        8: 200000
    };
    public static readonly CONTROLLER_DOWNGRADE_RESTORE = 100;
    public static readonly CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD = 5000;
    public static readonly CONTROLLER_CLAIM_DOWNGRADE = 300;
    public static readonly CONTROLLER_RESERVE = 1;
    public static readonly CONTROLLER_RESERVE_MAX = 5000;
    public static readonly CONTROLLER_MAX_UPGRADE_PER_TICK = 15;
    public static readonly CONTROLLER_ATTACK_BLOCKED_UPGRADE = 1000;
    public static readonly CONTROLLER_NUKE_BLOCKED_UPGRADE = 200;

    public static readonly SAFE_MODE_DURATION = 20000;
    public static readonly SAFE_MODE_COOLDOWN = 50000;
    public static readonly SAFE_MODE_COST = 1000;

    public static readonly TOWER_HITS = 3000;
    public static readonly TOWER_CAPACITY = 1000;
    public static readonly TOWER_ENERGY_COST = 10;
    public static readonly TOWER_POWER_ATTACK = 600;
    public static readonly TOWER_POWER_HEAL = 400;
    public static readonly TOWER_POWER_REPAIR = 800;
    public static readonly TOWER_OPTIMAL_RANGE = 5;
    public static readonly TOWER_FALLOFF_RANGE = 20;
    public static readonly TOWER_FALLOFF = 0.75;

    public static readonly OBSERVER_HITS = 500;
    public static readonly OBSERVER_RANGE = 10;

    public static readonly POWER_BANK_HITS = 2000000;
    public static readonly POWER_BANK_CAPACITY_MAX = 5000;
    public static readonly POWER_BANK_CAPACITY_MIN = 500;
    public static readonly POWER_BANK_CAPACITY_CRIT = 0.3;
    public static readonly POWER_BANK_DECAY = 5000;
    public static readonly POWER_BANK_HIT_BACK = 0.5;

    public static readonly POWER_SPAWN_HITS = 5000;
    public static readonly POWER_SPAWN_ENERGY_CAPACITY = 5000;
    public static readonly POWER_SPAWN_POWER_CAPACITY = 100;
    public static readonly POWER_SPAWN_ENERGY_RATIO = 50;

    public static readonly EXTRACTOR_HITS = 500;
    public static readonly EXTRACTOR_COOLDOWN = 5;

    public static readonly LAB_HITS = 500;
    public static readonly LAB_MINERAL_CAPACITY = 3000;
    public static readonly LAB_ENERGY_CAPACITY = 2000;
    public static readonly LAB_BOOST_ENERGY = 20;
    public static readonly LAB_BOOST_MINERAL = 30;
    public static readonly LAB_COOLDOWN = 10;           // not used
    public static readonly LAB_REACTION_AMOUNT = 5;
    public static readonly LAB_UNBOOST_ENERGY = 0;
    public static readonly LAB_UNBOOST_MINERAL = 15;

    public static readonly GCL_POW = 2.4;
    public static readonly GCL_MULTIPLY = 1000000;
    public static readonly GCL_NOVICE = 3;

    public static readonly MODE_SIMULATION = null;
    public static readonly MODE_WORLD = null;

    public static readonly TERRAIN_MASK_WALL = 1;
    public static readonly TERRAIN_MASK_SWAMP = 2;
    public static readonly TERRAIN_MASK_LAVA = 4;

    public static readonly MAX_CONSTRUCTION_SITES = 100;
    public static readonly MAX_CREEP_SIZE = 50;

    public static readonly MINERAL_REGEN_TIME = 50000;
    public static readonly MINERAL_MIN_AMOUNT = {
        "H": 35000,
        "O": 35000,
        "L": 35000,
        "K": 35000,
        "Z": 35000,
        "U": 35000,
        "X": 35000
    };
    public static readonly MINERAL_RANDOM_FACTOR = 2;

    public static readonly MINERAL_DENSITY: any = {
        1: 15000,
        2: 35000,
        3: 70000,
        4: 100000
    };
    public static readonly MINERAL_DENSITY_PROBABILITY: any = {
        1: 0.1,
        2: 0.5,
        3: 0.9,
        4: 1.0
    };
    public static readonly MINERAL_DENSITY_CHANGE = 0.05;

    public static readonly DENSITY_LOW = 1;
    public static readonly DENSITY_MODERATE = 2;
    public static readonly DENSITY_HIGH = 3;
    public static readonly DENSITY_ULTRA = 4;

    public static readonly DEPOSIT_EXHAUST_MULTIPLY = 0.001;
    public static readonly DEPOSIT_EXHAUST_POW = 1.2;
    public static readonly DEPOSIT_DECAY_TIME = 50000;

    public static readonly TERMINAL_CAPACITY = 300000;
    public static readonly TERMINAL_HITS = 3000;
    public static readonly TERMINAL_SEND_COST = 0.1;
    public static readonly TERMINAL_MIN_SEND = 100;
    public static readonly TERMINAL_COOLDOWN = 10;

    public static readonly CONTAINER_HITS = 250000;
    public static readonly CONTAINER_CAPACITY = 2000;
    public static readonly CONTAINER_DECAY = 5000;
    public static readonly CONTAINER_DECAY_TIME = 100;
    public static readonly CONTAINER_DECAY_TIME_OWNED = 500;

    public static readonly NUKER_HITS = 1000;
    public static readonly NUKER_COOLDOWN = 100000;
    public static readonly NUKER_ENERGY_CAPACITY = 300000;
    public static readonly NUKER_GHODIUM_CAPACITY = 5000;
    public static readonly NUKE_LAND_TIME = 50000;
    public static readonly NUKE_RANGE = 10;
    public static readonly NUKE_DAMAGE = {
        0: 10000000,
        2: 5000000
    };

    public static readonly FACTORY_HITS = 1000;
    public static readonly FACTORY_CAPACITY = 50000;

    public static readonly TOMBSTONE_DECAY_PER_PART = 5;
    public static readonly TOMBSTONE_DECAY_POWER_CREEP = 500;

    public static readonly RUIN_DECAY = 500;
    public static readonly RUIN_DECAY_STRUCTURES = {
        'powerBank': 10
    };

    public static readonly PORTAL_DECAY = 30000;

    public static readonly ORDER_SELL = "sell";
    public static readonly ORDER_BUY = "buy";

    public static readonly MARKET_FEE = 0.05;

    public static readonly MARKET_MAX_ORDERS = 300;
    public static readonly MARKET_ORDER_LIFE_TIME = 1000 * 60 * 60 * 24 * 30;

    public static readonly FLAGS_LIMIT = 10000;

    public static readonly PIXEL_CPU_COST = 10000;

    public static readonly PORTAL_UNSTABLE = 10 * 24 * 3600 * 1000;
    public static readonly PORTAL_MIN_TIMEOUT = 12 * 24 * 3600 * 1000;
    public static readonly PORTAL_MAX_TIMEOUT = 22 * 24 * 3600 * 1000;

    public static readonly POWER_BANK_RESPAWN_TIME = 50000;

    public static readonly INVADERS_ENERGY_GOAL = 100000;

    public static readonly SYSTEM_USERNAME = 'Screeps';

    // SIGN_NOVICE_AREA and SIGN_RESPAWN_AREA constants are deprecated, please use SIGN_PLANNED_AREA instead
    public static readonly SIGN_NOVICE_AREA = 'A new Novice or Respawn Area is being planned somewhere in this sector. Please make sure all important rooms are reserved.';
    public static readonly SIGN_RESPAWN_AREA = 'A new Novice or Respawn Area is being planned somewhere in this sector. Please make sure all important rooms are reserved.';
    public static readonly SIGN_PLANNED_AREA = 'A new Novice or Respawn Area is being planned somewhere in this sector. Please make sure all important rooms are reserved.';


    public static readonly EVENT_HEAL_TYPE_MELEE = 1;
    public static readonly EVENT_HEAL_TYPE_RANGED = 2;

    public static readonly POWER_LEVEL_MULTIPLY = 1000;
    public static readonly POWER_LEVEL_POW = 2;
    public static readonly POWER_CREEP_SPAWN_COOLDOWN = 8 * 3600 * 1000;
    public static readonly POWER_CREEP_DELETE_COOLDOWN = 24 * 3600 * 1000;
    public static readonly POWER_CREEP_MAX_LEVEL = 25;
    public static readonly POWER_CREEP_LIFE_TIME = 5000;

    public static readonly POWER_CLASS = {
        OPERATOR: 'operator'
    };

    public static readonly EFFECT_INVULNERABILITY = 1001;
    public static readonly EFFECT_COLLAPSE_TIMER = 1002;

    public static readonly INVADER_CORE_HITS = 100000;
    public static readonly INVADER_CORE_CREEP_SPAWN_TIME = {
        0: 0, 1: 0, 2: 6, 3: 3, 4: 2, 5: 1
    };
    public static readonly INVADER_CORE_EXPAND_TIME: Record<any, number> = {
        1: 4000, 2: 3500, 3: 3000, 4: 2500, 5: 2000
    };
    public static readonly INVADER_CORE_CONTROLLER_POWER = 2;
    public static readonly INVADER_CORE_CONTROLLER_DOWNGRADE = 5000;
    public static readonly STRONGHOLD_RAMPART_HITS = { 0: 0, 1: 100000, 2: 200000, 3: 500000, 4: 1000000, 5: 2000000 };
    public static readonly STRONGHOLD_DECAY_TICKS = 75000;

    public static readonly OBSTACLE_OBJECT_TYPES = [
        "spawn",
        "creep",
        "powerCreep",
        "source",
        "mineral",
        "deposit",
        "controller",
        "constructedWall",
        "extension",
        "link",
        "storage",
        "tower",
        "observer",
        "powerSpawn",
        "powerBank",
        "lab",
        "terminal",
        "nuker",
        "factory",
        "invaderCore"];
};
