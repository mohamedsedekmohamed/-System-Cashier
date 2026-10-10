export interface FormattedAuthError {
  title: string;
  description: string;
  rawMessage?: string;
  type: 'auth' | 'network' | 'rate-limit' | 'server' | 'validation' | 'general';
}

/**
 * Parses and localizes authentication error messages into clear, friendly Arabic.
 */
export function formatAuthError(error: string | null | undefined): FormattedAuthError | null {
  if (!error) return null;

  const trimmed = error.trim();
  const lower = trimmed.toLowerCase();

  // Invalid credentials / 401 Unauthorized
  if (
    lower.includes('unauthorized') ||
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials') ||
    lower.includes('unauthenticated') ||
    lower.includes('credentials do not match') ||
    lower.includes('wrong password') ||
    lower.includes('user not found')
  ) {
    return {
      title: 'بيانات الاعتماد غير صحيحة',
      description: 'اسم المستخدم أو كلمة المرور التي أدخلتها غير مطابقة لسجلات النظام. يرجى التحقق وإعادة المحاولة.',
      rawMessage: trimmed,
      type: 'auth',
    };
  }

  // Rate limiting / Too many attempts
  if (
    lower.includes('too many attempts') ||
    lower.includes('throttle') ||
    lower.includes('429') ||
    lower.includes('locked')
  ) {
    return {
      title: 'تم تقييد المحاولات مؤقتاً',
      description: 'تم حظر تسجيل الدخول لفترة وجيزة لأسباب أمنية بسبب تكرار المحاولات. يرجى الانتظار دقيقتين ثم المحاولة ثانية.',
      rawMessage: trimmed,
      type: 'rate-limit',
    };
  }

  // Network / Connection issues
  if (
    lower.includes('network error') ||
    lower.includes('failed to fetch') ||
    lower.includes('err_connection_refused') ||
    lower.includes('connection refused') ||
    lower.includes('enotfound')
  ) {
    return {
      title: 'تعذر الاتصال بالخادم',
      description: 'يرجى التحقق من اتصالك بالإنترنت أو التأكد من أن خادم النظام يعمل بشكل طبيعي.',
      rawMessage: trimmed,
      type: 'network',
    };
  }

  // Timeout
  if (lower.includes('timeout') || lower.includes('econnaborted') || lower.includes('timed out')) {
    return {
      title: 'انتهت مهلة استجابة الخادم',
      description: 'استغرق الخادم وقتاً أطول من المعتاد للرد. يرجى المحاولة مرة أخرى.',
      rawMessage: trimmed,
      type: 'network',
    };
  }

  // Server internal errors (500, 502, 503)
  if (
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('internal server error') ||
    lower.includes('server error')
  ) {
    return {
      title: 'خطأ غير متوقع في خادم النظام',
      description: 'واجه الخادم مشكلة تقنية داخلية أثناء معالجة الطلب. يرجى إبلاغ مسؤول النظام أو المحاولة لاحقاً.',
      rawMessage: trimmed,
      type: 'server',
    };
  }

  // Validation error (422)
  if (
    lower.includes('validation') ||
    lower.includes('given data was invalid') ||
    lower.includes('required')
  ) {
    return {
      title: 'البيانات المدخلة غير مكتملة',
      description: 'يرجى التأكد من ملء حقلي اسم المستخدم وكلمة المرور بصيغة صحيحة.',
      rawMessage: trimmed,
      type: 'validation',
    };
  }

  // If message already contains Arabic letters
  const hasArabic = /[\u0600-\u06FF]/.test(trimmed);
  if (hasArabic) {
    return {
      title: 'فشل تسجيل الدخول',
      description: trimmed,
      rawMessage: trimmed,
      type: 'general',
    };
  }

  // Fallback for any other English or unknown message
  return {
    title: 'تعذر تسجيل الدخول',
    description: 'لم نتمكن من إتمام العملية بالبيانات المزودة. يرجى التأكد من صلاحية الحساب والمحاولة مرة أخرى.',
    rawMessage: trimmed,
    type: 'general',
  };
}
