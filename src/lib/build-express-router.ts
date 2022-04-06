import { Router, Request, Response } from "express";
import { container, InjectionToken } from "tsyringe";
import { metaHttpMethod, metaHttpSecurity } from "./decorators";
import { MessageProcessor, MessageRouter } from "./message-router";
import { SecurityGuard } from "./security-guard";

export let httpGuard: SecurityGuard | null = null;

export function setGuard(guard: SecurityGuard) {
    httpGuard = guard;
}

export function buildExpressRoute(parent: Router, dispatcher: MessageRouter) {
    const router = Router();
    if (Array.isArray(dispatcher.token)) {
        for (const child of dispatcher.token) {
            buildExpressRoute(router, child);
        }
        parent.use(dispatcher.path, router);
    } else {
        const msg = container.resolve(dispatcher.token);
        const method: string = Reflect.getMetadata(metaHttpMethod, msg) || "GET";
        const security: boolean = Reflect.getMetadata(metaHttpSecurity, msg) || true;

        if (security) {
            router.use(dispatcher.path, async (req, res, next) => {
                if (httpGuard != null) {
                    const pass = await httpGuard(req);
                    if (!pass) {
                        res.status(401).send();
                    } else {
                        next("route");
                    }
                } else {
                    res.status(401).send("no guard found");
                }
            });
        }

        const process = async (req: Request, res: Response) => {
            const proc = container.resolve(dispatcher.token as InjectionToken<MessageProcessor>);
            const args = Object.assign({}, req.query, req.body);
            try {
                const ret = await proc.process(args);
                if (typeof ret === "string") {
                    res.send(ret)
                } else {
                    res.json(ret);
                }
            } catch (err) {
                res.status(400).json({ err });
            }
        };

        switch (method) {
            case "GET":
                router.get(dispatcher.path, process);
                break;
            case "POST":
                router.post(dispatcher.path, process);
                break;
            default:
                router.use(dispatcher.path, process);
                break;
        }
    }
}