export abstract class ScreepsConstants {
    public static BODYPART_COST = {
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
    public static WORLD_WIDTH = 202;
    public static WORLD_HEIGHT = 202;

    public static CREEP_LIFE_TIME = 1500;
    public static CREEP_CLAIM_LIFE_TIME = 600;
    public static CREEP_CORPSE_RATE = 0.2;
    public static CREEP_PART_MAX_ENERGY = 125;

    public static CARRY_CAPACITY = 50;
    public static HARVEST_POWER = 2;
    public static HARVEST_MINERAL_POWER = 1;
    public static HARVEST_DEPOSIT_POWER = 1;
    public static REPAIR_POWER = 100;
    public static DISMANTLE_POWER = 50;
    public static BUILD_POWER = 5;
    public static ATTACK_POWER = 30;
    public static UPGRADE_CONTROLLER_POWER = 1;
    public static RANGED_ATTACK_POWER = 10;
    public static HEAL_POWER = 12;
    public static RANGED_HEAL_POWER = 4;
    public static REPAIR_COST = 0.01;
    public static DISMANTLE_COST = 0.005;

    public static RAMPART_DECAY_AMOUNT = 300;
    public static RAMPART_DECAY_TIME = 100;
    public static RAMPART_HITS = 1;
    RAMPART_HITS_MAX = {
        2: 300000, 3: 1000000, 4: 3000000, 5: 10000000, 6: 30000000, 7: 100000000, 8: 300000000
    };

    public static ENERGY_REGEN_TIME = 300;
    public static ENERGY_DECAY = 1000;

    public static SPAWN_HITS = 5000;
    public static SPAWN_ENERGY_START = 300;
    public static SPAWN_ENERGY_CAPACITY = 300;
    public static CREEP_SPAWN_TIME = 3;
    public static SPAWN_RENEW_RATIO = 1.2;

    public static SOURCE_ENERGY_CAPACITY = 3000;
    public static SOURCE_ENERGY_NEUTRAL_CAPACITY = 1500;
    public static SOURCE_ENERGY_KEEPER_CAPACITY = 4000;

    public static WALL_HITS = 1;
    public static WALL_HITS_MAX = 300000000;

    public static EXTENSION_HITS = 1000;
    EXTENSION_ENERGY_CAPACITY = {
        0: 50, 1: 50, 2: 50, 3: 50, 4: 50, 5: 50, 6: 50, 7: 100, 8: 200
    };

    public static ROAD_HITS = 5000;
    public static ROAD_WEAROUT = 1;
    public static ROAD_WEAROUT_POWER_CREEP = 100;
    public static ROAD_DECAY_AMOUNT = 100;
    public static ROAD_DECAY_TIME = 1000;

    public static LINK_HITS = 1000;
    public static LINK_HITS_MAX = 1000;
    public static LINK_CAPACITY = 800;
    public static LINK_COOLDOWN = 1;
    public static LINK_LOSS_RATIO = 0.03;

    public static STORAGE_CAPACITY = 1000000;
    public static STORAGE_HITS = 10000;

    CONSTRUCTION_COST = {
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
    public static CONSTRUCTION_COST_ROAD_SWAMP_RATIO = 5;
    public static CONSTRUCTION_COST_ROAD_WALL_RATIO = 150;


    CONTROLLER_LEVELS = {
        1: 200, 2: 45000, 3: 135000, 4: 405000, 5: 1215000, 6: 3645000, 7: 10935000
    };
    CONTROLLER_STRUCTURES = {
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
    CONTROLLER_DOWNGRADE = {
        1: 20000, 2: 10000, 3: 20000, 4: 40000, 5: 80000, 6: 120000, 7: 150000, 8: 200000
    };
    public static CONTROLLER_DOWNGRADE_RESTORE = 100;
    public static CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD = 5000;
    public static CONTROLLER_CLAIM_DOWNGRADE = 300;
    public static CONTROLLER_RESERVE = 1;
    public static CONTROLLER_RESERVE_MAX = 5000;
    public static CONTROLLER_MAX_UPGRADE_PER_TICK = 15;
    public static CONTROLLER_ATTACK_BLOCKED_UPGRADE = 1000;
    public static CONTROLLER_NUKE_BLOCKED_UPGRADE = 200;

    public static SAFE_MODE_DURATION = 20000;
    public static SAFE_MODE_COOLDOWN = 50000;
    public static SAFE_MODE_COST = 1000;

    public static TOWER_HITS = 3000;
    public static TOWER_CAPACITY = 1000;
    public static TOWER_ENERGY_COST = 10;
    public static TOWER_POWER_ATTACK = 600;
    public static TOWER_POWER_HEAL = 400;
    public static TOWER_POWER_REPAIR = 800;
    public static TOWER_OPTIMAL_RANGE = 5;
    public static TOWER_FALLOFF_RANGE = 20;
    public static TOWER_FALLOFF = 0.75;

    public static OBSERVER_HITS = 500;
    public static OBSERVER_RANGE = 10;

    public static POWER_BANK_HITS = 2000000;
    public static POWER_BANK_CAPACITY_MAX = 5000;
    public static POWER_BANK_CAPACITY_MIN = 500;
    public static POWER_BANK_CAPACITY_CRIT = 0.3;
    public static POWER_BANK_DECAY = 5000;
    public static POWER_BANK_HIT_BACK = 0.5;

    public static POWER_SPAWN_HITS = 5000;
    public static POWER_SPAWN_ENERGY_CAPACITY = 5000;
    public static POWER_SPAWN_POWER_CAPACITY = 100;
    public static POWER_SPAWN_ENERGY_RATIO = 50;

    public static EXTRACTOR_HITS = 500;
    public static EXTRACTOR_COOLDOWN = 5;

    public static LAB_HITS = 500;
    public static LAB_MINERAL_CAPACITY = 3000;
    public static LAB_ENERGY_CAPACITY = 2000;
    public static LAB_BOOST_ENERGY = 20;
    public static LAB_BOOST_MINERAL = 30;
    LAB_COOLDOWN = 10;           // not used
    public static LAB_REACTION_AMOUNT = 5;
    public static LAB_UNBOOST_ENERGY = 0;
    public static LAB_UNBOOST_MINERAL = 15;

    public static GCL_POW = 2.4;
    public static GCL_MULTIPLY = 1000000;
    public static GCL_NOVICE = 3;

    public static MODE_SIMULATION = null;
    public static MODE_WORLD = null;

    public static TERRAIN_MASK_WALL = 1;
    public static TERRAIN_MASK_SWAMP = 2;
    public static TERRAIN_MASK_LAVA = 4;

    public static MAX_CONSTRUCTION_SITES = 100;
    public static MAX_CREEP_SIZE = 50;

    public static MINERAL_REGEN_TIME = 50000;
    MINERAL_MIN_AMOUNT = {
        "H": 35000,
        "O": 35000,
        "L": 35000,
        "K": 35000,
        "Z": 35000,
        "U": 35000,
        "X": 35000
    };
    public static MINERAL_RANDOM_FACTOR = 2;

    MINERAL_DENSITY = {
        1: 15000,
        2: 35000,
        3: 70000,
        4: 100000
    };
    MINERAL_DENSITY_PROBABILITY = {
        1: 0.1,
        2: 0.5,
        3: 0.9,
        4: 1.0
    };
    public static MINERAL_DENSITY_CHANGE = 0.05;

    public static DENSITY_LOW = 1;
    public static DENSITY_MODERATE = 2;
    public static DENSITY_HIGH = 3;
    public static DENSITY_ULTRA = 4;

    public static DEPOSIT_EXHAUST_MULTIPLY = 0.001;
    public static DEPOSIT_EXHAUST_POW = 1.2;
    public static DEPOSIT_DECAY_TIME = 50000;

    public static TERMINAL_CAPACITY = 300000;
    public static TERMINAL_HITS = 3000;
    public static TERMINAL_SEND_COST = 0.1;
    public static TERMINAL_MIN_SEND = 100;
    public static TERMINAL_COOLDOWN = 10;

    public static CONTAINER_HITS = 250000;
    public static CONTAINER_CAPACITY = 2000;
    public static CONTAINER_DECAY = 5000;
    public static CONTAINER_DECAY_TIME = 100;
    public static CONTAINER_DECAY_TIME_OWNED = 500;

    public static NUKER_HITS = 1000;
    public static NUKER_COOLDOWN = 100000;
    public static NUKER_ENERGY_CAPACITY = 300000;
    public static NUKER_GHODIUM_CAPACITY = 5000;
    public static NUKE_LAND_TIME = 50000;
    public static NUKE_RANGE = 10;
    NUKE_DAMAGE = {
        0: 10000000,
        2: 5000000
    };

    public static FACTORY_HITS = 1000;
    public static FACTORY_CAPACITY = 50000;

    public static TOMBSTONE_DECAY_PER_PART = 5;
    public static TOMBSTONE_DECAY_POWER_CREEP = 500;

    public static RUIN_DECAY = 500;
    RUIN_DECAY_STRUCTURES = {
        'powerBank': 10
    };

    public static PORTAL_DECAY = 30000;

    public static ORDER_SELL = "sell";
    public static ORDER_BUY = "buy";

    public static MARKET_FEE = 0.05;

    public static MARKET_MAX_ORDERS = 300;
    public static MARKET_ORDER_LIFE_TIME = 1000 * 60 * 60 * 24 * 30;

    public static FLAGS_LIMIT = 10000;

    public static SUBSCRIPTION_TOKEN = "token";
    public static CPU_UNLOCK = "cpuUnlock";
    public static PIXEL = "pixel";
    public static ACCESS_KEY = "accessKey";

    public static PIXEL_CPU_COST = 10000;

    public static PORTAL_UNSTABLE = 10 * 24 * 3600 * 1000;
    public static PORTAL_MIN_TIMEOUT = 12 * 24 * 3600 * 1000;
    public static PORTAL_MAX_TIMEOUT = 22 * 24 * 3600 * 1000;

    public static POWER_BANK_RESPAWN_TIME = 50000;

    public static INVADERS_ENERGY_GOAL = 100000;

    public static SYSTEM_USERNAME = 'Screeps';

    // SIGN_NOVICE_AREA and SIGN_RESPAWN_AREA constants are deprecated, please use SIGN_PLANNED_AREA instead
    public static SIGN_NOVICE_AREA = 'A new Novice or Respawn Area is being planned somewhere in this sector. Please make sure all important rooms are reserved.';
    public static SIGN_RESPAWN_AREA = 'A new Novice or Respawn Area is being planned somewhere in this sector. Please make sure all important rooms are reserved.';
    public static SIGN_PLANNED_AREA = 'A new Novice or Respawn Area is being planned somewhere in this sector. Please make sure all important rooms are reserved.';


    public static EVENT_HEAL_TYPE_MELEE = 1;
    public static EVENT_HEAL_TYPE_RANGED = 2;

    public static POWER_LEVEL_MULTIPLY = 1000;
    public static POWER_LEVEL_POW = 2;
    public static POWER_CREEP_SPAWN_COOLDOWN = 8 * 3600 * 1000;
    public static POWER_CREEP_DELETE_COOLDOWN = 24 * 3600 * 1000;
    public static POWER_CREEP_MAX_LEVEL = 25;
    public static POWER_CREEP_LIFE_TIME = 5000;

    POWER_CLASS = {
        OPERATOR: 'operator'
    };

    public static EFFECT_INVULNERABILITY = 1001;
    public static EFFECT_COLLAPSE_TIMER = 1002;

    public static INVADER_CORE_HITS = 100000;
    INVADER_CORE_CREEP_SPAWN_TIME = {
        0: 0, 1: 0, 2: 6, 3: 3, 4: 2, 5: 1
    };
    public static INVADER_CORE_EXPAND_TIME = { 1: 4000, 2: 3500, 3: 3000, 4: 2500, 5: 2000 };
    public static INVADER_CORE_CONTROLLER_POWER = 2;
    public static INVADER_CORE_CONTROLLER_DOWNGRADE = 5000;
    public static STRONGHOLD_RAMPART_HITS = { 0: 0, 1: 100000, 2: 200000, 3: 500000, 4: 1000000, 5: 2000000 };
    public static STRONGHOLD_DECAY_TICKS = 75000;
};