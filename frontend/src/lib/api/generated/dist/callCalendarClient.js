import { createCallCalendarClientContext, } from "./api/callCalendarClientContext.js";
import { createMeetingsClientContext, } from "./api/meetingsClient/meetingsClientContext.js";
import { create, list, } from "./api/meetingsClient/meetingsClientOperations.js";
import { createMeetingTypesClientContext, } from "./api/meetingTypesClient/meetingTypesClientContext.js";
import { create as create_2, list as list_2, slots, } from "./api/meetingTypesClient/meetingTypesClientOperations.js";
export class CallCalendarClient {
    #context;
    meetingsClient;
    meetingTypesClient;
    constructor(options) {
        this.#context = createCallCalendarClientContext(options);
        this.meetingsClient = new MeetingsClient(options);
        ;
        this
            .meetingTypesClient = new MeetingTypesClient(options);
    }
}
export class MeetingTypesClient {
    #context;
    constructor(options) {
        this.#context = createMeetingTypesClientContext(options);
    }
    async list(options) {
        return list_2(this.#context, options);
    }
    ;
    async create(body, options) {
        return create_2(this.#context, body, options);
    }
    ;
    async slots(id, options) {
        return slots(this.#context, id, options);
    }
}
export class MeetingsClient {
    #context;
    constructor(options) {
        this.#context = createMeetingsClientContext(options);
    }
    async list(options) {
        return list(this.#context, options);
    }
    ;
    async create(body, options) {
        return create(this.#context, body, options);
    }
}
