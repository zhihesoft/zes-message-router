import { getLogger, Logger } from "log4js";
import { container } from "tsyringe";
import { isMessageProcessor, MessageProcessor, MessageRouter } from "./message-router";

export class MessageEngine {

    public constructor(
        public messages: MessageRouter[],
    ) {
        this.addRouter("", { path: "/", token: messages });
    }

    private handlers: Map<string, MessageProcessor> = new Map()
    private logger: Logger = getLogger(MessageEngine.name);

    private addRouter(parentPath: string, router: MessageRouter) {
        const currentPath = this.joinPath(parentPath, router.path);
        if (isMessageProcessor(router.token)) {
            this.handlers.set(currentPath, container.resolve(router.token));
        } else {
            for (const item of router.token) {
                this.addRouter(currentPath, item);
            }
        }
    }

    public joinPath(path1: string, path2: string): string {
        if (path1.endsWith("/") || path2.startsWith("/")) {
            return path1 + path2;
        }
        return path1 + "/" + path2;
    }

    public async process(message: string, args: unknown): Promise<unknown> {
        this.logger.debug(`process message (${message}) with args: ${JSON.stringify(args)}`);
        const handler = this.handlers.get(message);
        if (!handler) {
            const err = new Error(`cannot find handler for message (${message})`);
            this.logger.error(err.message);
            return err;
        }
        const ret = await handler.process(args);
        this.logger.debug(`process message (${message}) return: ${JSON.stringify(ret)}`);
        return ret;
    }

    public printHandlers(): string[] {
        const ret: string[] = [];
        for (const item of this.handlers) {
            ret.push(item[0]);
        }
        return ret;
    }
}