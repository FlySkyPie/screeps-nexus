
export abstract class StorageConstants {
    public static STORAGE_PORT = process.env.STORAGE_PORT;

    public static DB_PATH = process.env.DB_PATH;

    public static STORAGE_HOST = process.env.STORAGE_HOST || 'localhost'
};
