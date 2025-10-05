# UI Overlay Design Pattern - Standard Template

## 📋 OVERVIEW

This document establishes the **standardized overlay design pattern** for all data viewing and action interfaces in SMARTLIAS. This pattern ensures consistent UI/UX across all admin overlays, forms, and detail views.

## 🎯 DESIGN PRINCIPLES

### **Fixed Header & Footer Architecture**
- **Fixed Header**: Contains title, close button, and contextual actions
- **Scrollable Content**: Main content area with consistent padding
- **Sticky Footer**: Action buttons positioned at bottom for easy access

### **Consistent Spacing Rules**
- **Header Padding**: `p-4` (16px on all sides)
- **Content Padding**: `p-4` (16px on all sides) 
- **Footer Padding**: `px-6 py-3` (24px horizontal, 12px vertical)
- **Scrollable Bottom Padding**: `pb-12` (48px to prevent content cutoff)

## 🏗️ STANDARD TEMPLATE STRUCTURE

```jsx
{/* Overlay Container */}
<div className="fixed inset-y-0 right-0 w-full sm:w-2/3 lg:w-1/2 xl:w-2/5 bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-out translate-x-0">
  
  {/* Fixed Header */}
  <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 p-4">
    <div className="flex items-center justify-between">
      {/* Title Section */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[color]-100 flex items-center justify-center text-[color]-600 text-sm">
          <i className="bi bi-[icon]" />
        </div>
        <div>
          <h1 className="text-sm font-medium tracking-normal antialiased text-gray-900">
            [Title Text]
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            [Subtitle/Description]
          </p>
        </div>
      </div>
      
      {/* Close Button */}
      <button
        type="button"
        className="inline-flex items-center justify-center w-7 h-7 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
        onClick={onClose}
      >
        <i className="bi bi-x text-xl" />
      </button>
    </div>
  </div>

  {/* Scrollable Content */}
  <div className="h-full overflow-y-auto pb-12">
    <div className="p-4">
      {/* Content Cards */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        {/* Your content here */}
      </div>
    </div>
  </div>

  {/* Sticky Footer */}
  <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-end space-x-2">
    {/* Action Buttons */}
    <button type="button" className="[button-classes]">
      Cancel
    </button>
    <button type="button" className="[button-classes]">
      Primary Action
    </button>
  </div>
</div>
```

## 🎨 RESPONSIVE BREAKPOINTS

```jsx
// Overlay Width (Responsive)
className="w-full sm:w-2/3 lg:w-1/2 xl:w-2/5"

// Breakpoint Behavior:
// Mobile (< 640px): Full width overlay
// Small (640px+): 2/3 of screen width  
// Large (1024px+): 1/2 of screen width
// Extra Large (1280px+): 2/5 of screen width
```

## 🔧 ANIMATION SYSTEM

```jsx
// Overlay Animation Classes
className="transform transition-transform duration-300 ease-out"

// States:
// - Visible: "translate-x-0"
// - Hidden: "translate-x-full"

// Implementation:
{isVisible && (
  <div className={`fixed inset-y-0 right-0 ... transform transition-transform duration-300 ease-out ${
    isVisible ? 'translate-x-0' : 'translate-x-full'
  }`}>
)}
```

## 📏 SPACING SPECIFICATIONS

### **Container Spacing**
```jsx
// Fixed Header
className="p-4"                    // 16px padding all sides

// Scrollable Content Container  
className="pb-12"                  // 48px bottom padding (prevents footer cutoff)

// Content Wrapper
className="p-4"                    // 16px padding all sides

// Sticky Footer
className="px-6 py-3"              // 24px horizontal, 12px vertical
```

### **Visual Hierarchy**
```jsx
// Card Containers
className="bg-white p-5 rounded-lg shadow-sm border border-gray-200"

// Section Headers (inside cards)
className="mb-4 pb-3 border-b border-gray-200"

// Form Groups
className="mb-3"                   // 12px spacing between form elements

// Button Groups (in footer)
className="space-x-2"              // 8px spacing between buttons
```

