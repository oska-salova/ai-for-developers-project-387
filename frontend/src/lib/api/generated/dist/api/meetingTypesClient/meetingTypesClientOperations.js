import { parse } from "uri-template";
import { createRestError } from "../../helpers/error.js";
import { jsonCreateMeetingTypeRequestToTransportTransform, jsonErrorBodyEnvelopeToApplicationTransform, jsonMeetingTypeCreatedBodyToApplicationTransform, jsonMeetingTypeListToApplicationTransform, jsonSlotsEnvelopeToApplicationTransform, } from "../../models/internal/serializers.js";
/**
 * Список типов встреч владельца.
 *
 * @param {MeetingTypesClientContext} client
 * @param {ListOptions} [options]
 */
export async function list(client, options) {
    const path = parse("/api/meeting-types").expand({});
    const httpRequestOptions = {
        headers: {},
    };
    const response = await client.pathUnchecked(path).get(httpRequestOptions);
    if (typeof options?.operationOptions?.onResponse === "function") {
        options?.operationOptions?.onResponse(response);
    }
    if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
        return jsonMeetingTypeListToApplicationTransform(response.body);
    }
    if (+response.status === 500 && response.headers["content-type"]?.includes("application/json")) {
        return jsonErrorBodyEnvelopeToApplicationTransform(response.body);
    }
    throw createRestError(response);
}
;
/**
 * Создание типа встречи.
 *
 * @param {MeetingTypesClientContext} client
 * @param {CreateMeetingTypeRequest} body
 * @param {CreateOptions} [options]
 */
export async function create(client, body, options) {
    const path = parse("/api/meeting-types").expand({});
    const httpRequestOptions = {
        headers: {}, body: jsonCreateMeetingTypeRequestToTransportTransform(body),
    };
    const response = await client.pathUnchecked(path).post(httpRequestOptions);
    if (typeof options?.operationOptions?.onResponse === "function") {
        options?.operationOptions?.onResponse(response);
    }
    if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
        return jsonMeetingTypeCreatedBodyToApplicationTransform(response.body);
    }
    if (+response.status === 400 && response.headers["content-type"]?.includes("application/json")) {
        return jsonErrorBodyEnvelopeToApplicationTransform(response.body);
    }
    if (+response.status === 500 && response.headers["content-type"]?.includes("application/json")) {
        return jsonErrorBodyEnvelopeToApplicationTransform(response.body);
    }
    throw createRestError(response);
}
;
/**
 * Полная сетка слотов типа встречи на окно записи.
 *
 * @param {MeetingTypesClientContext} client
 * @param {string} id
 * @param {SlotsOptions} [options]
 */
export async function slots(client, id, options) {
    const path = parse("/api/meeting-types/{id}/slots").expand({
        id: id
    });
    const httpRequestOptions = {
        headers: {},
    };
    const response = await client.pathUnchecked(path).get(httpRequestOptions);
    if (typeof options?.operationOptions?.onResponse === "function") {
        options?.operationOptions?.onResponse(response);
    }
    if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
        return jsonSlotsEnvelopeToApplicationTransform(response.body);
    }
    if (+response.status === 404 && response.headers["content-type"]?.includes("application/json")) {
        return jsonErrorBodyEnvelopeToApplicationTransform(response.body);
    }
    if (+response.status === 500 && response.headers["content-type"]?.includes("application/json")) {
        return jsonErrorBodyEnvelopeToApplicationTransform(response.body);
    }
    throw createRestError(response);
}
;
