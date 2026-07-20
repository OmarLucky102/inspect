import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseException } from '@shared/exceptions/base.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();

        const isDev = process.env.NODE_ENV === 'development';

        let error = this.normalizeError(exception);

        if (isDev) {
            this.sendErrorDev(error, req, res);
        } else {
            error = this.handleKnownErrors(error, exception);
            this.sendErrorProd(error, req, res);
        }
    }

    // ─── Normalize any exception into a BaseException shape ───────────────────
    private normalizeError(exception: unknown): BaseException {
        if (exception instanceof BaseException) {
            return exception;
        }

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            return new BaseException(exception.message, status);
        }

        // Unknown / programming error
        return new BaseException('Something went very wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // ─── Map Mongoose / JWT errors → BaseException ────────────────────────────
    private handleKnownErrors(error: BaseException, original: unknown): BaseException {
        const err = original as any;

        if (err?.name === 'CastError') {
            return new BaseException(`Invalid ${err.path}: ${err.value}`, HttpStatus.BAD_REQUEST);
        }

        if (err?.code === 11000) {
            const value = Object.values(err.keyValue ?? {})[0];
            return new BaseException(
                `Duplicate field value: "${value}". Please use another value.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        if (err?.name === 'ValidationError') {
            const errors = Object.values(err.errors ?? {}).map((e: any) => e.message);
            return new BaseException(`Invalid input data. ${errors.join('. ')}`, HttpStatus.BAD_REQUEST);
        }

        if (err?.name === 'JsonWebTokenError') {
            return new BaseException('Invalid token. Please log in again!', HttpStatus.UNAUTHORIZED);
        }

        if (err?.name === 'TokenExpiredError') {
            return new BaseException('Your token has expired! Please log in again.', HttpStatus.UNAUTHORIZED);
        }

        return error;
    }

    // ─── Dev response (full details) ──────────────────────────────────────────
    private sendErrorDev(error: BaseException, req: Request, res: Response) {
        res.status(error.getStatus()).json({
            status: error.statusText,
            message: error.message,
            stack: error.stack,
            error,
        });
    }

    // ─── Prod response (safe details) ─────────────────────────────────────────
    private sendErrorProd(error: BaseException, req: Request, res: Response) {
        if (error.isOperational) {
            return res.status(error.getStatus()).json({
                status: error.statusText,
                message: error.message,
            });
        }

        // Programming / unknown error — don't leak details
        this.logger.error('ERROR 💥', error);

        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            message: 'Something went very wrong',
        });
    }
}
