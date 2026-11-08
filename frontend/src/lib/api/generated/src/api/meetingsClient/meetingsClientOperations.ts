import { parse } from "uri-template";
import { MeetingsClientContext } from "./meetingsClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import {
  jsonCreateMeetingRequestToTransportTransform,
  jsonErrorBodyEnvelopeToApplicationTransform,
  jsonMeetingCreatedBodyToApplicationTransform,
  jsonMeetingListToApplicationTransform,
} from "../../models/internal/serializers.js";
import {
  CreateMeetingRequest,
  type ErrorBodyEnvelope,
  type MeetingCreatedBody,
  type MeetingList,
} from "../../models/models.js";

export interface ListOptions extends OperationOptions {}
/**
 * Предстоящие встречи владельца, без параметров.
 *
 * @param {MeetingsClientContext} client
 * @param {ListOptions} [options]
 */
export async function list(
  client: MeetingsClientContext,
  options?: ListOptions,
): Promise<MeetingList | ErrorBodyEnvelope> {
  const path = parse("/api/meetings").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonMeetingListToApplicationTransform(response.body)!;
  }
  if (+response.status === 500 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorBodyEnvelopeToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface CreateOptions extends OperationOptions {}
/**
 * Запись гостя на свободный слот.
 *
 * @param {MeetingsClientContext} client
 * @param {CreateMeetingRequest} body
 * @param {CreateOptions} [options]
 */
export async function create(
  client: MeetingsClientContext,
  body: CreateMeetingRequest,
  options?: CreateOptions,
): Promise<MeetingCreatedBody | ErrorBodyEnvelope> {
  const path = parse("/api/meetings").expand({});
  const httpRequestOptions = {
    headers: {},body: jsonCreateMeetingRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return jsonMeetingCreatedBodyToApplicationTransform(response.body)!;
  }
  if (+response.status === 400 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorBodyEnvelopeToApplicationTransform(response.body)!;
  }
  if (+response.status === 404 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorBodyEnvelopeToApplicationTransform(response.body)!;
  }
  if (+response.status === 409 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorBodyEnvelopeToApplicationTransform(response.body)!;
  }
  if (+response.status === 500 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorBodyEnvelopeToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
