/**
 * Intelligent error message translator supporting English and Arabic.
 * Translates backend API envelope messages, validation errors, Prisma constraints,
 * and network errors so the UI consistently displays localized feedback.
 */

interface ErrorRule {
  pattern: RegExp
  ar: string | ((match: RegExpExecArray) => string)
}

const ERROR_RULES: ErrorRule[] = [
  // ── Network & Connection ───────────────────────────────────────────────────
  {
    pattern: /cannot reach the server|network error|failed to fetch|econnrefused/i,
    ar: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.',
  },
  {
    pattern: /timeout of \d+ms exceeded|request timed out/i,
    ar: 'انتهت مهلة انتظار الخادم. يرجى إعادة المحاولة لاحقاً.',
  },

  // ── Bank & Workspace Assignments ───────────────────────────────────────────
  {
    pattern: /this user is already assigned to this bank/i,
    ar: 'هذا المستخدم تم تعيينه لهذا البنك بالفعل.',
  },
  {
    pattern: /duplicate bank assignment detected/i,
    ar: 'تم اكتشاف تعيين مكرر. لا يمكن تعيين المستخدم لنفس البنك أكثر من مرة.',
  },
  {
    pattern: /a bank with code ['"]?([^'"]+)['"]? already exists/i,
    ar: (m) => `كود البنك (${m[1]}) مستخدم بالفعل. يرجى اختيار كود آخر.`,
  },
  {
    pattern: /bank code already (?:in use|exists)/i,
    ar: 'كود البنك هذا مسجل بالفعل. يرجى اختيار كود آخر.',
  },
  {
    pattern: /a bank with name ['"]?([^'"]+)['"]? already exists/i,
    ar: (m) => `اسم البنك (${m[1]}) مسجل بالفعل. يرجى اختيار اسم آخر.`,
  },
  {
    pattern: /bank with identifier .* not found|bank not found/i,
    ar: 'لم يتم العثور على مساحة عمل البنك المطلوبة.',
  },
  {
    pattern: /role ['"]?([^'"]+)['"]? is not allowed for bank members/i,
    ar: (m) => `الدور (${m[1]}) غير مصرح به لأعضاء البنك.`,
  },
  {
    pattern: /failed to create bank/i,
    ar: 'فشل في إنشاء مساحة عمل البنك.',
  },
  {
    pattern: /failed to load banks/i,
    ar: 'فشل في تحميل قائمة البنوك.',
  },
  {
    pattern: /failed to load bank details/i,
    ar: 'فشل في تحميل تفاصيل البنك.',
  },
  {
    pattern: /failed to load bank members/i,
    ar: 'فشل في تحميل أعضاء البنك.',
  },
  {
    pattern: /failed to remove member/i,
    ar: 'فشل في إزالة العضو من البنك.',
  },
  {
    pattern: /failed to update user banks|failed to assign bank/i,
    ar: 'فشل في تحديث تعيينات البنوك للمستخدم.',
  },

  // ── Authentication & Security ──────────────────────────────────────────────
  {
    pattern: /invalid credentials|invalid email or password/i,
    ar: 'بيانات الاعتماد غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.',
  },
  {
    pattern: /unauthorized|jwt expired|token expired|invalid or expired refresh token|missing authentication token/i,
    ar: 'انتهت صلاحية الجلسة أو لم يتم التحقق من الهوية. يرجى تسجيل الدخول مرة أخرى.',
  },
  {
    pattern: /you do not have permission to access inspection requests in another bank workspace/i,
    ar: 'ليس لديك صلاحية للوصول إلى طلبات الفحص الخاصة بمساحة عمل بنك آخر.',
  },
  {
    pattern: /you do not have permission to view inspection requests belonging to another bank workspace/i,
    ar: 'ليس لديك صلاحية لعرض طلبات الفحص التابعة لمساحة عمل بنك آخر.',
  },
  {
    pattern: /you do not have permission to access inspection requests in the requested bank workspace/i,
    ar: 'ليس لديك صلاحية للوصول إلى طلبات الفحص في مساحة عمل البنك المطلوبة.',
  },
  {
    pattern: /you are not an active member of bank|user is not an active member of bank/i,
    ar: 'حسابك غير معيّن كعضو نشط في مساحة عمل هذا البنك.',
  },
  {
    pattern: /you are not assigned to this bank workspace/i,
    ar: 'ليس لديك صلاحية لأن حسابك غير معيّن في مساحة عمل هذا البنك.',
  },
  {
    pattern: /no active bank membership found/i,
    ar: 'لا توجد عضوية نشطة في أي بنك لحسابك حالياً.',
  },
  {
    pattern: /you are not authorized to access this inspection request/i,
    ar: 'ليس لديك صلاحية للوصول إلى طلب الفحص هذا.',
  },
  {
    pattern: /forbidden resource|access denied|forbidden/i,
    ar: 'ليس لديك الصلاحية الكافية لإتمام هذا الإجراء.',
  },

  // ── User Identity ──────────────────────────────────────────────────────────
  {
    pattern: /user with email .* already exists|user already exists/i,
    ar: 'يوجد مستخدم مسجل مسبقاً بهذا البريد الإلكتروني.',
  },
  {
    pattern: /user with identifier .* not found|user not found/i,
    ar: 'لم يتم العثور على المستخدم المطلوب.',
  },
  {
    pattern: /failed to create user/i,
    ar: 'فشل في إنشاء حساب المستخدم.',
  },
  {
    pattern: /failed to load user details/i,
    ar: 'فشل في تحميل بيانات المستخدم.',
  },
  {
    pattern: /you cannot delete your own account/i,
    ar: 'لا يمكنك حذف حسابك الخاص المسجل الدخول به حالياً.',
  },
  {
    pattern: /you cannot deactivate your own account/i,
    ar: 'لا يمكنك تعطيل حسابك الخاص المسجل الدخول به حالياً.',
  },
  {
    pattern: /is already active/i,
    ar: 'هذا المستخدم مفعل بالفعل.',
  },
  {
    pattern: /is already deactivated|is already inactive/i,
    ar: 'هذا المستخدم معطل بالفعل.',
  },

  // ── Inspection Requests ───────────────────────────────────────────────────
  {
    pattern: /inspection request with (?:id|identifier) .* not found|inspection request not found|inspection not found/i,
    ar: 'لم يتم العثور على طلب الفحص المطلوب.',
  },
  {
    pattern: /requested record was not found|record not found/i,
    ar: 'لم يتم العثور على السجل المطلوب.',
  },
  {
    pattern: /failed to load inspection requests/i,
    ar: 'فشل في تحميل طلبات الفحص.',
  },
  {
    pattern: /failed to load inspection request details|failed to load request details/i,
    ar: 'فشل في تحميل تفاصيل طلب الفحص.',
  },
  {
    pattern: /checklist with identifier .* not found|checklist not found/i,
    ar: 'لم يتم العثور على قائمة الفحص المطلوبة.',
  },
  {
    pattern: /representative with identifier .* not found|representative not found/i,
    ar: 'لم يتم العثور على المندوب المطلوب.',
  },

  // ── Prisma & Database ──────────────────────────────────────────────────────
  {
    pattern: /duplicate field value for (.*)\./i,
    ar: (m) => `هذه القيمة (${m[1]}) مسجلة بالفعل في النظام ولا يمكن تكرارها.`,
  },
  {
    pattern: /related record not found for (.*)\./i,
    ar: (m) => `السجل المرتبط بـ (${m[1]}) غير موجود في النظام.`,
  },

  // ── Class-Validator & Form Fields ──────────────────────────────────────────
  {
    pattern: /email must be an email/i,
    ar: 'يجب إدخال بريد إلكتروني بصيغة صحيحة.',
  },
  {
    pattern: /password must be longer than or equal to (\d+) characters/i,
    ar: (m) => `يجب أن تتكون كلمة المرور من ${m[1]} أحرف على الأقل.`,
  },
  {
    pattern: /password is too short/i,
    ar: 'كلمة المرور قصيرة جداً.',
  },
  {
    pattern: /firstName should not be empty|first name is required/i,
    ar: 'الاسم الأول مطلوب ولا يمكن تركه فارغاً.',
  },
  {
    pattern: /lastName should not be empty|last name is required/i,
    ar: 'الاسم الأخير مطلوب ولا يمكن تركه فارغاً.',
  },
  {
    pattern: /phone should not be empty|phone is required/i,
    ar: 'رقم الهاتف مطلوب.',
  },
  {
    pattern: /name should not be empty|bank name cannot be empty/i,
    ar: 'الاسم مطلوب ولا يمكن تركه فارغاً.',
  },
  {
    pattern: /validation failed/i,
    ar: 'فشل التحقق من صحة البيانات المدخلة.',
  },

  // ── Generic / Fallback ─────────────────────────────────────────────────────
  {
    pattern: /internal server error|something went very wrong/i,
    ar: 'حدث خطأ غير متوقع في الخادم. يرجى المحاولة لاحقاً.',
  },
]

/**
 * Translates an error message into the current target language if applicable.
 */
export function translateErrorMessage(message: string, lang: string): string {
  if (!message || typeof message !== 'string') return ''

  const isArabic = lang?.toLowerCase().startsWith('ar')
  if (!isArabic) {
    return message
  }

  const trimmed = message.trim()

  for (const rule of ERROR_RULES) {
    const match = rule.pattern.exec(trimmed)
    if (match) {
      if (typeof rule.ar === 'function') {
        return rule.ar(match)
      }
      return rule.ar
    }
  }

  return trimmed
}
