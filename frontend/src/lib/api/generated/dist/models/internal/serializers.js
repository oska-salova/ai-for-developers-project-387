export function decodeBase64(value) {
    if (!value) {
        return value;
    }
    // Normalize Base64URL to Base64
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
        .padEnd(value.length + (4 - (value.length % 4)) % 4, '=');
    return new Uint8Array(Buffer.from(base64, 'base64'));
}
export function encodeUint8Array(value, encoding) {
    if (!value) {
        return value;
    }
    return Buffer.from(value).toString(encoding);
}
export function dateDeserializer(date) {
    if (!date) {
        return date;
    }
    return new Date(date);
}
export function dateRfc7231Deserializer(date) {
    if (!date) {
        return date;
    }
    return new Date(date);
}
export function dateRfc3339Serializer(date) {
    if (!date) {
        return date;
    }
    return date.toISOString();
}
export function dateRfc7231Serializer(date) {
    if (!date) {
        return date;
    }
    return date.toUTCString();
}
export function dateUnixTimestampSerializer(date) {
    if (!date) {
        return date;
    }
    return Math.floor(date.getTime() / 1000);
}
export function dateUnixTimestampDeserializer(date) {
    if (!date) {
        return date;
    }
    return new Date(date * 1000);
}
export function createPayloadToTransport(payload) {
    return jsonCreateMeetingTypeRequestToTransportTransform(payload);
}
export function createPayloadToTransport_2(payload) {
    return jsonCreateMeetingRequestToTransportTransform(payload);
}
export function jsonMeetingListToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        meetings: jsonArrayMeetingToTransportTransform(input_.meetings)
    };
}
export function jsonMeetingListToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        meetings: jsonArrayMeetingToApplicationTransform(input_.meetings)
    };
}
export function jsonArrayMeetingToTransportTransform(items_) {
    if (!items_) {
        return items_;
    }
    const _transformedArray = [];
    for (const item of items_ ?? []) {
        const transformedItem = jsonMeetingToTransportTransform(item);
        _transformedArray.push(transformedItem);
    }
    return _transformedArray;
}
export function jsonArrayMeetingToApplicationTransform(items_) {
    if (!items_) {
        return items_;
    }
    const _transformedArray = [];
    for (const item of items_ ?? []) {
        const transformedItem = jsonMeetingToApplicationTransform(item);
        _transformedArray.push(transformedItem);
    }
    return _transformedArray;
}
export function jsonMeetingToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        id: input_.id, start: input_.start, guestName: input_.guestName, guestEmail: input_.guestEmail, meetingType: jsonMeetingTypeSummaryToTransportTransform(input_.meetingType)
    };
}
export function jsonMeetingToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        id: input_.id, start: input_.start, guestName: input_.guestName, guestEmail: input_.guestEmail, meetingType: jsonMeetingTypeSummaryToApplicationTransform(input_.meetingType)
    };
}
export function jsonMeetingTypeSummaryToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        id: input_.id, name: input_.name, durationMinutes: input_.durationMinutes
    };
}
export function jsonMeetingTypeSummaryToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        id: input_.id, name: input_.name, durationMinutes: input_.durationMinutes
    };
}
export function jsonErrorBodyEnvelopeToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        error: jsonErrorBodyToTransportTransform(input_.error)
    };
}
export function jsonErrorBodyEnvelopeToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        error: jsonErrorBodyToApplicationTransform(input_.error)
    };
}
export function jsonErrorBodyToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        code: input_.code, message: input_.message, fields: jsonArrayErrorFieldToTransportTransform(input_.fields)
    };
}
export function jsonErrorBodyToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        code: input_.code, message: input_.message, fields: jsonArrayErrorFieldToApplicationTransform(input_.fields)
    };
}
export function jsonArrayErrorFieldToTransportTransform(items_) {
    if (!items_) {
        return items_;
    }
    const _transformedArray = [];
    for (const item of items_ ?? []) {
        const transformedItem = jsonErrorFieldToTransportTransform(item);
        _transformedArray.push(transformedItem);
    }
    return _transformedArray;
}
export function jsonArrayErrorFieldToApplicationTransform(items_) {
    if (!items_) {
        return items_;
    }
    const _transformedArray = [];
    for (const item of items_ ?? []) {
        const transformedItem = jsonErrorFieldToApplicationTransform(item);
        _transformedArray.push(transformedItem);
    }
    return _transformedArray;
}
export function jsonErrorFieldToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        field: input_.field, message: input_.message
    };
}
export function jsonErrorFieldToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        field: input_.field, message: input_.message
    };
}
export function jsonCreateMeetingRequestToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        meetingTypeId: input_.meetingTypeId, start: input_.start, guestName: input_.guestName, guestEmail: input_.guestEmail
    };
}
export function jsonCreateMeetingRequestToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        meetingTypeId: input_.meetingTypeId, start: input_.start, guestName: input_.guestName, guestEmail: input_.guestEmail
    };
}
export function jsonMeetingCreatedBodyToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        meeting: jsonMeetingToTransportTransform(input_.meeting)
    };
}
export function jsonMeetingCreatedBodyToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        meeting: jsonMeetingToApplicationTransform(input_.meeting)
    };
}
export function jsonMeetingTypeListToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        meetingTypes: jsonArrayMeetingTypeToTransportTransform(input_.meetingTypes)
    };
}
export function jsonMeetingTypeListToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        meetingTypes: jsonArrayMeetingTypeToApplicationTransform(input_.meetingTypes)
    };
}
export function jsonArrayMeetingTypeToTransportTransform(items_) {
    if (!items_) {
        return items_;
    }
    const _transformedArray = [];
    for (const item of items_ ?? []) {
        const transformedItem = jsonMeetingTypeToTransportTransform(item);
        _transformedArray.push(transformedItem);
    }
    return _transformedArray;
}
export function jsonArrayMeetingTypeToApplicationTransform(items_) {
    if (!items_) {
        return items_;
    }
    const _transformedArray = [];
    for (const item of items_ ?? []) {
        const transformedItem = jsonMeetingTypeToApplicationTransform(item);
        _transformedArray.push(transformedItem);
    }
    return _transformedArray;
}
export function jsonMeetingTypeToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        id: input_.id, name: input_.name, description: input_.description, durationMinutes: input_.durationMinutes
    };
}
export function jsonMeetingTypeToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        id: input_.id, name: input_.name, description: input_.description, durationMinutes: input_.durationMinutes
    };
}
export function jsonCreateMeetingTypeRequestToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        name: input_.name, description: input_.description, durationMinutes: input_.durationMinutes
    };
}
export function jsonCreateMeetingTypeRequestToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        name: input_.name, description: input_.description, durationMinutes: input_.durationMinutes
    };
}
export function jsonMeetingTypeCreatedBodyToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        meetingType: jsonMeetingTypeToTransportTransform(input_.meetingType)
    };
}
export function jsonMeetingTypeCreatedBodyToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        meetingType: jsonMeetingTypeToApplicationTransform(input_.meetingType)
    };
}
export function jsonSlotsEnvelopeToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        window: jsonSlotWindowToTransportTransform(input_.window), timezone: input_.timezone, days: jsonArraySlotDayToTransportTransform(input_.days)
    };
}
export function jsonSlotsEnvelopeToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        window: jsonSlotWindowToApplicationTransform(input_.window), timezone: input_.timezone, days: jsonArraySlotDayToApplicationTransform(input_.days)
    };
}
export function jsonSlotWindowToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        start: input_.start, end: input_.end
    };
}
export function jsonSlotWindowToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        start: input_.start, end: input_.end
    };
}
export function jsonArraySlotDayToTransportTransform(items_) {
    if (!items_) {
        return items_;
    }
    const _transformedArray = [];
    for (const item of items_ ?? []) {
        const transformedItem = jsonSlotDayToTransportTransform(item);
        _transformedArray.push(transformedItem);
    }
    return _transformedArray;
}
export function jsonArraySlotDayToApplicationTransform(items_) {
    if (!items_) {
        return items_;
    }
    const _transformedArray = [];
    for (const item of items_ ?? []) {
        const transformedItem = jsonSlotDayToApplicationTransform(item);
        _transformedArray.push(transformedItem);
    }
    return _transformedArray;
}
export function jsonSlotDayToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        date: input_.date, slots: jsonArraySlotToTransportTransform(input_.slots)
    };
}
export function jsonSlotDayToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        date: input_.date, slots: jsonArraySlotToApplicationTransform(input_.slots)
    };
}
export function jsonArraySlotToTransportTransform(items_) {
    if (!items_) {
        return items_;
    }
    const _transformedArray = [];
    for (const item of items_ ?? []) {
        const transformedItem = jsonSlotToTransportTransform(item);
        _transformedArray.push(transformedItem);
    }
    return _transformedArray;
}
export function jsonArraySlotToApplicationTransform(items_) {
    if (!items_) {
        return items_;
    }
    const _transformedArray = [];
    for (const item of items_ ?? []) {
        const transformedItem = jsonSlotToApplicationTransform(item);
        _transformedArray.push(transformedItem);
    }
    return _transformedArray;
}
export function jsonSlotToTransportTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        start: input_.start, available: input_.available
    };
}
export function jsonSlotToApplicationTransform(input_) {
    if (!input_) {
        return input_;
    }
    return {
        start: input_.start, available: input_.available
    };
}
