import "reflect-metadata";
import { MessageEngine } from "../lib/message-engine";
import { MessageRouter } from "../lib/message-router";
import { SampleProcess } from "./sample-processor";
import asset = require("assert");
import log4js = require("log4js");

log4js.configure({
    appenders: { cheese: { type: "console" } },
    categories: { default: { appenders: ["cheese"], level: "error" } }
});

const messages: MessageRouter[] = [
    { path: "test1", token: SampleProcess },
    { path: "test2", token: SampleProcess },
    {
        path: "test3", token: [
            { path: "test4", token: SampleProcess },
            { path: "test5", token: SampleProcess },
        ]
    },
];

const engine: MessageEngine = new MessageEngine(messages);
for (const item of engine.getAllPaths()) {
    console.log(item);
}

describe("message-engine", () => {
    it("engine should have 4 message processors", () => {
        asset.notEqual(engine, null);
        const handles = engine.getAllPaths();
        asset.equal(handles?.length, 4);
    });
    it("call /test1 should return 1", async () => {
        asset.notEqual(engine, null);
        const count = await engine.process("/test1", { count: 1 });
        asset.equal(count, 1, "return code is " + count);
    });
    it("call /test3 should return error", async () => {
        asset.notEqual(engine, null);
        asset.rejects(engine.process("/test3", { count: 3 }), "test 3 is a router, should return error");
    });
    it("call /test3/test4 should return 4", async () => {
        asset.notEqual(engine, null);
        const count = await engine.process("/test3/test4", { count: 4 });
        asset.equal(count, 4, "/test3/test4 should return 4");
    });
});
