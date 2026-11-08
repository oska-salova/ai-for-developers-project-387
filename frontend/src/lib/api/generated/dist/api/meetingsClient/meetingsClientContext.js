import { getClient, } from "@typespec/ts-http-runtime";
export function createMeetingsClientContext(options) {
    const params = {
        endpoint: options?.endpoint ?? "http://localhost:3001"
    };
    const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) => key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })());
    ;
    return getClient(resolvedEndpoint, {
        ...options
    });
}
