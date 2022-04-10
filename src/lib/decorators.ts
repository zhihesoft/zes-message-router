import "reflect-metadata";

export const metaHttpMethod = Symbol();
export const metaHttpSecurity = Symbol();

/**
 * 
 * @param method HTTP Method, default is GET
 * @param security is security, default is true
 * @returns 
 */
export function HttpMessage(data: { method: "GET" | "POST", security: boolean }): ClassDecorator {
    return target => {
        Reflect.defineMetadata(metaHttpMethod, data.method, target);
        Reflect.defineMetadata(metaHttpSecurity, data.security, target);
    };
}