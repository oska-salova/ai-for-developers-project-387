import { type Client, type ClientOptions } from "@typespec/ts-http-runtime";
export interface MeetingTypesClientContext extends Client {
}
export interface MeetingTypesClientOptions extends ClientOptions {
    endpoint?: string;
}
export declare function createMeetingTypesClientContext(options?: MeetingTypesClientOptions): MeetingTypesClientContext;
