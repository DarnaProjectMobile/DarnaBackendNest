import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Log the error for debugging
    console.error('🚨 Exception caught by HttpExceptionFilter:', exception);
    if (exception instanceof Error) {
      console.error('🚨 Error message:', exception.message);
      console.error('🚨 Error stack:', exception.stack);
    }

    // Handle multer errors (file upload errors)
    if (exception instanceof Error) {
      const errorMessage = exception.message;
      
      // Check if it's a multer file filter error or multer-related error
      if (
        errorMessage.includes('Seuls les fichiers') ||
        errorMessage.includes('Only image files') ||
        errorMessage.includes('Type de fichier non autorisé') ||
        errorMessage.includes('File too large') ||
        errorMessage.includes('Unexpected field') ||
        errorMessage.includes('LIMIT_FILE_SIZE') ||
        errorMessage.includes('LIMIT_FILE_COUNT') ||
        errorMessage.includes('LIMIT_UNEXPECTED_FILE') ||
        errorMessage.includes('MulterError') ||
        errorMessage.includes('No files') ||
        errorMessage.includes('Aucune image fournie') ||
        errorMessage.includes('Aucun fichier reçu')
      ) {
        status = HttpStatus.BAD_REQUEST;
        message = errorMessage;
      } else if (exception instanceof HttpException) {
        status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || exception.message;
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = errorMessage;
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: Array.isArray(message) ? message : [message],
      error: status === HttpStatus.BAD_REQUEST ? 'Bad Request' : 'Error',
    };

    console.error('🚨 Sending error response:', errorResponse);
    response.status(status).json(errorResponse);
  }
}

