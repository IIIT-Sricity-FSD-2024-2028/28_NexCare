import { OnApplicationShutdown } from '@nestjs/common';
export declare class LoggingModule implements OnApplicationShutdown {
    onApplicationShutdown(signal?: string): void;
}
