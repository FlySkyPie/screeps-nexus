export abstract class Reactions {
    public static H = {
        O: "OH",
        L: "LH",
        K: "KH",
        U: "UH",
        Z: "ZH",
        G: "GH"
    };
    public static O = {
        H: "OH",
        L: "LO",
        K: "KO",
        U: "UO",
        Z: "ZO",
        G: "GO"
    }
    public static Z = {
        K: "ZK",
        H: "ZH",
        O: "ZO"
    }
    public static L = {
        U: "UL",
        H: "LH",
        O: "LO"
    }
    public static K = {
        Z: "ZK",
        H: "KH",
        O: "KO"
    }
    public static G = {
        H: "GH",
        O: "GO"
    }
    public static U = {
        L: "UL",
        H: "UH",
        O: "UO"
    }
    public static OH = {
        UH: "UH2O",
        UO: "UHO2",
        ZH: "ZH2O",
        ZO: "ZHO2",
        KH: "KH2O",
        KO: "KHO2",
        LH: "LH2O",
        LO: "LHO2",
        GH: "GH2O",
        GO: "GHO2"
    }
    public static X = {
        UH2O: "XUH2O",
        UHO2: "XUHO2",
        LH2O: "XLH2O",
        LHO2: "XLHO2",
        KH2O: "XKH2O",
        KHO2: "XKHO2",
        ZH2O: "XZH2O",
        ZHO2: "XZHO2",
        GH2O: "XGH2O",
        GHO2: "XGHO2"
    }
    public static ZK = {
        UL: "G"
    }
    public static UL = {
        ZK: "G"
    }
    public static LH = {
        OH: "LH2O"
    }
    public static ZH = {
        OH: "ZH2O"
    }
    public static GH = {
        OH: "GH2O"
    }
    public static KH = {
        OH: "KH2O"
    }
    public static UH = {
        OH: "UH2O"
    }
    public static LO = {
        OH: "LHO2"
    }
    public static ZO = {
        OH: "ZHO2"
    }
    public static KO = {
        OH: "KHO2"
    }
    public static UO = {
        OH: "UHO2"
    }
    public static GO = {
        OH: "GHO2"
    }
    public static LH2O = {
        X: "XLH2O"
    }
    public static KH2O = {
        X: "XKH2O"
    }
    public static ZH2O = {
        X: "XZH2O"
    }
    public static UH2O = {
        X: "XUH2O"
    }
    public static GH2O = {
        X: "XGH2O"
    }
    public static LHO2 = {
        X: "XLHO2"
    }
    public static UHO2 = {
        X: "XUHO2"
    }
    public static KHO2 = {
        X: "XKHO2"
    }
    public static ZHO2 = {
        X: "XZHO2"
    }
    public static GHO2 = {
        X: "XGHO2"
    }
};