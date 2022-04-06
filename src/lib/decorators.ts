import "reflect-metadata";

export const metaHttpMethod = Symbol();
export const metaHttpSecurity = Symbol();

/**
 * 
 * @param method HTTP Method, default is GET
 * @param security is security, default is true
 * @returns 
 */
export function HttpMessage(method: "GET" | "POST", security: boolean): ClassDecorator {
    return target => {
        Reflect.defineMetadata(metaHttpMethod, method, target);
        Reflect.defineMetadata(metaHttpSecurity, security, target);
    };
}