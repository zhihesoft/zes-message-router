import { MessageProcessor } from "../lib/message-router";

export class SampleProcess implements MessageProcessor {
    async process(args: { count: number }): Promise<number> {
        // console.log("hello world: " + JSON.stringify(args));
        return args.count;
    }
}