import { getLogger, Logger } from "log4js";
import { container } from "tsyringe";
import { metaSecurityMessage } from "./decorators";
import { isMessageProcessor, MessageProcessor, MessageRouter } from "./message-router";

/**
 * Message engine
 */
export class MessageEngine {

    /**
     * constructor
     * @param messages message routers
     */
    public constructor(
        public messages: MessageRouter[],
    ) {
        this.addRouter("", { path: "/", token: messages });
    }

    private handlers: Map<string, MessageProcessor> = new Map()
    private logger: Logger = getLogger(MessageEngine.name);
    private insecurityPaths: string[] = [];

    private addRouter(parentPath: string, router: MessageRouter) {
        const currentPath = this.joinPath(parentPath, router.path);
        if (isMessageProcessor(router.token)) {
            const handle = container.resolve(router.token);
            const security: boolean = Reflect.getMetadata(metaSecurityMessage, router.token) || true;
            if (!security) {
                this.insecurityPaths.push(currentPath);
            }
            this.handlers.set(currentPath, handle);
        } else {
            for (const item of router.token) {
                this.addRouter(currentPath, item);
            }
        }
    }

    /**
     * Get all insecurity paths
     * @returns paths
     */
    public getInsecurityPaths(): string[] {
        return this.insecurityPaths;
    }

    /**
     * Get all paths
     * @returns paths
     */
    public getAllPaths(): string[] {
        const ret: string[] = [];
        for (const item of this.handlers) {
            ret.push(item[0]);
        }
        return ret;
    }

    /**
     * join paths
     * @param path1 path1
     * @param path2 path2
     * @returns combined path
     */
    public joinPath(path1: string, path2: string): string {
        if (path1.endsWith("/") || path2.startsWith("/")) {
            return path1 + path2;
        }
        return path1 + "/" + path2;
    }

    /**
     * Process message
     * @param message message
     * @param args arguments
     * @returns value
     */
    public async process(message: string, args: unknown): Promise<unknown> {
        const handler = this.handlers.get(message);
        if (!handler) {
            const err = new Error(`cannot find handler for message (${message})`);
            this.logger.error(err.message);
            throw err;
        }
        const ret = await handler.process(args);
        return ret;
    }

}