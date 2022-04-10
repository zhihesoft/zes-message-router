import { Request } from "express";
import "reflect-metadata";
import { ExpressHost } from "../lib/engine-host-express";
import { MessageRouter } from "../lib/message-router";
import { SecurityGuard } from "../lib/security-guard";
import { SampleProcess } from "./sample-processor";
import express = require("express");
import asset = require("assert");
import http = require("http");
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

const logger = log4js.getLogger("engine-host-express-test");

let securityValue = true;

async function guard(req: Request): Promise<boolean> {
    return securityValue;
}

async function request(path: string, args: any): Promise<string> {

    return new Promise<string>((resolve, reject) => {
        const ps: string[] = [];
        for (const key in args) {
            if (Object.prototype.hasOwnProperty.call(args, key)) {
                const element = args[key];
                ps.push(`${key}=${element}`);
            }
        }
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: "/test" + path + "?" + ps.join("&"),
            method: 'GET'
        };
        const req = http.request(options, res => {
            res.on('data', d => {
                if (res.statusCode != 200) {
                    reject(res.statusCode);
                } else {
                    resolve(d);
                }
            });
        })
        req.on("error", err => {
            console.error(`${err}`);
            reject(err);
        });
        req.end();
    });

}

const expressHost = new ExpressHost(messages, <SecurityGuard>guard);


const app = express();
app.use("/hello", (req, res) => res.send("hello world"));
app.use("/test", expressHost.router);
const svr = app.listen(3000);

describe("engine host of express", () => {
    it("call /test1 should return 1", async () => {
        const ret = await request("/test1", { count: 1 });
        asset.equal(ret, 1, "ret is " + ret);
    });
    it("call test1 should return error", async () => {
        await asset.rejects(request("test1", { count: 2 }));
    });
    it("call /test3/test4 should return 4", async () => {
        const ret = await request("/test3/test4", { count: 4 });
        asset.equal(ret, 4, `ret is ${ret} != 4`);
    });
    it("call /test1 should failed", async () => {
        securityValue = false;
        asset.rejects(request("/test1", { count: 4 }), `ret should not return`);
    });
    it("call /test2 should return 2", async () => {
        securityValue = true;
        const ret = await request("/test2", { count: 2 });
        asset.equal(ret, 2, "ret is " + ret);
    });
    it("close", () => {
        svr.close();
    })
});


