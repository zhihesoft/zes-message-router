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

/**
 * is message processor 
 * @param token 
 * @returns 
 */
export function isMessageProcessor(token: InjectionToken<MessageProcessor> | MessageRouter[]): token is InjectionToken<MessageProcessor> {
    return !Array.isArray(token);
}
