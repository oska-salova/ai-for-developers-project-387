import type {
  CreateMeetingRequest,
  CreateMeetingTypeRequest,
  ErrorBody,
  ErrorBodyEnvelope,
  ErrorField,
  Meeting,
  MeetingCreatedBody,
  MeetingList,
  MeetingType,
  MeetingTypeCreatedBody,
  MeetingTypeList,
  MeetingTypeSummary,
  Slot,
  SlotDay,
  SlotsEnvelope,
  SlotWindow,
} from "../models.js";

export function decodeBase64(value: string): Uint8Array | undefined {
  if(!value) {
    return value as any;
  }
  // Normalize Base64URL to Base64
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(value.length + (4 - (value.length % 4)) % 4, '=');

  return new Uint8Array(Buffer.from(base64, 'base64'));
}export function encodeUint8Array(
  value: Uint8Array | undefined | null,
  encoding: BufferEncoding,
): string | undefined {
  if (!value) {
    return value as any;
  }
  return Buffer.from(value).toString(encoding);
}export function dateDeserializer(date?: string | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date);
}export function dateRfc7231Deserializer(date?: string | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date);
}export function dateRfc3339Serializer(date?: Date | null): string {
  if (!date) {
    return date as any
  }

  return date.toISOString();
}export function dateRfc7231Serializer(date?: Date | null): string {
  if (!date) {
    return date as any;
  }

  return date.toUTCString();
}export function dateUnixTimestampSerializer(date?: Date | null): number {
  if (!date) {
    return date as any;
  }

  return Math.floor(date.getTime() / 1000);
}export function dateUnixTimestampDeserializer(date?: number | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date * 1000);
}export function createPayloadToTransport(payload: CreateMeetingTypeRequest) {
  return jsonCreateMeetingTypeRequestToTransportTransform(payload)!;
}export function createPayloadToTransport_2(payload: CreateMeetingRequest) {
  return jsonCreateMeetingRequestToTransportTransform(payload)!;
}export function jsonMeetingListToTransportTransform(
  input_?: MeetingList | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    meetings: jsonArrayMeetingToTransportTransform(input_.meetings)
  }!;
}export function jsonMeetingListToApplicationTransform(
  input_?: any,
): MeetingList {
  if(!input_) {
    return input_ as any;
  }
    return {
    meetings: jsonArrayMeetingToApplicationTransform(input_.meetings)
  }!;
}export function jsonArrayMeetingToTransportTransform(
  items_?: Array<Meeting> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonMeetingToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayMeetingToApplicationTransform(
  items_?: any,
): Array<Meeting> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonMeetingToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonMeetingToTransportTransform(input_?: Meeting | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,start: input_.start,guestName: input_.guestName,guestEmail: input_.guestEmail,meetingType: jsonMeetingTypeSummaryToTransportTransform(input_.meetingType)
  }!;
}export function jsonMeetingToApplicationTransform(input_?: any): Meeting {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,start: input_.start,guestName: input_.guestName,guestEmail: input_.guestEmail,meetingType: jsonMeetingTypeSummaryToApplicationTransform(input_.meetingType)
  }!;
}export function jsonMeetingTypeSummaryToTransportTransform(
  input_?: MeetingTypeSummary | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,name: input_.name,durationMinutes: input_.durationMinutes
  }!;
}export function jsonMeetingTypeSummaryToApplicationTransform(
  input_?: any,
): MeetingTypeSummary {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,name: input_.name,durationMinutes: input_.durationMinutes
  }!;
}export function jsonErrorBodyEnvelopeToTransportTransform(
  input_?: ErrorBodyEnvelope | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorBodyToTransportTransform(input_.error)
  }!;
}export function jsonErrorBodyEnvelopeToApplicationTransform(
  input_?: any,
): ErrorBodyEnvelope {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonErrorBodyToApplicationTransform(input_.error)
  }!;
}export function jsonErrorBodyToTransportTransform(
  input_?: ErrorBody | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,fields: jsonArrayErrorFieldToTransportTransform(input_.fields)
  }!;
}export function jsonErrorBodyToApplicationTransform(input_?: any): ErrorBody {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,fields: jsonArrayErrorFieldToApplicationTransform(input_.fields)
  }!;
}export function jsonArrayErrorFieldToTransportTransform(
  items_?: Array<ErrorField> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonErrorFieldToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayErrorFieldToApplicationTransform(
  items_?: any,
): Array<ErrorField> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonErrorFieldToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonErrorFieldToTransportTransform(
  input_?: ErrorField | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    field: input_.field,message: input_.message
  }!;
}export function jsonErrorFieldToApplicationTransform(
  input_?: any,
): ErrorField {
  if(!input_) {
    return input_ as any;
  }
    return {
    field: input_.field,message: input_.message
  }!;
}export function jsonCreateMeetingRequestToTransportTransform(
  input_?: CreateMeetingRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    meetingTypeId: input_.meetingTypeId,start: input_.start,guestName: input_.guestName,guestEmail: input_.guestEmail
  }!;
}export function jsonCreateMeetingRequestToApplicationTransform(
  input_?: any,
): CreateMeetingRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    meetingTypeId: input_.meetingTypeId,start: input_.start,guestName: input_.guestName,guestEmail: input_.guestEmail
  }!;
}export function jsonMeetingCreatedBodyToTransportTransform(
  input_?: MeetingCreatedBody | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    meeting: jsonMeetingToTransportTransform(input_.meeting)
  }!;
}export function jsonMeetingCreatedBodyToApplicationTransform(
  input_?: any,
): MeetingCreatedBody {
  if(!input_) {
    return input_ as any;
  }
    return {
    meeting: jsonMeetingToApplicationTransform(input_.meeting)
  }!;
}export function jsonMeetingTypeListToTransportTransform(
  input_?: MeetingTypeList | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    meetingTypes: jsonArrayMeetingTypeToTransportTransform(input_.meetingTypes)
  }!;
}export function jsonMeetingTypeListToApplicationTransform(
  input_?: any,
): MeetingTypeList {
  if(!input_) {
    return input_ as any;
  }
    return {
    meetingTypes: jsonArrayMeetingTypeToApplicationTransform(input_.meetingTypes)
  }!;
}export function jsonArrayMeetingTypeToTransportTransform(
  items_?: Array<MeetingType> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonMeetingTypeToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayMeetingTypeToApplicationTransform(
  items_?: any,
): Array<MeetingType> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonMeetingTypeToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonMeetingTypeToTransportTransform(
  input_?: MeetingType | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,name: input_.name,description: input_.description,durationMinutes: input_.durationMinutes
  }!;
}export function jsonMeetingTypeToApplicationTransform(
  input_?: any,
): MeetingType {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,name: input_.name,description: input_.description,durationMinutes: input_.durationMinutes
  }!;
}export function jsonCreateMeetingTypeRequestToTransportTransform(
  input_?: CreateMeetingTypeRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    name: input_.name,description: input_.description,durationMinutes: input_.durationMinutes
  }!;
}export function jsonCreateMeetingTypeRequestToApplicationTransform(
  input_?: any,
): CreateMeetingTypeRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    name: input_.name,description: input_.description,durationMinutes: input_.durationMinutes
  }!;
}export function jsonMeetingTypeCreatedBodyToTransportTransform(
  input_?: MeetingTypeCreatedBody | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    meetingType: jsonMeetingTypeToTransportTransform(input_.meetingType)
  }!;
}export function jsonMeetingTypeCreatedBodyToApplicationTransform(
  input_?: any,
): MeetingTypeCreatedBody {
  if(!input_) {
    return input_ as any;
  }
    return {
    meetingType: jsonMeetingTypeToApplicationTransform(input_.meetingType)
  }!;
}export function jsonSlotsEnvelopeToTransportTransform(
  input_?: SlotsEnvelope | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    window: jsonSlotWindowToTransportTransform(input_.window),timezone: input_.timezone,days: jsonArraySlotDayToTransportTransform(input_.days)
  }!;
}export function jsonSlotsEnvelopeToApplicationTransform(
  input_?: any,
): SlotsEnvelope {
  if(!input_) {
    return input_ as any;
  }
    return {
    window: jsonSlotWindowToApplicationTransform(input_.window),timezone: input_.timezone,days: jsonArraySlotDayToApplicationTransform(input_.days)
  }!;
}export function jsonSlotWindowToTransportTransform(
  input_?: SlotWindow | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    start: input_.start,end: input_.end
  }!;
}export function jsonSlotWindowToApplicationTransform(
  input_?: any,
): SlotWindow {
  if(!input_) {
    return input_ as any;
  }
    return {
    start: input_.start,end: input_.end
  }!;
}export function jsonArraySlotDayToTransportTransform(
  items_?: Array<SlotDay> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonSlotDayToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArraySlotDayToApplicationTransform(
  items_?: any,
): Array<SlotDay> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonSlotDayToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonSlotDayToTransportTransform(input_?: SlotDay | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    date: input_.date,slots: jsonArraySlotToTransportTransform(input_.slots)
  }!;
}export function jsonSlotDayToApplicationTransform(input_?: any): SlotDay {
  if(!input_) {
    return input_ as any;
  }
    return {
    date: input_.date,slots: jsonArraySlotToApplicationTransform(input_.slots)
  }!;
}export function jsonArraySlotToTransportTransform(
  items_?: Array<Slot> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonSlotToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArraySlotToApplicationTransform(
  items_?: any,
): Array<Slot> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonSlotToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonSlotToTransportTransform(input_?: Slot | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    start: input_.start,available: input_.available
  }!;
}export function jsonSlotToApplicationTransform(input_?: any): Slot {
  if(!input_) {
    return input_ as any;
  }
    return {
    start: input_.start,available: input_.available
  }!;
}
