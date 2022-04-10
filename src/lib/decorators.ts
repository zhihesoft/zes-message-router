import "reflect-metadata";

export const metaHttpMethod = Symbol();
export const metaSecurityMessage = Symbol();

export function security(value: boolean): ClassDecorator {
    return target => {
        Reflect.defineMetadata(metaSecurityMessage, value, target);
    };
}

export function httpMethod(method: "GET" | "POST"): ClassDecorator {
    return target => {
        Reflect.defineMetadata(metaHttpMethod, method, target);
    };
}