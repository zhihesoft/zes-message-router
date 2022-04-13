import { Request, Response, Router } from "express";
import { getLogger } from "log4js";
import { metaHttpMethod } from "./decorators";
import { MessageEngine } from "./message-engine";
import { MessageRouter } from "./message-router";

/**
 * Engine for express
 */
export class ExpressHost {
    constructor(
        messages: MessageRouter[]
    ) {
        this.engine = new MessageEngine(messages);
        this.installRouter();
    }

    public readonly router = Router();
    public readonly engine: MessageEngine;

    private installRouter() {

        const paths = this.engine.getAllPaths();
        for (const item of paths) {
            const token = this.engine.getToken(item);
            if (token) {
                const method: string = Reflect.getMetadata(metaHttpMethod, token) || "GET";
                logger.debug(`add [${method}] ${item} to router`);
                const handler = this.processor(item);
                switch (method) {
                    case "GET":
                        this.router.get(item, handler);
                        break;
                    case "POST":
                        this.router.post(item, handler);
                        break;
                    default:
                        this.router.use(item, handler);
                        break;
                }
            } else {
                logger.warn(`token on ${item} is null`);
            }
        }
    }

    private processor(path: string) {
        return async (req: Request, res: Response) => {
            const args = Object.assign({}, req.query, req.body);

            if (!this.engine) {
                return res.status(400).send("engine is null");
            }

            this.engine.process(path, args).then(ret => {
                if (typeof ret === "string") {
                    res.send(ret);
                } else {
                    res.json(ret);
                }
            }).catch(err => {
                let errmsg = "";
                if (err instanceof Error) {
                    errmsg = err.message;
                } else {
                    errmsg = JSON.stringify(err);
                }
                logger.error(`message process ${path} failed: ${errmsg}`);
                res.status(400).send(errmsg);
            });
        }
    }
}

const logger = getLogger(ExpressHost.name);
