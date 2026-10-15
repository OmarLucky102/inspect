import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

const isPretty =
  process.env.NODE_ENV !== 'production' || process.env.LOG_PRETTY === 'true';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: isPretty ? 'debug' : 'info',
        transport: isPretty
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'SYS:HH:MM:ss',
                ignore: 'pid,hostname,req,res,responseTime',
              },
            }
          : undefined,
        autoLogging: {
          ignore: (req) => {
            const url = req.url || '';
            return url.includes('/health') || url.includes('/favicon.ico');
          },
        },
        customLogLevel: (_req, res, err) => {
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
        customSuccessMessage: (req, res, responseTime) => {
          return `[HTTP] ${req.method} ${req.url} -> ${res.statusCode} (${Math.round(responseTime)}ms)`;
        },
        customErrorMessage: (req, res, err) => {
          return `[HTTP] ${req.method} ${req.url} -> ${res.statusCode} - ${err.message}`;
        },
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie'],
          censor: '***',
        },
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class AppLoggerModule {}
