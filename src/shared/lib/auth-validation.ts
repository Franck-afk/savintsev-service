import { MIN_PASSWORD_LENGTH } from "@/shared/constants/auth";

export function hasMinimumPasswordLength(value: unknown): value is string {
  return typeof value === "string" && value.length >= MIN_PASSWORD_LENGTH;
}

export function hasAcceptedPersonalDataConsent(value: unknown): value is true {
  return value === true;
}
