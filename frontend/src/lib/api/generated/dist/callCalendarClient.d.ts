import { type CallCalendarClientOptions } from "./api/callCalendarClientContext.js";
import { type MeetingsClientOptions } from "./api/meetingsClient/meetingsClientContext.js";
import { type CreateOptions, type ListOptions } from "./api/meetingsClient/meetingsClientOperations.js";
import { type MeetingTypesClientOptions } from "./api/meetingTypesClient/meetingTypesClientContext.js";
import { type CreateOptions as CreateOptions_2, type ListOptions as ListOptions_2, type SlotsOptions } from "./api/meetingTypesClient/meetingTypesClientOperations.js";
import type { CreateMeetingRequest, CreateMeetingTypeRequest } from "./models/models.js";
export declare class CallCalendarClient {
    #private;
    meetingsClient: MeetingsClient;
    meetingTypesClient: MeetingTypesClient;
    constructor(options?: CallCalendarClientOptions);
}
export declare class MeetingTypesClient {
    #private;
    constructor(options?: MeetingTypesClientOptions);
    list(options?: ListOptions_2): Promise<import("./models/models.js").ErrorBodyEnvelope | import("./models/models.js").MeetingTypeList>;
    create(body: CreateMeetingTypeRequest, options?: CreateOptions_2): Promise<import("./models/models.js").ErrorBodyEnvelope | import("./models/models.js").MeetingTypeCreatedBody>;
    slots(id: string, options?: SlotsOptions): Promise<import("./models/models.js").ErrorBodyEnvelope | import("./models/models.js").SlotsEnvelope>;
}
export declare class MeetingsClient {
    #private;
    constructor(options?: MeetingsClientOptions);
    list(options?: ListOptions): Promise<import("./models/models.js").MeetingList | import("./models/models.js").ErrorBodyEnvelope>;
    create(body: CreateMeetingRequest, options?: CreateOptions): Promise<import("./models/models.js").ErrorBodyEnvelope | import("./models/models.js").MeetingCreatedBody>;
}
