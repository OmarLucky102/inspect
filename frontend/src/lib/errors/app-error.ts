import axios from 'axios';
import i18n from '@/lib/i18n';
import { translateErrorMessage } from '@/lib/error-translator';

export type ErrorStatusCode = 400 | 401 | 403 | 404 | 409 | 422 | 500 | 502 | 503 | 504 | 0;

export interface AppErrorOptions {
  status?: number;
  code?: string;
  title?: string;
  message: string;
  validationItems?: string[];
  details?: unknown;
  rawError?: unknown;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly title?: string;
  public readonly validationItems?: string[];
  public readonly details?: unknown;
  public readonly isNetworkError: boolean;
  public readonly isOperational: boolean;
  public readonly rawError?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.status = options.status ?? 500;
    this.code = options.code ?? (this.status === 0 ? 'NETWORK_OFFLINE' : `HTTP_${this.status}`);
    this.title = options.title;
    this.validationItems = options.validationItems;
    this.details = options.details;
    this.isNetworkError = this.status === 0 || options.code === 'NETWORK_OFFLINE';
    this.isOperational = this.status >= 400 && this.status < 500;
    this.rawError = options.rawError;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Returns user-friendly titles based on status code and active language.
 */
function getDefaultTitleForStatus(status: number, isArabic: boolean): string {
  switch (status) {
    case 404:
      return isArabic ? 'لم يتم العثور على المطلوب' : 'Not Found';
    case 403:
      return isArabic ? 'الوصول محظور' : 'Access Denied';
    case 401:
      return isArabic ? 'انتهت صلاحية الجلسة' : 'Session Expired';
    case 400:
      return isArabic ? 'بيانات غير صالحة' : 'Invalid Request';
    case 422:
      return isArabic ? 'فشل التحقق من صحة البيانات' : 'Validation Failed';
    case 409:
      return isArabic ? 'تعارض في البيانات' : 'Data Conflict Detected';
    case 0:
      return isArabic ? 'تعذر الاتصال بالخادم' : 'Connection Lost';
    case 500:
    case 502:
    case 503:
    case 504:
    default:
      return isArabic ? 'خطأ في الخادم' : 'Server Error';
  }
}

/**
 * Returns default fallback message if the backend didn't supply one.
 */
function getDefaultMessageForStatus(status: number, isArabic: boolean): string {
  switch (status) {
    case 404:
      return isArabic
        ? 'العنصر أو الصفحة المطلوبة غير موجودة أو تم حذفها.'
        : 'The requested resource or page was not found.';
    case 403:
      return isArabic
        ? 'ليس لديك الصلاحية الكافية للوصول إلى هذا المورد أو مساحة عمل البنك.'
        : 'You do not have permission to access this resource or bank workspace.';
    case 401:
      return isArabic
        ? 'يرجى تسجيل الدخول مجدداً للمتابعة.'
        : 'Please sign in again to continue.';
    case 400:
      return isArabic
        ? 'البيانات أو المعاملات المرسلة غير صالحة أو غير مكتملة. يرجى المراجعة والمحاولة مجدداً.'
        : 'The submitted parameters or payload were invalid or malformed.';
    case 422:
      return isArabic
        ? 'بعض الحقول المدخلة لم تستوفِ شروط التحقق المطلوبة. يرجى تصحيحها والمحاولة مجدداً.'
        : 'Some submitted fields failed validation checks. Please review and correct them.';
    case 409:
      return isArabic
        ? 'يتعارض هذا الإجراء مع سجل موجود مسبقاً أو مع الحالة الحالية للطلب.'
        : 'This action conflicts with an existing record or current workflow state.';
    case 0:
      return isArabic
        ? 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.'
        : 'Unable to reach the server. Please check your internet connection.';
    case 500:
    default:
      return isArabic
        ? 'حدث خطأ غير متوقع في الخادم. يرجى إعادة المحاولة لاحقاً.'
        : 'Something went wrong on our end. Please try again later.';
  }
}

/**
 * Normalizes any error (AxiosError, AppError, Error, or unknown) into a standardized AppError.
 */
export function parseApiError(error: unknown, fallbackMessage?: string): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const currentLang = i18n.language || 'en';
  const isArabic = currentLang.toLowerCase().startsWith('ar');

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const responseData = error.response?.data as
      | { message?: string | string[]; error?: string; status?: string }
      | undefined;

    let extractedMessage: string | null = null;
    let validationItems: string[] | undefined;

    if (Array.isArray(responseData?.message)) {
      const translatedItems = responseData.message
        .map((m) => translateErrorMessage(String(m), currentLang).trim())
        .filter(Boolean);
      if (translatedItems.length > 0) {
        validationItems = translatedItems;
        extractedMessage = translatedItems.join(isArabic ? '، ' : '. ');
      }
    } else if (typeof responseData?.message === 'string' && responseData.message.trim()) {
      extractedMessage = translateErrorMessage(responseData.message.trim(), currentLang);
    } else if (typeof responseData?.error === 'string' && responseData.error.trim()) {
      extractedMessage = translateErrorMessage(responseData.error.trim(), currentLang);
    }

    // Determine network failure vs server response
    if (!error.response || error.code === 'ERR_NETWORK') {
      const netMsg = translateErrorMessage(
        'Cannot reach the server. Check your connection.',
        currentLang,
      );
      return new AppError({
        status: 0,
        code: 'NETWORK_OFFLINE',
        title: getDefaultTitleForStatus(0, isArabic),
        message: netMsg,
        rawError: error,
      });
    }

    const finalMessage =
      extractedMessage ||
      (fallbackMessage ? translateErrorMessage(fallbackMessage, currentLang) : null) ||
      getDefaultMessageForStatus(status, isArabic);

    return new AppError({
      status,
      code:
        status === 404
          ? 'NOT_FOUND'
          : status === 403
            ? 'FORBIDDEN'
            : status === 401
              ? 'UNAUTHORIZED'
              : status === 400
                ? 'BAD_REQUEST'
                : status === 409
                  ? 'CONFLICT'
                  : status === 422
                    ? 'UNPROCESSABLE_ENTITY'
                    : `HTTP_${status}`,
      title: getDefaultTitleForStatus(status, isArabic),
      message: finalMessage,
      validationItems,
      details: responseData,
      rawError: error,
    });
  }

  if (error instanceof Error) {
    const translated = translateErrorMessage(error.message, currentLang);
    return new AppError({
      status: 500,
      code: 'CLIENT_ERROR',
      title: getDefaultTitleForStatus(500, isArabic),
      message: translated || fallbackMessage || getDefaultMessageForStatus(500, isArabic),
      rawError: error,
    });
  }

  const defaultMsg = fallbackMessage
    ? translateErrorMessage(fallbackMessage, currentLang)
    : getDefaultMessageForStatus(500, isArabic);

  return new AppError({
    status: 500,
    code: 'UNKNOWN_ERROR',
    title: getDefaultTitleForStatus(500, isArabic),
    message: defaultMsg,
    rawError: error,
  });
}

