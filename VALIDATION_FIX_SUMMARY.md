# Customer Name & Phone Validation Fix

## Problem Description
When users selected categories that require customer name and phone number (like DCR, Khajna Payment, Namjari, etc.), even after filling in the name and phone number, the form still showed "Customer name is required" error.

## Root Cause
The validation logic in `components/sales/DailySalesForm.jsx` had issues with how it checked for empty values:

1. **Loose checking**: The original code used `!watchedFields.customerName` which would be `true` for both `undefined` and empty string `""`, but the validation wasn't clearing errors properly when users typed valid values.

2. **Timing issue**: The `useEffect` validation ran asynchronously, but form submission checked `isValid` which might not reflect the latest error state from `setError()`.

3. **UI feedback**: Error styling and visual indicators weren't prominent enough to show which fields were required.

## Changes Made

### 1. Fixed Validation Logic (Lines 437-465)
**Before:**
```javascript
if (
  !watchedFields.customerName ||
  watchedFields.customerName.trim().length < 2
) {
  setError("customerName", {
    type: "custom",
    message: `Name is required for ${selectedCategoryObj?.name}`,
  });
}
```

**After:**
```javascript
const nameValue = watchedFields.customerName?.trim() || "";
const phoneValue = watchedFields.customerPhone?.trim() || "";

if (nameValue.length < 2) {
  setError("customerName", {
    type: "custom",
    message: `Customer name is required for ${selectedCategoryObj?.name}`,
  });
} else {
  clearErrors("customerName");
}

if (phoneValue.length < 11) {
  setError("customerPhone", {
    type: "custom",
    message: "Valid 11-digit phone number is required",
  });
} else {
  clearErrors("customerPhone");
}
```

### 2. Enhanced UI Feedback (Lines 817-860)
Added:
- Red label color when fields are required and have errors
- Red border on input fields with errors
- Warning icon (⚠) in error messages
- Clearer placeholder text: "Required (11 digits)" for phone field
- Visual distinction with `className={cn(...)}` for conditional styling

**Key improvements:**
```javascript
<label className={cn(CAPTION, isClientDetailsRequired && "text-red-600 dark:text-red-400")}>
  Customer Name{" "}
  {isClientDetailsRequired ? (
    <span className="text-red-500">*</span>
  ) : (
    "(Optional)"
  )}
</label>
<Input
  className={cn(
    "h-11 md:h-10",
    errors.customerName && "border-red-500 focus-visible:ring-red-500"
  )}
  {...register("customerName")}
  placeholder={
    isClientDetailsRequired
      ? "Required for this category"
      : "John Doe"
  }
/>
{errors.customerName && (
  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
    <span>⚠</span> {errors.customerName.message}
  </p>
)}
```

## Mandatory Categories
The following categories require customer name (≥2 characters) and phone number (≥11 digits):
- DCR
- Khajna Payment
- Namjari
- Khajna Nibondon
- Miss Case
- Khatian Application

## How It Works Now

1. **User selects a mandatory category** → Labels change to show red "*" and "Required for this category"
2. **User types less than 2 characters in name** → Red border appears, error message shows with ⚠ icon
3. **User types 2+ characters** → Error clears immediately, border returns to normal
4. **User types less than 11 digits in phone** → Red border appears, error message shows
5. **User types 11+ digits** → Error clears immediately
6. **User tries to submit with errors** → Form blocks submission and shows toast: "Please fix the highlighted fields before submitting."

## Backend Validation
The backend (`app/api/products/sales/route.js` lines 141-167) performs the same validation:
- Checks if category name is in `mandatoryCategories` array
- If yes, requires `customerName` (≥2 chars) and `customerPhone` (≥11 chars)
- Returns clear error message: "Customer name is required for [category name] category"

## Testing
Build completed successfully with no TypeScript errors:
```
✓ Compiled successfully in 20.9s
✓ Running TypeScript in 319ms
✓ Generating static pages (44/44) in 837ms
```

## Files Modified
1. `components/sales/DailySalesForm.jsx` - Main sales form with validation fixes

## Related Files (Not Modified, But Use Same Pattern)
- `components/sales/DailySalesFormMultiItem.jsx` - Multi-item sales form
- `app/(dashboard)/admin/sales/edit/[id]/page.jsx` - Admin sales edit
- `app/(dashboard)/employee/sales/edit/[id]/page.jsx` - Employee sales edit
- `app/api/products/sales/route.js` - Backend validation logic

## Future Improvements
1. Consider adding the same UI improvements to `DailySalesFormMultiItem.jsx`
2. Add phone number format validation (e.g., must start with 01)
3. Consider adding a visual indicator next to category dropdown showing if it requires customer info
4. Add tooltips explaining why certain categories require customer information

---
**Fixed by:** Claude Code  
**Date:** 2026-09-14  
**Build Status:** ✅ Passing
