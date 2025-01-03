import winston from 'winston';

export const logger = winston.createLogger({
    transports: [
        new winston.transports.File({
            level: 'debug',
            filename: 'debug.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
            )
        }),
    ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV === 'development') {
    logger.add(new winston.transports.Console({
        level: 'debug',
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
} else {
    logger.add(new winston.transports.Console({
        level: 'info',
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}