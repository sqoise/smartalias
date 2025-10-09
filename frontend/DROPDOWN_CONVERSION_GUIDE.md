# 🔄 Dropdown Conversion Guide

## 📋 Quick Reference: Converting `<select>` to `<CustomSelect>`

### **Import First**
```jsx
import CustomSelect from '../common/CustomSelect' // Adjust path as needed
```

### **Basic Conversion Pattern**

#### **Before (Native Select):**
```jsx
<select
  name="suffix"
  value={formData.suffix}
  onChange={onInputChange}
  className="w-full rounded-md px-3 py-1.5 border border-gray-300..."
>
  <option value="">Select</option>
  <option value="1">Jr.</option>
  <option value="2">Sr.</option>
  <option value="3">III</option>
</select>
```

#### **After (CustomSelect):**
```jsx
<CustomSelect
  value={formData.suffix}
  onChange={(value) => onInputChange({ target: { name: 'suffix', value } })}
  options={[
    { value: '', label: 'Select' },
    { value: '1', label: 'Jr.' },
    { value: '2', label: 'Sr.' },
    { value: '3', label: 'III' }
  ]}
  placeholder="Select"
  title="Select Suffix"
  error={!!errors.suffix}
/>
```

### **Simple String Options (Auto-converted):**
```jsx
<CustomSelect
  value={formData.gender}
  onChange={(value) => onInputChange({ target: { name: 'gender', value } })}
  options={['Male', 'Female', 'Other']} // Automatically converted to {value, label} format
  placeholder="Select Gender"
  title="Select Gender"
  error={!!errors.gender}
/>
```

### **Key Props for CustomSelect:**
- `value`: Current selected value
- `onChange`: Callback function `(value) => {}`
- `options`: Array of strings OR objects `{value, label}`
- `placeholder`: Text when nothing selected
- `title`: Mobile sheet header title
- `error`: Boolean for error styling
- `disabled`: Boolean for disabled state
- `className`: Additional CSS classes
- `name`, `id`, `required`: Standard form attributes

### **Common Option Patterns:**

#### **Yes/No Options:**
```jsx
options={[
  { value: '', label: 'Select' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' }
]}
```

#### **Status Options:**
```jsx
options={[
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]}
```

#### **Numeric IDs with Labels:**
```jsx
options={[
  { value: '', label: 'Select Barangay' },
  { value: '1', label: 'Barangay 1' },
  { value: '2', label: 'Barangay 2' }
]}
```

## 🎯 Benefits of CustomSelect:
- ✅ **Consistent Mobile Experience**: Bottom sheet on mobile, dropdown on desktop
- ✅ **Better Touch Targets**: 50px minimum height on mobile
- ✅ **No iOS Zoom Issues**: Proper font sizing prevents auto-zoom
- ✅ **Keyboard Navigation**: Arrow keys, Enter, Escape support
- ✅ **Custom Styling**: Full control over appearance
- ✅ **Accessibility**: Better screen reader and focus management
- ✅ **Error Integration**: Built-in error state styling

## 📱 Mobile Features:
- Bottom slide-up sheet instead of tiny dropdown
- Large, easy-to-tap options (50px height)
- Custom title for each dropdown
- Backdrop to close when tapping outside
- Smooth animations and transitions
- Visual selection indicators (checkmarks)

## 🖥️ Desktop Features:
- Traditional dropdown behavior
- Hover and focus states
- Keyboard navigation with arrow keys
- Auto-scroll highlighted options into view
- Maximum height with scrolling for long lists

---

Ready to replace all your dropdowns! 🚀
