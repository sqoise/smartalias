# Modal Usage Guide

The common Modal component provides consistent styling, sizing, and behavior across the application. It features uniform button design with "Back" and "Yes, Confirm" patterns and contextual colors for safe (green) vs. dangerous (red) actions.

## Basic Usage

```jsx
import Modal from '../components/common/Modal'

// Simple alert modal
<Modal
  open={showAlert}
  onClose={() => setShowAlert(false)}
  title="Alert Title"
  type="alert"
>
  <p>Your alert message here.</p>
</Modal>

// Safe confirmation modal (green confirm button)
<Modal
  open={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="Confirm Action"
  type="confirm"
  variant="safe"
  confirmText="Yes, Save"
  onConfirm={handleSave}
>
  <p>Are you sure you want to save these changes?</p>
</Modal>

// Dangerous confirmation modal (red confirm button)
<Modal
  open={showDelete}
  onClose={() => setShowDelete(false)}
  title="Delete Item"
  type="confirm"
  variant="danger"
  confirmText="Yes, Delete"
  onConfirm={handleDelete}
>
  <p>This action cannot be undone. Are you sure?</p>
</Modal>

// Custom modal with footer
<Modal
  open={showCustom}
  onClose={() => setShowCustom(false)}
  title="Custom Modal"
  subtitle="Optional subtitle"
  size="lg"
  type="custom"
  footer={
    <div className="flex gap-3">
      <button onClick={() => setShowCustom(false)}>Back</button>
      <button onClick={handleSave}>Yes, Confirm</button>
    </div>
  }
>
  <div>Custom content here</div>
</Modal>
```

## Props Reference

### Core Props
- `open` or `isOpen` (boolean) - Controls modal visibility
- `onClose` (function) - Callback when modal should be closed
- `title` (string) - Modal title
- `subtitle` (string) - Optional subtitle below title
- `children` (ReactNode) - Modal body content

### Layout Props
- `size` (string) - Modal width: 'sm' | 'md' | 'lg' | 'xl' | '2xl' (default: 'md')
- `footer` (ReactNode) - Custom footer content (overrides type-based footer)

### Behavior Props
- `closeOnBackdrop` (boolean) - Close when clicking backdrop (default: true)
- `closeOnEscape` (boolean) - Close when pressing Escape (default: true)

### Button Props
- `type` (string) - Modal type: 'alert' | 'confirm' | 'custom' (default: 'custom')
- `variant` (string) - Button color variant: 'safe' | 'danger' (default: 'safe')
- `confirmText` (string) - Text for confirm button (default: 'Yes, Confirm')
- `cancelText` (string) - Text for cancel button (default: 'Back')
- `onConfirm` (function) - Callback for confirm action
- `confirmDisabled` (boolean) - Disable confirm button (default: false)
- `confirmLoading` (boolean) - Show loading state on confirm button (default: false)
- `confirmLoadingText` (string) - Text to show when loading (default: 'Please wait...')
- `confirmButtonClass` (string) - Custom CSS classes for confirm button (overrides variant)
- `cancelButtonClass` (string) - Custom CSS classes for cancel button

## Size Reference

## Button Variants

The Modal component now uses uniform button design with contextual colors:

### Safe Actions (Green Confirm Button)
Use `variant="safe"` for positive, non-destructive actions:
- Saving changes
- Submitting forms
- Creating new items
- Confirming safe operations

### Dangerous Actions (Red Confirm Button)  
Use `variant="danger"` for destructive or irreversible actions:
- Deleting items
- Removing data
- Canceling important processes
- Any action that can't be undone

### Button Text Standards
- **Cancel/Back Button**: Always "Back" (gray styling)
- **Confirm Button**: "Yes, [Action]" pattern
  - "Yes, Save" (safe actions)
  - "Yes, Delete" (dangerous actions)
  - "Yes, Submit" (form submissions)
  - "Yes, Confirm" (generic confirmations)

## Design Patterns

### 1. Alert Modal
Use for simple notifications that require acknowledgment:

```jsx
<Modal
  open={showAlert}
  onClose={() => setShowAlert(false)}
  title="Success"
  type="alert"
  size="sm"
>
  <p>Your changes have been saved.</p>
</Modal>
```

### 2. Safe Confirmation Modal
Use for positive, non-destructive actions:

```jsx
<Modal
  open={showSave}
  onClose={() => setShowSave(false)}
  title="Save Changes"
  type="confirm"
  variant="safe"
  confirmText="Yes, Save"
  onConfirm={handleSave}
>
  <p>Do you want to save your changes?</p>
</Modal>
```

### 3. Dangerous Confirmation Modal
Use for destructive or irreversible actions:

```jsx
<Modal
  open={showDelete}
  onClose={() => setShowDelete(false)}
  title="Delete Item"
  type="confirm"
  variant="danger"
  confirmText="Yes, Delete"
  onConfirm={handleDelete}
>
  <p>This action cannot be undone. Are you sure?</p>
</Modal>
```

