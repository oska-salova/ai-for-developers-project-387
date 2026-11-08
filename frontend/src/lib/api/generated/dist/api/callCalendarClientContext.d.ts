import { type Client, type ClientOptions } from "@typespec/ts-http-runtime";
export interface CallCalendarClientContext extends Client {
}
export interface CallCalendarClientOptions extends ClientOptions {
    endpoint?: string;
}
export declare function createCallCalendarClientContext(options?: CallCalendarClientOptions): CallCalendarClientContext;
