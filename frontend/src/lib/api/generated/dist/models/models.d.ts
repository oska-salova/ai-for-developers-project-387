/**
 * A sequence of textual characters.
 */
export type String = string;
/**
 * Ответ со списком предстоящих встреч владельца.
 */
export interface MeetingList {
    /**
     * Предстоящие встречи по возрастанию старта.
     */
    meetings: Array<Meeting>;
}
/**
 * Забронированный интервал в календаре владельца.
 */
export interface Meeting {
    id: string;
    /**
     * Мгновение начала в ISO 8601 UTC с суффиксом Z.
     */
    start: string;
    guestName: string;
    guestEmail: string;
    meetingType: MeetingTypeSummary;
}
/**
 * Сводка типа встречи внутри встречи: ссылка на неизменяемый тип, не снимок.
 */
export interface MeetingTypeSummary {
    id: string;
    name: string;
    durationMinutes: number;
}
/**
 * A 32-bit integer. (`-2,147,483,648` to `2,147,483,647`)
 */
export type Int32 = number;
/**
 * A 64-bit integer. (`-9,223,372,036,854,775,808` to `9,223,372,036,854,775,807`)
 */
export type Int64 = bigint;
/**
 * A whole number. This represent any `integer` value possible.
 * It is commonly represented as `BigInteger` in some languages.
 */
export type Integer = number;
/**
 * A numeric type
 */
export type Numeric = number;
/**
 * Единая рамка ошибок API.
 */
export interface ErrorBodyEnvelope {
    error: ErrorBody;
}
/**
 * Машиночитаемый код и текст ошибки.
 */
export interface ErrorBody {
    /**
     * Один из кодов: validation_error, not_found, slot_conflict, internal_error.
     */
    code: string;
    message: string;
    /**
     * Неверные поля запроса; заполняется только для validation_error.
     */
    fields?: Array<ErrorField>;
}
/**
 * Поле, значение которого не прошло валидацию.
 */
export interface ErrorField {
    /**
     * Имя поля тела запроса.
     */
    field: string;
    /**
     * Сообщение об ошибке, которое интерфейс показывает дословно.
     */
    message: string;
}
/**
 * Поля, которые гость присылает при записи на слот.
 */
export interface CreateMeetingRequest {
    meetingTypeId: string;
    /**
     * Мгновение начала в ISO 8601 UTC с суффиксом Z.
     */
    start: string;
    guestName: string;
    guestEmail: string;
}
/**
 * Тело успешного ответа на запись гостя.
 */
export interface MeetingCreatedBody {
    meeting: Meeting;
}
/**
 * Ответ со списком типов встреч.
 */
export interface MeetingTypeList {
    meetingTypes: Array<MeetingType>;
}
/**
 * Шаблон бронирования: что владелец предлагает гостю.
 */
export interface MeetingType {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
}
/**
 * Поля, которые владелец присылает при создании типа встречи.
 */
export interface CreateMeetingTypeRequest {
    name: string;
    description?: string;
    durationMinutes: number;
}
/**
 * Тело успешного ответа на создание типа встречи.
 */
export interface MeetingTypeCreatedBody {
    meetingType: MeetingType;
}
/**
 * Окно записи, часовой пояс владельца и дни с полной сеткой стартов.
 */
export interface SlotsEnvelope {
    window: SlotWindow;
    /**
     * Часовая зона владельца: Europe/Moscow.
     */
    timezone: string;
    /**
     * Ровно 14 дней окна, начиная с сегодняшнего.
     */
    days: Array<SlotDay>;
}
/**
 * Границы окна записи в календарных днях владельца.
 */
export interface SlotWindow {
    /**
     * Первый день окна, YYYY-MM-DD в зоне владельца.
     */
    start: string;
    /**
     * Последний день окна включительно, YYYY-MM-DD в зоне владельца.
     */
    end: string;
}
/**
 * Полная сетка стартов одного календарного дня владельца.
 */
export interface SlotDay {
    /**
     * Календарный день владельца, YYYY-MM-DD.
     */
    date: string;
    /**
     * Старты каждые 15 минут с 09:00 по 17:45.
     */
    slots: Array<Slot>;
}
/**
 * Старт встречи в сетке слотов.
 */
export interface Slot {
    /**
     * Мгновение начала в ISO 8601 UTC с суффиксом Z.
     */
    start: string;
    /**
     * Можно ли записаться на этот старт.
     */
    available: boolean;
}
/**
 * Boolean with `true` and `false` values.
 */
export type Boolean = boolean;
