import { type Client, type ClientOptions } from "@typespec/ts-http-runtime";
export interface MeetingsClientContext extends Client {
}
export interface MeetingsClientOptions extends ClientOptions {
    endpoint?: string;
}
export declare function createMeetingsClientContext(options?: MeetingsClientOptions): MeetingsClientContext;
