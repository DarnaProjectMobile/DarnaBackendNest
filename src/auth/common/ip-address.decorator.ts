import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const IpAddress = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest<Request>();

        // Try to get IP from various headers (for proxies/load balancers)
        const forwarded = request.headers['x-forwarded-for'];
        const realIp = request.headers['x-real-ip'];

        if (forwarded) {
            // x-forwarded-for can contain multiple IPs, get the first one
            const ips = (forwarded as string).split(',');
            return ips[0].trim();
        }

        if (realIp) {
            return realIp as string;
        }

        // Fallback to socket remote address
        return request.socket.remoteAddress || 'unknown';
    },
);
