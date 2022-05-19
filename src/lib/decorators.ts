import "reflect-metadata";

export const metaOfProcessor = Symbol("meta-processor");

export interface MessageProcessorMeta {
    path: string;
    option?: ProcessorOption;
}

export interface ProcessorOption {
    verb?: "GET" | "POST" | "ANY";
    security?: boolean;
}

export function message(path: string, option?: ProcessorOption): ClassDecorator {
    return target => {
        Reflect.defineMetadata(metaOfProcessor, { path, option }, target);
    }
}