## 🎯 COMPONENT SPECIFICATIONS

### **Header Icon Container**
```jsx
className="w-7 h-7 rounded-full bg-[color]-100 flex items-center justify-center text-[color]-600 text-sm"

// Color Schemes:
// - Create/Add: bg-green-100 text-green-600
// - Edit: bg-blue-100 text-blue-600  
// - View: bg-gray-100 text-gray-600
// - Delete: bg-red-100 text-red-600
```

### **Title Typography**
```jsx
// Main Title
className="text-sm font-medium tracking-normal antialiased text-gray-900"

// Subtitle
className="text-xs text-gray-500 mt-0.5"
```

### **Close Button**
```jsx
className="inline-flex items-center justify-center w-7 h-7 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
```

### **Action Buttons (Footer)**
```jsx
// Cancel/Secondary Button
className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-1 focus:ring-gray-500 transition-colors cursor-pointer h-9"

// Primary Action Button
className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer h-9"

// Success Action Button (Publish, Submit)
className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 focus:ring-1 focus:ring-green-500 transition-colors cursor-pointer h-9"
```

## 📋 IMPLEMENTATION EXAMPLES

### **Current Implementations**
1. **ResidentsView.jsx** - ✅ Reference Implementation
2. **AddAnnouncementView.jsx** - ✅ Follows Pattern  
3. **AnnouncementDetailView.jsx** - ✅ Follows Pattern

### **Pattern Variations by Context**

#### **View/Detail Overlays**
- **Header**: Entity name + icon
- **Content**: Read-only information cards
- **Footer**: Close + Edit/Action buttons

#### **Create/Add Overlays**  
- **Header**: "Add [Entity]" + icon
- **Content**: Form fields in cards
- **Footer**: Cancel + Save/Create buttons

#### **Edit Overlays**
- **Header**: "Edit [Entity]" + icon  
- **Content**: Editable form fields
- **Footer**: Cancel + Save Changes buttons

## 🔍 QUALITY CHECKLIST

Before implementing any new overlay, verify:

- [ ] **Fixed Header**: Contains title, icon, close button with `p-4` padding
- [ ] **Scrollable Content**: Uses `pb-12` and `p-4` pattern
- [ ] **Sticky Footer**: Uses `px-6 py-3` with action buttons
- [ ] **Responsive Width**: Uses `w-full sm:w-2/3 lg:w-1/2 xl:w-2/5`
- [ ] **Smooth Animation**: Uses `transition-transform duration-300 ease-out`
- [ ] **Consistent Spacing**: Matches documented padding/margin values
- [ ] **Proper Z-Index**: Uses `z-50` to appear above other content
- [ ] **Semantic Colors**: Uses appropriate color scheme for context
- [ ] **Button Heights**: All buttons use `h-9` (36px) for consistency
- [ ] **Touch Targets**: Minimum 36px for mobile accessibility

## 🚀 FUTURE IMPLEMENTATIONS

When creating new overlays or modifying existing ones:

1. **Copy this exact structure** as your starting template
2. **Customize content area** while maintaining header/footer
3. **Update icon and colors** based on context (create/edit/view)
4. **Adjust button text and actions** for specific functionality
5. **Test responsive behavior** across all breakpoints
6. **Verify animation smoothness** and proper z-index stacking

## 📝 MAINTENANCE NOTES

- **Reference File**: Use `ResidentsView.jsx` as the canonical implementation
- **Update Policy**: Any changes to this pattern must be applied to ALL overlays
- **Consistency Check**: Regularly audit all overlays against this documentation
- **Performance**: This pattern is optimized for smooth 60fps animations

---

**Pattern Version**: 1.0  
**Last Updated**: October 5, 2025  
**Reference Implementation**: `/frontend/components/authenticated/admin/ResidentsView.jsx`  
**Applies To**: All admin overlays, detail views, forms, and data action interfaces
