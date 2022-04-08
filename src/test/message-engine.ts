import "reflect-metadata";
import { MessageEngine } from "../lib/message-engine";
import { MessageRouter } from "../lib/message-router";
import { SampleProcess } from "./sample-processor";
import asset = require("assert");


const messages: MessageRouter = {
    path: "/",
    token: [
        { path: "test1", token: SampleProcess },
        { path: "test2", token: SampleProcess },
        {
            path: "test3", token: [
                { path: "test4", token: SampleProcess },
                { path: "test5", token: SampleProcess },
            ]
        },
    ]
}

const engine: MessageEngine = new MessageEngine(messages);

describe("message-engine", () => {
    it("engine should have 4 message processors", () => {
        asset.notEqual(engine, null);
        const handles = engine.printHandlers();
        asset.equal(handles?.length, 4);
    });
    it("call /test1 should return 1", async () => {
        asset.notEqual(engine, null);
        const count = await engine.process("/test1", { count: 1 });
        asset.equal(count, 1, "return code is " + count);
    });
    it("call /test3 should return error", async () => {
        asset.notEqual(engine, null);
        const count = await engine.process("/test3", { count: 3 });
        asset.ok(count instanceof Error, "test 3 is a router, should return error");
    });
    it("call /test3/test4 should return 4", async () => {
        asset.notEqual(engine, null);
        const count = await engine.process("/test3/test4", { count: 4 });
        asset.equal(count, 4, "/test3/test4 should return 4");
    });
});
