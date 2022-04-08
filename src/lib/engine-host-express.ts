import { Request, Response, Router } from "express";
import { getLogger } from "log4js";
import { metaHttpMethod, metaHttpSecurity } from "./decorators";
import { MessageEngine } from "./message-engine";
import { isMessageProcessor, MessageRouter } from "./message-router";
import { SecurityGuard } from "./security-guard";

/**
 * Engine for express
 */
export class ExpressHost {
    constructor(
        messages: MessageRouter,
        private guard: SecurityGuard
    ) {
        this.engine = new MessageEngine(messages);
        this.installOnRouter("", this.router, messages);
    }

    public readonly router = Router();
    private readonly engine: MessageEngine;
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
            const security: boolean = Reflect.getMetadata(metaHttpSecurity, token) || true;
            const handler = this.processor(currentPath, security);
            console.log(`router use ${routerPath}`);
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
            console.log(`router use ${routerPath}`)
            for (const item of token) {
                this.installOnRouter(currentPath, subRouter, item);
            }
        }
    }

    private processor(path: string, security: boolean) {
        return async (req: Request, res: Response) => {
            if (security) {
                if (this.guard != null) {
                    const guard = await this.guard(req)
                    if (!guard) {
                        return res.sendStatus(401);
                    }
                } else {
                    this.logger.error(`cannot find security guard`);
                    return res.sendStatus(401);
                }
            }

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
                this.logger.error(`message process ${path} failed: ${JSON.stringify(ex)}`);
                res.status(400);
            }
        }
    }
}
