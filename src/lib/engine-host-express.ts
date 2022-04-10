import { Request, Response, Router } from "express";
import { getLogger } from "log4js";
import { metaHttpMethod } from "./decorators";
import { MessageEngine } from "./message-engine";
import { isMessageProcessor, MessageRouter } from "./message-router";

/**
 * Engine for express
 */
export class ExpressHost {
    constructor(
        messages: MessageRouter[]
    ) {
        this.engine = new MessageEngine(messages);
        const message = { path: "/", token: messages };
        this.installOnRouter("", this.router, message);
    }

    public readonly router = Router();
    public readonly engine: MessageEngine;
    private readonly logger = getLogger(ExpressHost.name);

    private installOnRouter(parentPath: string, router: Router, message: MessageRouter) {
        const token = message.token;
        const currentPath = this.engine.joinPath(parentPath, message.path);
        let routerPath = message.path;
        if (!routerPath.startsWith("/")) {
            routerPath = "/" + routerPath;
        }

        if (isMessageProcessor(token)) {
            const method: string = Reflect.getMetadata(metaHttpMethod, token) || "GET";
            this.logger.debug(`router add ${currentPath}`);
            const handler = this.processor(currentPath);
            switch (method) {
                case "GET":
                    router.get(routerPath, handler);
                    break;
                case "POST":
                    router.post(routerPath, handler);
                    break;
                default:
                    router.use(routerPath, handler);
                    break;
            }
        } else {
            const subRouter = Router();
            router.use(routerPath, subRouter);
            for (const item of token) {
                this.installOnRouter(currentPath, subRouter, item);
            }
        }
    }

    private processor(path: string) {
        return async (req: Request, res: Response) => {
            const args = Object.assign({}, req.query, req.body);
            try {
                const ret = await this.engine?.process(path, args);
                if (ret instanceof Error) {
                    res.status(400).send(ret.message);
                } else if (typeof ret === "string") {
                    res.send(ret);
                } else {
                    res.json(ret);
                }
            } catch (ex) {
                let errmsg = "";
                if (ex instanceof Error) {
                    errmsg = ex.message;
                } else {
                    errmsg = JSON.stringify(ex);
                }
                this.logger.error(`message process ${path} failed: ${errmsg}`);
                res.sendStatus(400);
            }
        }
    }
}
