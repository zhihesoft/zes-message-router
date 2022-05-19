/* eslint-disable @typescript-eslint/no-explicit-any */
import { getLogger, Logger } from "log4js";
import "reflect-metadata";
import { container, InjectionToken } from "tsyringe";
import { MessageProcessorMeta, metaOfProcessor } from "./decorators";
import { MessageProcessor } from "./message-processor";

export interface ArgumentProvider {
    (args: unknown): unknown;
}

/**
 * Message engine
 */
export class MessageEngine {

    public constructor(
        private tokens: InjectionToken<MessageProcessor>[]
    ) {
        for (const token of this.tokens) {
            const meta: MessageProcessorMeta = Reflect.getMetadata(metaOfProcessor, token);
            if (this.handlers.has(meta.path)) {
                logger.error(`path (${meta.path}) already existed`);
                continue;
            }
            const instance = container.resolve(token);
            this.handlers.set(meta.path, instance);
            this.metas.set(meta.path, meta);
            this.allPaths.push(meta.path);
            if (meta.option?.security != undefined && !meta.option.security) {
                this.insecurityPaths.push(meta.path);
            }
        }
    }

    private handlers: Map<string, MessageProcessor> = new Map()
    private metas: Map<string, MessageProcessorMeta> = new Map();
    private insecurityPaths: string[] = [];
    private allPaths: string[] = [];
    private argumentProviders: Map<string, ArgumentProvider> = new Map();
    private argumentNames: Map<string, string[]> = new Map();

    public registerArgument(name: string, provider: ArgumentProvider) {

        this.argumentProviders.set(name, provider);
    }

    /**
     * Get all insecurity paths
     * @returns paths
     */
    public getInsecurityPaths(): string[] { return this.insecurityPaths; }

    /**
     * Get all paths
     * @returns paths
     */
    public getAllPaths(): string[] { return this.allPaths; }

    public getMeta(path: string): MessageProcessorMeta {
        const ret = this.metas.get(path);
        if (!ret) {
            throw new Error(`cannot find meta of (${path})`);
        }
        return ret;
    }

    /**
     * Process message
     * @param path message
     * @param args arguments
     * @returns value
     */
    public async process(path: string, args: unknown): Promise<unknown> {
        const handler = this.handlers.get(path);
        if (!handler) {
            const err = new Error(`cannot find handler for path (${path})`);
            logger.error(err.message);
            throw err;
        }

        let ps: any[] = this.getArgumentNames(path, handler.process.toString());
        ps = ps.map(i => this.getArgumentValue(i, args));
        return handler.process(...ps)
            .catch(err => {
                logger.error(`message (${path}) process failed: ${err}`);
                return Promise.reject(err);
            });
    }

    private getArgumentValue(name: string, args: unknown): unknown {
        const data = <any>args;
        if (data[name]) {
            return data[name];
        }
        if (this.argumentProviders.has(name)) {
            const fun = this.argumentProviders.get(name);
            if (fun) {
                return fun(args);
            }
        }
        return undefined;
    }

    private getArgumentNames(path: string, fnStr: string): string[] {
        if (this.argumentNames.has(path)) {
            const ret = this.argumentNames.get(path);
            if (!ret) {
                throw new Error(`invalid names of ${path}`);
            }
            return ret;
        }

        const ps = getParameterNames(fnStr);
        this.argumentNames.set(path, ps);
        return ps;
    }
}


const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;

function getParameterNames(fnStr: string) {
    // const fnStr = func.toString().replace(STRIP_COMMENTS, '');
    fnStr = fnStr.replace(STRIP_COMMENTS, '');
    const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    return result || [];
}

const logger: Logger = getLogger(MessageEngine.name);
