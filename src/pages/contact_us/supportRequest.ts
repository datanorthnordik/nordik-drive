import { normalizeEmail } from "../auth/authValidation";

export const SUPPORT_REQUEST_TYPES = [
  {
    value: "question",
    label: "Question or query",
    helperText: "Ask for guidance, clarification, or help using a page or workflow.",
    messagePlaceholder:
      "Tell us what you're trying to do, which page you're on, and the answer or guidance you need.",
  },
  {
    value: "technical_issue",
    label: "Technical issue",
    helperText: "Report bugs, errors, or something that is not working as expected.",
    messagePlaceholder:
      "Describe what happened, what you expected to happen, and include any error message you saw.",
  },
] as const;

export type SupportRequestType = (typeof SUPPORT_REQUEST_TYPES)[number]["value"];

export interface SupportRequestFormValues {
  requestType: SupportRequestType;
  name: string;
  email: string;
  subject: string;
  message: string;
}

export type SupportRequestFormErrors = Partial<
  Record<keyof SupportRequestFormValues | "screenshot", string>
>;

export const MAX_SUPPORT_SUBJECT_LENGTH = 140;
export const MAX_SUPPORT_MESSAGE_LENGTH = 2000;
export const MAX_SUPPORT_SCREENSHOT_BYTES = 5 * 1024 * 1024;

export const SUPPORT_SCREENSHOT_ACCEPT = "image/png,image/jpeg,image/webp";

const ALLOWED_SCREENSHOT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createDefaultSupportRequestForm = (
  name = "",
  email = ""
): SupportRequestFormValues => ({
  requestType: "question",
  name,
  email,
  subject: "",
  message: "",
});

export const getSupportRequestTypeMeta = (type: SupportRequestType) =>
  SUPPORT_REQUEST_TYPES.find((option) => option.value === type) || SUPPORT_REQUEST_TYPES[0];

export const validateSupportScreenshot = (file: File | null | undefined): string | null => {
  if (!file) return null;

  if (!ALLOWED_SCREENSHOT_TYPES.has(file.type)) {
    return "Please attach a PNG, JPG, or WEBP screenshot.";
  }

  if (file.size > MAX_SUPPORT_SCREENSHOT_BYTES) {
    return "Please keep screenshots under 5 MB.";
  }

  return null;
};

export const validateSupportRequestForm = (
  values: SupportRequestFormValues,
  screenshot?: File | null
): SupportRequestFormErrors => {
  const errors: SupportRequestFormErrors = {};
  const trimmedName = values.name.trim();
  const normalizedEmail = normalizeEmail(values.email);
  const trimmedSubject = values.subject.trim();
  const trimmedMessage = values.message.trim();

  if (!trimmedName) {
    errors.name = "Your name is required.";
  } else if (trimmedName.length > 120) {
    errors.name = "Please keep your name under 120 characters.";
  }

  if (!normalizedEmail) {
    errors.email = "Email is required.";
  } else if (!BASIC_EMAIL_PATTERN.test(normalizedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!trimmedSubject) {
    errors.subject = "Subject is required.";
  } else if (trimmedSubject.length > MAX_SUPPORT_SUBJECT_LENGTH) {
    errors.subject = `Please keep the subject under ${MAX_SUPPORT_SUBJECT_LENGTH} characters.`;
  }

  if (!trimmedMessage) {
    errors.message = "Please describe your question or issue.";
  } else if (trimmedMessage.length > MAX_SUPPORT_MESSAGE_LENGTH) {
    errors.message = `Please keep the message under ${MAX_SUPPORT_MESSAGE_LENGTH} characters.`;
  }

  const screenshotError = validateSupportScreenshot(screenshot);
  if (screenshotError) {
    errors.screenshot = screenshotError;
  }

  return errors;
};
