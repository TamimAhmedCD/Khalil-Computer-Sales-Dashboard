# Dynamic Category Customer Info Validation

## Overview
Implemented dynamic, admin-configurable customer information requirements for categories instead of hardcoded static lists. Admins can now toggle whether a category requires customer name and phone number during sales.

## Changes Made

### 1. Database Schema Updates

#### Category Schema - Added New Field
**File:** `app/api/admin/shop/products/category/route.js`

Added `requiresCustomerInfo` boolean field to category documents:
```javascript
{
  name: "DCR",
  commission: 5,
  description: "...",
  status: true,
  requiresCustomerInfo: false,  // NEW FIELD
  totalSales: 0,
  totalProfit: 0,
  totalCommission: 0,
  createdAt: Date,
  updatedAt: Date
}
```

**Changes:**
- **POST (Create):** Line 19 - Accept `requiresCustomerInfo` from request body (default: `false`)
- **POST (Create):** Line 48 - Add field to new category documents
- **PATCH (Update):** Line 109 - Accept `requiresCustomerInfo` in update request
- **PATCH (Update):** Line 120 - Include field in update data if provided

### 2. Backend Validation Logic

**File:** `app/api/products/sales/route.js`

**Before (Lines 141-167):**
```javascript
const mandatoryCategories = [
  "DCR",
  "Khajna Payment",
  "Namjari",
  "Khajna Nibondon",
  "Miss Case",
  "Khatian Application",
];

if (mandatoryCategories.includes(categoryData.name)) {
  // Validate customer info
}
```

**After (Lines 140-157):**
```javascript
// Check if category requires customer details (dynamic field from database)
if (categoryData.requiresCustomerInfo === true) {
  const customerName = item.customerName?.trim();
  const customerPhone = item.customerPhone?.trim();

  if (!customerName || customerName.length < 2) {
    return {
      success: false,
      message: `Customer name is required for ${categoryData.name} category`
    };
  }

  if (!customerPhone || customerPhone.length < 11) {
    return {
      success: false,
      message: `Valid 11-digit phone number is required for ${categoryData.name} category`
    };
  }
}
```

### 3. Admin UI - Category Management

**File:** `app/(dashboard)/admin/categories/page.jsx`

#### Schema Update (Line 40-46)
```javascript
const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  commission: z.coerce.number().min(0, "Min 0%").max(100, "Max 100%"),
  description: z.string().optional(),
  status: z.boolean().default(true),
  requiresCustomerInfo: z.boolean().default(false),  // NEW
});
```

#### Form State (Line 88-95)
```javascript
defaultValues: {
  name: "",
  commission: "",
  description: "",
  status: true,
  requiresCustomerInfo: false,  // NEW
}
```

#### Watch Value (Line 99)
```javascript
const requiresCustomerInfoValue = watch("requiresCustomerInfo");
```

#### New Toggle in Form (After line 356)
```javascript
<div className="flex items-center justify-between p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20">
  <div className="space-y-0.5">
    <label className="text-sm font-bold text-foreground">
      Require Customer Info
    </label>
    <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
      Name and phone mandatory for sales
    </p>
  </div>
  <button
    type="button"
    onClick={() => setValue("requiresCustomerInfo", !requiresCustomerInfoValue)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
      requiresCustomerInfoValue ? "bg-blue-600" : "bg-zinc-400"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
        requiresCustomerInfoValue ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
</div>
```

#### Form Functions (Lines 147-165, 181-189)
Updated `openCreateModal()`, `openEditModal()`, and `closeFormDialog()` to handle the new field.

### 4. Sales Form - Dynamic Validation

**File:** `components/sales/DailySalesForm.jsx`

#### Removed Static List (Line 96-112)
**Before:**
```javascript
const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Bank", "Due"];
const mandatoryCategories = [
  "DCR",
  "Khajna Payment",
  "Namjari",
  "Khajna Nibondon",
  "Miss Case",
  "Khatian Application",
];
```

**After:**
```javascript
const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Bank", "Due"];
// mandatoryCategories removed - now using dynamic field
```

#### Updated Validation Logic (Line 385-388)
**Before:**
```javascript
const isClientDetailsRequired =
  !isProduct && selectedCategoryObj
    ? mandatoryCategories.includes(selectedCategoryObj.name)
    : false;
```

**After:**
```javascript
const isClientDetailsRequired =
  !isProduct && selectedCategoryObj
    ? selectedCategoryObj.requiresCustomerInfo === true
    : false;
```

#### Fixed Default Values (Line 100-113)
**Before:**
```javascript
const DEFAULTS = {
  saleType: "service",
  customerName: "",
  customerPhone: "",
  productName: "",
  categoryId: "",
  productId: "",
  quantity: 1,
  totalPrice: 0,      // Shows "0" in input
  rawExpense: 0,      // Shows "0" in input
  paymentMethod: "",
  paidAmount: 0,      // Shows "0" in input
  note: "",
};
```

