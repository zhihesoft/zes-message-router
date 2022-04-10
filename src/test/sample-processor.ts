import { HttpMessage } from "../lib/decorators";
import { MessageProcessor } from "../lib/message-router";

@HttpMessage({ method: "GET", security: true })
export class SampleProcess implements MessageProcessor {
    async process(args: { count: number }): Promise<number> {
        // console.log("hello world: " + JSON.stringify(args));
        return args.count;
    }
}