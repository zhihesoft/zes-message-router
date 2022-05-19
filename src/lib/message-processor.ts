

export interface MessageProcessor {
    process(...args: unknown[]): Promise<unknown>;
}
