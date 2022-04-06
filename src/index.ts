import { Router } from "express";
import "reflect-metadata";
import { buildExpressRoute, setGuard } from "./lib/build-express-router";
import { MessageRouter } from "./lib/message-router";
import { SecurityGuard } from "./lib/security-guard";

export { MessageProcessor, MessageRouter } from "./lib/message-router";
export { SecurityGuard } from "./lib/security-guard";

export function forExpress(router: MessageRouter, guard: SecurityGuard): Router {
    setGuard(guard);
    const ret = Router();
    buildExpressRoute(ret, router);
    return ret;
}

