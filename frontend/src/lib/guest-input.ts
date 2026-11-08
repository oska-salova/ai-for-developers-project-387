/** One dog, two non-empty parts, a dot in the domain, no spaces. */
export const GUEST_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

const MAX_GUEST_NAME_LENGTH = 100;
const MAX_GUEST_EMAIL_LENGTH = 254;

/**
 * The cheap client-side hints of the booking wizard. The server repeats these
 * checks and stays the judge; the texts match its verbatim messages.
 */
const GUEST_FIELD_MESSAGES = {
  nameRequired: "Имя обязательно",
  nameTooLong: "Имя не длиннее 100 символов",
  emailRequired: "Почта обязательна",
  emailTooLong: "Почта не длиннее 254 символов",
  emailFormat: "Почта должна быть в формате name@example.com",
} as const;

/** Trims the edges and collapses inner whitespace into single spaces. */
export function normalizeGuestName(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

/** Trims the edges and lowercases, exactly like the server. */
export function normalizeGuestEmail(value: string): string {
  return value.trim().toLowerCase();
}

export interface GuestInputErrors {
  guestName?: string;
  guestEmail?: string;
}

/** Returns a message for every invalid field, or no keys when both are valid. */
export function validateGuestInput(name: string, email: string): GuestInputErrors {
  const errors: GuestInputErrors = {};
  const guestName = normalizeGuestName(name);
  const guestEmail = normalizeGuestEmail(email);

  if (guestName === "") {
    errors.guestName = GUEST_FIELD_MESSAGES.nameRequired;
  } else if (guestName.length > MAX_GUEST_NAME_LENGTH) {
    errors.guestName = GUEST_FIELD_MESSAGES.nameTooLong;
  }

  if (guestEmail === "") {
    errors.guestEmail = GUEST_FIELD_MESSAGES.emailRequired;
  } else if (guestEmail.length > MAX_GUEST_EMAIL_LENGTH) {
    errors.guestEmail = GUEST_FIELD_MESSAGES.emailTooLong;
  } else if (!GUEST_EMAIL_PATTERN.test(guestEmail)) {
    errors.guestEmail = GUEST_FIELD_MESSAGES.emailFormat;
  }

  return errors;
}
