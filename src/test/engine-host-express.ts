/* eslint-disable @typescript-eslint/no-explicit-any */
import "reflect-metadata";
import { InjectionToken } from "tsyringe";
import { ExpressHost } from "../lib/engine-host-express";
import { MessageProcessor } from "../lib/message-processor";
import { SampleProcess, SampleProcessInsecurity } from "./sample-processor";
import express = require("express");
import asset = require("assert");
import http = require("http");
import log4js = require("log4js");

// log4js.configure({
//     appenders: { cheese: { type: "console" } },
//     categories: { default: { appenders: ["cheese"], level: "error" } }
// });

const messages: InjectionToken<MessageProcessor>[] = [
    SampleProcess,
    SampleProcessInsecurity,
];

const logger = log4js.getLogger("engine-host-express-test");

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
            path: path + "?" + ps.join("&"),
            method: 'GET'
        };
        const req = http.request(options, res => {
            res.on('data', d => {
                if (res.statusCode != 200) {
                    reject(res.statusCode);
                } else {
                    logger.info("get " + d);
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

const expressHost = new ExpressHost(messages);


const app = express();
app.use("/", expressHost.router);
app.use((req, res) => {
    res.sendStatus(404);
});
const svr = app.listen(3000);

describe("engine host of express", () => {
    it("call /test1 should return 1", async () => {
        const ret = await request("/test1", { count: 1 });
        asset.equal(ret, 1, "ret is " + ret);
    });
    it("call test1 should return error", async () => {
        asset.rejects(request("test1", { count: 2 }));
    });
    it("call /test3/test4 should return 4", async () => {
        const ret = await request("/test3/test4", { count: 4 });
        asset.equal(ret, 4, `ret is ${ret} != 4`);
    });
    it("call /test1/test2 should failed", async () => {
        asset.rejects(request("/test1/test2", { count: 4 }), `ret should not return`);
    });
    it("close", () => {
        svr.close();
    })
});