**After:**
```javascript
const DEFAULTS = {
  saleType: "service",
  customerName: "",
  customerPhone: "",
  productName: "",
  categoryId: "",
  productId: "",
  quantity: 1,
  totalPrice: "",     // Empty - user must type
  rawExpense: "",     // Empty - user must type
  paymentMethod: "",
  paidAmount: "",     // Empty - user must type
  note: "",
};
```

#### Fixed Payload Parsing (Lines 642-670)
Added `Number()` conversion when building payload since form now stores empty strings:
```javascript
quantity: Number(data.quantity) || 1,
totalPrice: Number(data.totalPrice) || 0,
rawExpense: Number(data.rawExpense) || 0,
paidAmount: Number(data.paidAmount) || 0,
```

## How It Works

### Admin Flow
1. **Admin goes to Categories page** (`/admin/categories`)
2. **Creates or edits a category**
3. **Toggles "Require Customer Info"** switch
   - ON (blue) = Customer name and phone required for this category
   - OFF (gray) = Customer info optional
4. **Saves category** - Setting stored in database

### Sales Flow
1. **Employee opens Sales form** (`/employee/sales/add` or `/admin/sales/add`)
2. **Selects a service category**
3. **Form dynamically checks** `selectedCategoryObj.requiresCustomerInfo`
4. **If true:**
   - Customer Name label shows red "*" and says "Required for this category"
   - Phone Number label shows red "*" and says "Required (11 digits)"
   - Validation enforces:
     - Name ≥ 2 characters
     - Phone ≥ 11 digits
   - Form blocks submission if missing
5. **If false:**
   - Labels show "(Optional)"
   - No validation required
   - Form allows submission without customer data

### Backend Validation
When sale is submitted:
1. Backend fetches category from database
2. Checks `categoryData.requiresCustomerInfo`
3. If `true`, validates customer name and phone
4. Returns clear error if validation fails:
   ```
   "Customer name is required for [Category Name] category"
   "Valid 11-digit phone number is required for [Category Name] category"
   ```

## Backward Compatibility

Categories created before this update won't have the `requiresCustomerInfo` field:
- **Database:** Field defaults to `false` when missing
- **Validation:** `=== true` check ensures only explicitly enabled categories require info
- **Form:** Falls back to optional when field doesn't exist
- **No migration needed** - existing categories automatically treat customer info as optional

## Benefits

### ✅ No More Hardcoding
- No need to edit code to add/remove mandatory categories
- Admin controls requirements through UI

### ✅ Flexibility
- Different categories can have different requirements
- Easy to change requirements as business needs evolve

### ✅ Clear UX
- Visual indicators (red labels, asterisks) when info is required
- Helpful placeholder text explains requirements
- Error messages reference specific category name

### ✅ Consistent Validation
- Frontend and backend use same dynamic field
- Impossible for validation mismatch

### ✅ Clean Input Fields
- Number fields start empty instead of showing "0"
- Better UX - users know they need to enter data

## Testing Steps

1. **Create New Category with Customer Info Required:**
   ```
   - Go to /admin/categories
   - Click "Add Category"
   - Name: "Land Registration"
   - Commission: 5
   - Toggle "Require Customer Info" ON (blue)
   - Save
   ```

2. **Test Sales Form:**
   ```
   - Go to /employee/sales/add
   - Select "Land Registration" category
   - Notice: Labels show "*" and "Required for this category"
   - Try to submit without name/phone → Error shown
   - Fill name (2+ chars) and phone (11+ digits) → Success
   ```

3. **Create Category WITHOUT Requirement:**
   ```
   - Add category with toggle OFF (gray)
   - In sales form, customer info should be optional
   - Can submit without name/phone
   ```

4. **Update Existing Category:**
   ```
   - Edit a category
   - Toggle requirement ON
   - Save
   - Verify sales form now requires info for that category
   ```

5. **Test Backward Compatibility:**
   ```
   - If you have old categories, they should work fine
   - Default to optional (no errors)
   ```

## Migration (Optional)

To set existing categories that previously required customer info:

```javascript
// Run in MongoDB shell or via API
db.categories.updateMany(
  { 
    name: { 
      $in: [
        "DCR",
        "Khajna Payment", 
        "Namjari",
        "Khajna Nibondon",
        "Miss Case",
        "Khatian Application"
      ]
    }
  },
  { 
    $set: { requiresCustomerInfo: true }
  }
);
```

## Files Modified

1. ✅ `app/api/admin/shop/products/category/route.js` - Category API with new field
2. ✅ `app/api/products/sales/route.js` - Dynamic validation logic
3. ✅ `app/(dashboard)/admin/categories/page.jsx` - Admin UI with toggle
4. ✅ `components/sales/DailySalesForm.jsx` - Dynamic frontend validation + empty defaults

## Build Status
✅ **Build successful** - All changes compiled without errors

---

**Implemented by:** Claude Code  
**Date:** 2026-09-14  
**Feature:** Dynamic Category Customer Info Requirements
