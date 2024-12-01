import { BodyParts } from "../constants/body-parts"
import { ColorCode } from "../constants/color-code"
import { IntershardResources } from "../constants/intershard-resources";
import { Resource } from "../constants/resource"

export abstract class ListItems {
    public static readonly BODYPARTS_ALL = [
        BodyParts.MOVE,
        BodyParts.WORK,
        BodyParts.CARRY,
        BodyParts.ATTACK,
        BodyParts.RANGED_ATTACK,
        BodyParts.TOUGH,
        BodyParts.HEAL,
        BodyParts.CLAIM
    ];

    public static readonly RESOURCES_ALL = [
        Resource.RESOURCE_ENERGY,
        Resource.RESOURCE_POWER,

        Resource.RESOURCE_HYDROGEN,
        Resource.RESOURCE_OXYGEN,
        Resource.RESOURCE_UTRIUM,
        Resource.RESOURCE_KEANIUM,
        Resource.RESOURCE_LEMERGIUM,
        Resource.RESOURCE_ZYNTHIUM,
        Resource.RESOURCE_CATALYST,
        Resource.RESOURCE_GHODIUM,

        Resource.RESOURCE_HYDROXIDE,
        Resource.RESOURCE_ZYNTHIUM_KEANITE,
        Resource.RESOURCE_UTRIUM_LEMERGITE,

        Resource.RESOURCE_UTRIUM_HYDRIDE,
        Resource.RESOURCE_UTRIUM_OXIDE,
        Resource.RESOURCE_KEANIUM_HYDRIDE,
        Resource.RESOURCE_KEANIUM_OXIDE,
        Resource.RESOURCE_LEMERGIUM_HYDRIDE,
        Resource.RESOURCE_LEMERGIUM_OXIDE,
        Resource.RESOURCE_ZYNTHIUM_HYDRIDE,
        Resource.RESOURCE_ZYNTHIUM_OXIDE,
        Resource.RESOURCE_GHODIUM_HYDRIDE,
        Resource.RESOURCE_GHODIUM_OXIDE,

        Resource.RESOURCE_UTRIUM_ACID,
        Resource.RESOURCE_UTRIUM_ALKALIDE,
        Resource.RESOURCE_KEANIUM_ACID,
        Resource.RESOURCE_KEANIUM_ALKALIDE,
        Resource.RESOURCE_LEMERGIUM_ACID,
        Resource.RESOURCE_LEMERGIUM_ALKALIDE,
        Resource.RESOURCE_ZYNTHIUM_ACID,
        Resource.RESOURCE_ZYNTHIUM_ALKALIDE,
        Resource.RESOURCE_GHODIUM_ACID,
        Resource.RESOURCE_GHODIUM_ALKALIDE,

        Resource.RESOURCE_CATALYZED_UTRIUM_ACID,
        Resource.RESOURCE_CATALYZED_UTRIUM_ALKALIDE,
        Resource.RESOURCE_CATALYZED_KEANIUM_ACID,
        Resource.RESOURCE_CATALYZED_KEANIUM_ALKALIDE,
        Resource.RESOURCE_CATALYZED_LEMERGIUM_ACID,
        Resource.RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,
        Resource.RESOURCE_CATALYZED_ZYNTHIUM_ACID,
        Resource.RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
        Resource.RESOURCE_CATALYZED_GHODIUM_ACID,
        Resource.RESOURCE_CATALYZED_GHODIUM_ALKALIDE,

        Resource.RESOURCE_OPS,

        Resource.RESOURCE_SILICON,
        Resource.RESOURCE_METAL,
        Resource.RESOURCE_BIOMASS,
        Resource.RESOURCE_MIST,

        Resource.RESOURCE_UTRIUM_BAR,
        Resource.RESOURCE_LEMERGIUM_BAR,
        Resource.RESOURCE_ZYNTHIUM_BAR,
        Resource.RESOURCE_KEANIUM_BAR,
        Resource.RESOURCE_GHODIUM_MELT,
        Resource.RESOURCE_OXIDANT,
        Resource.RESOURCE_REDUCTANT,
        Resource.RESOURCE_PURIFIER,
        Resource.RESOURCE_BATTERY,
        Resource.RESOURCE_COMPOSITE,
        Resource.RESOURCE_CRYSTAL,
        Resource.RESOURCE_LIQUID,

        Resource.RESOURCE_WIRE,
        Resource.RESOURCE_SWITCH,
        Resource.RESOURCE_TRANSISTOR,
        Resource.RESOURCE_MICROCHIP,
        Resource.RESOURCE_CIRCUIT,
        Resource.RESOURCE_DEVICE,

        Resource.RESOURCE_CELL,
        Resource.RESOURCE_PHLEGM,
        Resource.RESOURCE_TISSUE,
        Resource.RESOURCE_MUSCLE,
        Resource.RESOURCE_ORGANOID,
        Resource.RESOURCE_ORGANISM,

        Resource.RESOURCE_ALLOY,
        Resource.RESOURCE_TUBE,
        Resource.RESOURCE_FIXTURES,
        Resource.RESOURCE_FRAME,
        Resource.RESOURCE_HYDRAULICS,
        Resource.RESOURCE_MACHINE,

        Resource.RESOURCE_CONDENSATE,
        Resource.RESOURCE_CONCENTRATE,
        Resource.RESOURCE_EXTRACT,
        Resource.RESOURCE_SPIRIT,
        Resource.RESOURCE_EMANATION,
        Resource.RESOURCE_ESSENCE
    ];

    public static readonly COLORS_ALL = [
        ColorCode.COLOR_RED,
        ColorCode.COLOR_PURPLE,
        ColorCode.COLOR_BLUE,
        ColorCode.COLOR_CYAN,
        ColorCode.COLOR_GREEN,
        ColorCode.COLOR_YELLOW,
        ColorCode.COLOR_ORANGE,
        ColorCode.COLOR_BROWN,
        ColorCode.COLOR_GREY,
        ColorCode.COLOR_WHITE
    ];


    public static readonly INTERSHARD_RESOURCES = [
        IntershardResources.SUBSCRIPTION_TOKEN,
        IntershardResources.CPU_UNLOCK,
        IntershardResources.PIXEL,
        IntershardResources.ACCESS_KEY
    ]
};
