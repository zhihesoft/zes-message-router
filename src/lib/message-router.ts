import { InjectionToken } from "tsyringe";

/**
 * Router 
 */
export interface MessageRouter {
    path: string;
    token: InjectionToken<MessageProcessor> | MessageRouter[];
}

/**
 * Message processor
 */
export interface MessageProcessor {
    process(args: unknown): Promise<unknown>;
}
