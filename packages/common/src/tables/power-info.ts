import { ScreepsConstants } from '../constants/constants';
import { PWRCode } from '../constants/pwr-code';

export const POWER_INFO: any = {
    [PWRCode.PWR_GENERATE_OPS]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        cooldown: 50,
        effect: [1, 2, 4, 6, 8]
    },
    [PWRCode.PWR_OPERATE_SPAWN]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        cooldown: 300,
        duration: 1000,
        range: 3,
        ops: 100,
        effect: [0.9, 0.7, 0.5, 0.35, 0.2]
    },
    [PWRCode.PWR_OPERATE_TOWER]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        cooldown: 10,
        duration: 100,
        range: 3,
        ops: 10,
        effect: [1.1, 1.2, 1.3, 1.4, 1.5]
    },
    [PWRCode.PWR_OPERATE_STORAGE]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        cooldown: 800,
        duration: 1000,
        range: 3,
        ops: 100,
        effect: [500000, 1000000, 2000000, 4000000, 7000000]
    },
    [PWRCode.PWR_OPERATE_LAB]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        cooldown: 50,
        duration: 1000,
        range: 3,
        ops: 10,
        effect: [2, 4, 6, 8, 10]
    },
    [PWRCode.PWR_OPERATE_EXTENSION]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        cooldown: 50,
        range: 3,
        ops: 2,
        effect: [0.2, 0.4, 0.6, 0.8, 1.0]
    },
    [PWRCode.PWR_OPERATE_OBSERVER]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        cooldown: 400,
        duration: [200, 400, 600, 800, 1000],
        range: 3,
        ops: 10,
    },
    [PWRCode.PWR_OPERATE_TERMINAL]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        cooldown: 500,
        duration: 1000,
        range: 3,
        ops: 100,
        effect: [0.9, 0.8, 0.7, 0.6, 0.5]
    },
    [PWRCode.PWR_DISRUPT_SPAWN]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        cooldown: 5,
        range: 20,
        ops: 10,
        duration: [1, 2, 3, 4, 5]
    },
    [PWRCode.PWR_DISRUPT_TOWER]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        cooldown: 0,
        duration: 5,
        range: 50,
        ops: 10,
        effect: [0.9, 0.8, 0.7, 0.6, 0.5],
    },
    [PWRCode.PWR_DISRUPT_SOURCE]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        cooldown: 100,
        range: 3,
        ops: 100,
        duration: [100, 200, 300, 400, 500]
    },
    [PWRCode.PWR_SHIELD]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        effect: [5000, 10000, 15000, 20000, 25000],
        duration: 50,
        cooldown: 20,
        energy: 100,
    },
    [PWRCode.PWR_REGEN_SOURCE]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [10, 11, 12, 14, 22],
        cooldown: 100,
        duration: 300,
        range: 3,
        effect: [50, 100, 150, 200, 250],
        period: 15
    },
    [PWRCode.PWR_REGEN_MINERAL]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [10, 11, 12, 14, 22],
        cooldown: 100,
        duration: 100,
        range: 3,
        effect: [2, 4, 6, 8, 10],
        period: 10
    },
    [PWRCode.PWR_DISRUPT_TERMINAL]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [20, 21, 22, 23, 24],
        cooldown: 8,
        duration: 10,
        range: 50,
        ops: [50, 40, 30, 20, 10]

    },
    [PWRCode.PWR_FORTIFY]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        cooldown: 5,
        range: 3,
        ops: 5,
        duration: [1, 2, 3, 4, 5]
    },
    [PWRCode.PWR_OPERATE_POWER]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [10, 11, 12, 14, 22],
        cooldown: 800,
        range: 3,
        duration: 1000,
        ops: 200,
        effect: [1, 2, 3, 4, 5]
    },
    [PWRCode.PWR_OPERATE_CONTROLLER]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [20, 21, 22, 23, 24],
        cooldown: 800,
        range: 3,
        duration: 1000,
        ops: 200,
        effect: [10, 20, 30, 40, 50]
    },
    [PWRCode.PWR_OPERATE_FACTORY]: {
        className: ScreepsConstants.POWER_CLASS.OPERATOR,
        level: [0, 2, 7, 14, 22],
        cooldown: 800,
        range: 3,
        duration: 1000,
        ops: 100
    },
};
