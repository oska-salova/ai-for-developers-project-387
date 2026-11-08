import { MeetingsClientContext } from "./meetingsClientContext.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import { CreateMeetingRequest, type ErrorBodyEnvelope, type MeetingCreatedBody, type MeetingList } from "../../models/models.js";
export interface ListOptions extends OperationOptions {
}
/**
 * Предстоящие встречи владельца, без параметров.
 *
 * @param {MeetingsClientContext} client
 * @param {ListOptions} [options]
 */
export declare function list(client: MeetingsClientContext, options?: ListOptions): Promise<MeetingList | ErrorBodyEnvelope>;
export interface CreateOptions extends OperationOptions {
}
/**
 * Запись гостя на свободный слот.
 *
 * @param {MeetingsClientContext} client
 * @param {CreateMeetingRequest} body
 * @param {CreateOptions} [options]
 */
export declare function create(client: MeetingsClientContext, body: CreateMeetingRequest, options?: CreateOptions): Promise<MeetingCreatedBody | ErrorBodyEnvelope>;
