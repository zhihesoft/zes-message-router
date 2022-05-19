import { message } from "../lib/decorators";
import { MessageProcessor } from "../lib/message-processor";

@message("/test1", { security: true })
export class SampleProcess implements MessageProcessor {
    async process(count: number): Promise<number> {
        // console.log("hello world: " + JSON.stringify(args));
        return count;
    }
}

@message("/test3/test4", { security: false })
export class SampleProcessInsecurity implements MessageProcessor {
    async process(count: number): Promise<number> {
        // console.log("hello world: " + JSON.stringify(args));
        return count;
    }
}