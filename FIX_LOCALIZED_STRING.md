# إصلاح مشكلة عرض كائنات LocalizedString

## المشكلة
كان التطبيق يعرض خطأ:
```
Uncaught Error: Objects are not valid as a React child (found: object with keys {en, ar})
```

### السبب
بعض الحقول في قاعدة البيانات من نوع `LocalizedString` والتي تحتوي على:
```typescript
interface LocalizedString {
  ar: string;
  en: string;
}
```

عند محاولة عرض هذه الكائنات مباشرة في JSX، يحدث الخطأ لأن React لا يمكنه عرض الكائنات مباشرة.

## الحلول المطبقة

### 1. تحسين DataTable.tsx
تم تحديث دالة `getNestedValue` للتعامل تلقائيًا مع كائنات `LocalizedString`:

```typescript
const getNestedValue = (obj: any, path: string) => {
  const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
  
  // Handle LocalizedString objects (with 'ar' and 'en' keys)
  if (value && typeof value === 'object' && 'ar' in value && 'en' in value) {
    return value.ar || value.en || '';
  }
  
  return value;
};
```

**الفائدة**: الآن عند استخدام `accessorKey` في أعمدة DataTable، سيتم التعامل مع `LocalizedString` تلقائيًا.

### 2. تحسين src/utils/helpers.ts
تم إعادة كتابة وتوثيق الدوال المساعدة:

```typescript
/**
 * Helper function to render localized strings or regular strings
 * @param name - Can be a LocalizedString, string, or any value
 * @param lang - Preferred language ('ar' or 'en'), defaults to 'ar'
 */
export const renderName = (name: any, lang: 'ar' | 'en' = 'ar'): string => {
  if (!name) return '';
  
  if (typeof name === 'object' && name !== null) {
    if ('ar' in name || 'en' in name) {
      return name[lang] || name.ar || name.en || '';
    }
  }
  
  return String(name);
};

/**
 * Helper function specifically for LocalizedString types
 * @param str - LocalizedString object
 * @param lang - Preferred language ('ar' or 'en'), defaults to 'ar'
 */
export const getLocalizedString = (
  str: LocalizedString | string | undefined | null,
  lang: 'ar' | 'en' = 'ar'
): string => {
  if (!str) return '';
  if (typeof str === 'string') return str;
  return str[lang] || str.ar || str.en || '';
};
```

**الاستخدام**:
```typescript
import { renderName, getLocalizedString } from '../utils/helpers';

// في الكود
<p>{renderName(product.name)}</p>
// أو
<p>{getLocalizedString(product.name, 'ar')}</p>
```

### 3. إصلاح StatusBadge
تم إصلاح استخدام `StatusBadge` في ملفين:
- `src/pages/taxes/TaxList.tsx`
- `src/pages/productRecipes/ProductRecipeList.tsx`

**قبل**:
```typescript
<StatusBadge status={row.status} />  // ❌ خطأ: status ليس خاصية صحيحة
```

**بعد**:
```typescript
<StatusBadge active={row.status} />  // ✅ صحيح
```

## المكونات التي تحتوي على حماية مدمجة

المكونات التالية تحتوي على دالة `renderSafe` للتعامل مع المشكلة:
- `src/components/ui/DeleteModal.tsx`
- `src/components/ui/DetailsModal.tsx`

## أفضل الممارسات

### ✅ افعل
1. استخدم `render` function في أعمدة DataTable للتحكم الكامل في العرض:
```typescript
{
  header: 'الاسم',
  render: (row) => (
    <div>
      <p>{row.name?.ar}</p>
      <p>{row.name?.en}</p>
    </div>
  )
}
```

2. استخدم الدوال المساعدة عند الحاجة:
```typescript
import { renderName } from '../utils/helpers';

<span>{renderName(data.name)}</span>
```

### ❌ لا تفعل
1. لا تحاول عرض كائنات مباشرة:
```typescript
<p>{row.name}</p>  // ❌ إذا كان name من نوع LocalizedString
```

2. لا تكرر كود المعالجة في كل مكان:
```typescript
// ❌ لا تكرر هذا في كل ملف
{typeof name === 'object' && name !== null ? (name?.ar || name?.en || '') : (name || '')}

// ✅ استخدم الدالة المساعدة
{renderName(name)}
```

## ملفات تم تعديلها
1. `src/components/ui/DataTable.tsx` - تحسين معالجة LocalizedString
2. `src/utils/helpers.ts` - إضافة دوال مساعدة محسنة
3. `src/pages/taxes/TaxList.tsx` - إصلاح StatusBadge
4. `src/pages/productRecipes/ProductRecipeList.tsx` - إصلاح StatusBadge

## التحقق من الحل
بعد هذه التعديلات، يجب أن يختفي الخطأ:
```
Uncaught Error: Objects are not valid as a React child (found: object with keys {en, ar})
```

إذا ظهر هذا الخطأ مرة أخرى، تحقق من:
1. هل تستخدم `render` function في عمود DataTable؟
2. هل تحاول عرض كائن LocalizedString مباشرة في JSX؟
3. استخدم `renderName()` أو `getLocalizedString()` من `src/utils/helpers.ts`