### 4. Loading State Modal
Use for actions that take time to complete:

```jsx
<Modal
  open={showSubmit}
  onClose={() => setShowSubmit(false)}
  title="Submit Request"
  type="confirm"
  variant="safe"
  confirmText="Yes, Submit"
  confirmLoading={isSubmitting}
  confirmLoadingText="Submitting..."
  onConfirm={handleSubmit}
>
  <p>Ready to submit your request?</p>
</Modal>
```

### 3. Form Modal
Use for input forms and complex interactions:

```jsx
<Modal
  open={showForm}
  onClose={() => setShowForm(false)}
  title="Edit Profile"
  subtitle="Update your information"
  size="lg"
  type="custom"
  footer={
    <div className="flex gap-3">
      <button
        onClick={() => setShowForm(false)}
        className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        className="flex-1 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded"
      >
        Save Changes
      </button>
    </div>
  }
>
  <form className="space-y-4">
    {/* Form fields */}
  </form>
</Modal>
```

### 4. Content Modal
Use for displaying detailed information:

```jsx
<Modal
  open={showDetails}
  onClose={() => setShowDetails(false)}
  title="Resident Details"
  subtitle="Complete information"
  size="xl"
  type="custom"
>
  <div className="space-y-4">
    {/* Detailed content */}
  </div>
</Modal>
```

## Styling Guidelines

### Consistent Button Styles
Use these classes for modal buttons to maintain consistency:

```jsx
// Cancel/Secondary Button
className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"

// Primary Button
className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"

// Danger Button
className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors"
```

### Loading States
For buttons with loading states:

```jsx
<button
  onClick={handleSubmit}
  disabled={isLoading}
  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>
  {isLoading ? 'Saving...' : 'Save'}
</button>
```

## Accessibility Features

The Modal component includes built-in accessibility features:

- **Focus Management**: Traps focus within modal
- **Keyboard Navigation**: Escape key to close (configurable)
- **ARIA Attributes**: Proper modal, dialog roles
- **Screen Reader Support**: Accessible labels and descriptions
- **Body Scroll Lock**: Prevents background scrolling

## Migration from Custom Modals

To convert existing custom modals to use the common Modal component:

1. **Replace the modal container** with `<Modal>` component
2. **Move title** to `title` prop
3. **Move content** to `children`
4. **Move buttons** to `footer` prop or use `type="confirm"`
5. **Set appropriate size** based on content
6. **Add proper accessibility** props if needed

### Before (Custom Modal)
```jsx
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-96">
      <h3 className="text-lg font-semibold mb-4">Title</h3>
      <div className="mb-6">Content</div>
      <div className="flex gap-3">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    </div>
  </div>
)}
```

### After (Common Modal)
```jsx
<Modal
  open={showModal}
  onClose={onCancel}
  title="Title"
  type="confirm"
  onConfirm={onConfirm}
>
  Content
</Modal>
```

## Best Practices

1. **Use appropriate sizes** - Don't make modals larger than needed
2. **Provide clear titles** - Help users understand the modal purpose
3. **Use consistent button styling** - Follow the design system
4. **Handle loading states** - Show feedback during async operations
5. **Consider mobile experience** - Test on small screens
6. **Manage focus properly** - Modal handles this automatically
7. **Use semantic HTML** - Modal provides proper structure
8. **Test keyboard navigation** - Ensure all interactions work with keyboard

## Common Patterns

### Delete Confirmation
```jsx
<Modal
  open={showDeleteConfirm}
  onClose={() => setShowDeleteConfirm(false)}
  title="Delete Resident"
  type="confirm"
  confirmText="Delete"
  cancelText="Cancel"
  onConfirm={handleDelete}
  confirmButtonClass="text-white bg-red-600 hover:bg-red-700"
>
  <p>Are you sure you want to delete <strong>{resident.name}</strong>?</p>
  <p className="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
</Modal>
```

### Success Notification
```jsx
<Modal
  open={showSuccess}
  onClose={() => setShowSuccess(false)}
  title="Success"
  type="alert"
  size="sm"
>
  <div className="text-center">
    <div className="text-4xl mb-2">✅</div>
    <p>Your request has been submitted successfully.</p>
  </div>
</Modal>
```

### Form with Validation
```jsx
<Modal
  open={showEditForm}
  onClose={() => setShowEditForm(false)}
  title="Edit Information"
  size="lg"
  type="custom"
  footer={
    <div className="flex gap-3">
      <button
        onClick={() => setShowEditForm(false)}
        className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={!isFormValid || isSaving}
        className="flex-1 px-4 py-2 text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  }
>
  <form className="space-y-4">
    {/* Form fields with validation */}
  </form>
</Modal>
```
