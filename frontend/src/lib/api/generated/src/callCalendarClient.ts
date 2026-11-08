import {
  type CallCalendarClientContext,
  type CallCalendarClientOptions,
  createCallCalendarClientContext,
} from "./api/callCalendarClientContext.js";
import {
  createMeetingsClientContext,
  type MeetingsClientContext,
  type MeetingsClientOptions,
} from "./api/meetingsClient/meetingsClientContext.js";
import {
  create,
  type CreateOptions,
  list,
  type ListOptions,
} from "./api/meetingsClient/meetingsClientOperations.js";
import {
  createMeetingTypesClientContext,
  type MeetingTypesClientContext,
  type MeetingTypesClientOptions,
} from "./api/meetingTypesClient/meetingTypesClientContext.js";
import {
  create as create_2,
  type CreateOptions as CreateOptions_2,
  list as list_2,
  type ListOptions as ListOptions_2,
  slots,
  type SlotsOptions,
} from "./api/meetingTypesClient/meetingTypesClientOperations.js";
import type {
  CreateMeetingRequest,
  CreateMeetingTypeRequest,
} from "./models/models.js";

export class CallCalendarClient {
  #context: CallCalendarClientContext
  meetingsClient: MeetingsClient;
  meetingTypesClient: MeetingTypesClient
  constructor(options?: CallCalendarClientOptions) {
    this.#context = createCallCalendarClientContext(options);
    this.meetingsClient = new MeetingsClient(options);;this
      .meetingTypesClient = new MeetingTypesClient(options);
  }
}
export class MeetingTypesClient {
  #context: MeetingTypesClientContext
  constructor(options?: MeetingTypesClientOptions) {
    this.#context = createMeetingTypesClientContext(options);

  }
  async list(options?: ListOptions_2) {
    return list_2(this.#context, options);
  };
  async create(body: CreateMeetingTypeRequest, options?: CreateOptions_2) {
    return create_2(this.#context, body, options);
  };
  async slots(id: string, options?: SlotsOptions) {
    return slots(this.#context, id, options);
  }
}
export class MeetingsClient {
  #context: MeetingsClientContext
  constructor(options?: MeetingsClientOptions) {
    this.#context = createMeetingsClientContext(options);

  }
  async list(options?: ListOptions) {
    return list(this.#context, options);
  };
  async create(body: CreateMeetingRequest, options?: CreateOptions) {
    return create(this.#context, body, options);
  }
}
