import { httpMethod, security } from "../lib/decorators";
import { MessageProcessor } from "../lib/message-router";

@httpMethod("GET")
@security(true)
export class SampleProcess implements MessageProcessor {
    async process(args: { count: number }): Promise<number> {
        // console.log("hello world: " + JSON.stringify(args));
        return args.count;
    }
}

@httpMethod("GET")
@security(false)
export class SampleProcessInsecurity implements MessageProcessor {
    async process(args: { count: number }): Promise<number> {
        // console.log("hello world: " + JSON.stringify(args));
        return args.count;
    }
}