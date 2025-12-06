# Design System Documentation

## Overview

This application follows a modern dark mode design with green accent colors. The design is heavily inspired by components from [ReactBits](https://reactbits.dev/components) and [Untitled UI](https://www.untitledui.com/), adapted to our dark theme with green accents.

---

## Color Palette

### Primary Colors
```css
Primary Green: #5ED591 (rgb(94, 213, 145))
Green Light: #4FFFB0 (rgb(79, 255, 176))
Green Dark: #2BA86F (rgb(43, 168, 111))
```

### Background Colors
```css
Primary Background: gray-950 (#030712)
Secondary Background: gray-900 (#111827)
Card Background: gray-900/50 (50% opacity)
Hover Background: gray-900/30 (30% opacity)
```

### Text Colors
```css
Primary Text: white (#ffffff)
Secondary Text: gray-400 (#9ca3af)
Tertiary Text: gray-500 (#6b7280)
Disabled Text: gray-600 (#4b5563)
```

### Border Colors
```css
Default Border: gray-800 (#1f2937)
Input Border: gray-700 (#374151)
Divider: gray-800 (#1f2937)
```

### Status Colors
```css
Success: green-500 (#10b981)
Error/Destructive: red-500 (#ef4444)
Warning: yellow-500 (#eab308)
Info: blue-500 (#3b82f6)
Pending: yellow-500 (#eab308)
```

---

## Typography

### Font Family
- **Default**: System font stack (Inter, SF Pro, -apple-system, etc.)
- **Monospace**: For code or data (Menlo, Monaco, Courier New)

### Font Sizes
```css
text-xs: 0.75rem (12px)      - Small labels, badges, helper text
text-sm: 0.875rem (14px)     - Body text, table cells, form inputs
text-base: 1rem (16px)       - Default body text
text-lg: 1.125rem (18px)     - Section headings
text-xl: 1.25rem (20px)      - Page titles
text-2xl: 1.5rem (24px)      - Modal titles
```

### Font Weights
```css
font-normal: 400    - Body text
font-medium: 500    - Emphasized text, labels
font-semibold: 600  - Headings, important text
font-bold: 700      - Rarely used
```

---

## Components

### Buttons

#### Variants

**1. Primary (Filled Green)**
```tsx
<Button variant="primary" size="md">
  Primary Action
</Button>
```
- Background: `bg-green-500`
- Text: `text-white`
- Border: `border-green-500`
- Hover: `hover:bg-green-600`

**2. Secondary Success (Outline Green)**
```tsx
<Button variant="secondary-success" size="md">
  <PlayIcon className="w-4 h-4 mr-1.5" />
  Process
</Button>
```
- Background: `transparent`
- Text: `text-green-500`
- Border: `border border-green-500`
- Hover: `hover:bg-green-500/10`

**3. Secondary Destructive (Outline Red)**
```tsx
<Button variant="secondary-destructive" size="md">
  <TrashIcon className="w-4 h-4 mr-1.5" />
  Delete
</Button>
```
- Background: `transparent`
- Text: `text-red-500`
- Border: `border border-red-500`
- Hover: `hover:bg-red-500/10`

**4. Secondary (Outline Gray)**
```tsx
<Button variant="secondary" size="md">
  Cancel
</Button>
```
- Background: `transparent`
- Text: `text-gray-200`
- Border: `border border-gray-600`
- Hover: `hover:bg-gray-800`

#### Sizes
```tsx
size="sm"   - px-2.5 py-1.5 text-xs
size="md"   - px-3 py-1.5 text-sm
size="lg"   - px-4 py-2 text-sm
size="xl"   - px-5 py-2.5 text-base
```

#### States
- **Disabled**: `opacity-50 cursor-not-allowed`
- **Loading**: Spinner icon with `mr-2`
- **Focus**: `focus:ring-2 focus:ring-green-500`

---

### Form Elements

#### Text Inputs
```tsx
<input
  type="text"
  className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white
             placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
/>
```

#### Select Dropdowns
```tsx
<select className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white
                   focus:outline-none focus:ring-2 focus:ring-green-500">
  <option value="option1">Option 1</option>
</select>
```

#### Checkboxes
```tsx
<input
  type="checkbox"
  className="form-checkbox w-4 h-4 rounded border-gray-700 bg-gray-900
             text-green-500 focus:ring-2 focus:ring-green-500
             cursor-pointer transition-colors"
/>
```
- **Unchecked**: Gray border (`border-gray-700`), dark background
- **Checked**: Green checkmark (`text-green-500`)
- **Focus**: Green ring

---

### Tables

#### Structure
```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-gray-800">
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
        Header
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-800">
    <tr className="hover:bg-gray-900/30 transition-colors cursor-pointer">
      <td className="px-4 py-3 text-sm text-white">
        Cell Content
      </td>
    </tr>
  </tbody>
</table>
```

#### Table Specifications
- **Header**: `text-xs font-medium text-gray-400`
- **Row Hover**: `hover:bg-gray-900/30`
- **Selected Row**: `bg-gray-900/50`
- **Cell Padding**: `px-4 py-3`
- **Borders**: `border-gray-800`
- **Sortable Headers**: Show arrow icons in green (`text-green-500`)

---

### Cards & Containers

#### Card Container
```tsx
<div className="bg-gray-950 rounded-lg border border-gray-900 p-6">
  Card Content
</div>
```

#### Panel/Section
```tsx
<div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
  Panel Content
</div>
```

---

### Modals

#### Full-Screen Modal (95vh x 95vw)
```tsx
<Dialog.Panel className="w-[95vw] h-[95vh] max-w-[1800px]
                         transform overflow-hidden rounded-2xl
                         bg-gray-950 border border-gray-800 shadow-xl">
  {/* Modal Header */}
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
    <Dialog.Title className="text-xl font-semibold text-white">
      Modal Title
    </Dialog.Title>
    <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
      <XMarkIcon className="w-5 h-5" />
    </button>
  </div>

  {/* Modal Content */}
  <div className="flex-1 overflow-hidden">
    Content
  </div>
</Dialog.Panel>
```

#### Modal Backdrop
```tsx
<div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
```

---

### Badges & Status Indicators

#### Status Badge
```tsx
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
  <span className="w-1.5 h-1.5 rounded-full mr-1.5"></span>
  Status
</span>
```

**Status Colors:**
- **Pending**: `bg-yellow-900/20 border border-yellow-500/30 text-yellow-400`
- **Processing**: `bg-blue-900/20 border border-blue-500/30 text-blue-400`
- **Completed**: `bg-green-900/20 border border-green-500/30 text-green-400`
- **Error**: `bg-red-900/20 border border-red-500/30 text-red-400`

---

### Icons

**Icon Library**: `@heroicons/react/24/outline` (Heroicons v2 - Outline style)

#### Icon Sizing
```tsx
w-3.5 h-3.5  - Small icons in buttons (14px)
w-4 h-4      - Default icons (16px)
w-5 h-5      - Medium icons (20px)
w-6 h-6      - Large icons (24px)
```

#### Icon Colors
- Default: `text-gray-400`
- Hover: `text-white` or `text-green-500`
- Success: `text-green-500`
- Error: `text-red-500`
- Warning: `text-yellow-500`

**Always use outline icons** - thin, minimal style that matches the app's aesthetic.

---

### Notifications & Alerts

#### Success Notification
```tsx
<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
  <div className="flex items-center gap-2">
    <CheckCircleIcon className="w-5 h-5 text-green-400" />
    <div>
      <p className="text-sm font-medium text-white">Success Message</p>
      <p className="text-xs text-gray-400">Details</p>
    </div>
  </div>
</div>
```

#### Error Notification
```tsx
<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
  <div className="flex items-center gap-3">
    <XCircleIcon className="w-5 h-5 text-red-500" />
    <div>
      <p className="text-sm font-medium text-red-400">Error Message</p>
      <p className="text-xs text-gray-400">Details</p>
    </div>
  </div>
</div>
```

---

## Spacing & Layout

### Container Widths
```css
max-w-7xl    - Main content container (1280px)
max-w-md     - Form containers (448px)
max-w-[1800px] - Large modals
w-[95vw]     - Modal width
h-[95vh]     - Modal height
```

### Padding Scale
```css
p-1.5  - 6px   - Tight spacing
p-2    - 8px   - Small spacing
p-3    - 12px  - Default spacing
p-4    - 16px  - Medium spacing
p-6    - 24px  - Large spacing
p-8    - 32px  - Extra large spacing
```

### Gap/Space Scale
```css
gap-1     - 4px
gap-2     - 8px
gap-3     - 12px
space-x-3 - 12px horizontal spacing
space-y-3 - 12px vertical spacing
```

---

## Border Radius

```css
rounded-md    - 6px   - Small elements (buttons, inputs)
rounded-lg    - 8px   - Cards, containers
rounded-xl    - 12px  - Large containers
rounded-2xl   - 16px  - Modals
rounded-full  - 9999px - Badges, avatars
```

---

## Transitions & Animations

### Standard Transition
```css
transition-colors - Color changes (200ms)
transition-all    - All properties (200ms)
```

### Hover States
- **Buttons**: `hover:bg-green-500/10` (10% opacity overlay)
- **Table Rows**: `hover:bg-gray-900/30` (30% opacity overlay)
- **Icon Buttons**: `hover:text-white hover:bg-gray-800`

### Loading Spinner
```tsx
<div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
```

---

## Drag & Drop Areas

```tsx
<div className="border-2 border-dashed border-gray-700 hover:border-gray-600
                bg-gray-900/50 rounded-lg p-8 cursor-pointer
                transition-all duration-200">
  <div className="flex flex-col items-center">
    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
      <ArrowUpTrayIcon className="w-8 h-8 text-gray-400" />
    </div>
    <p className="text-lg font-medium text-white mt-4">
      Drop files or click to upload
    </p>
    <p className="text-sm text-gray-400 mt-1">
      Supports: Excel, CSV, PDF, Images (max 10MB)
    </p>
  </div>
</div>
```

**Active Drag State:**
```css
border-green-500 bg-green-500/10
```

---

## File Upload Progress

```tsx
<div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
  <div className="flex items-center space-x-3 mb-3">
    <DocumentIcon className="w-5 h-5 text-gray-400" />
    <div className="flex-1">
      <p className="text-sm font-medium text-white truncate">
        filename.pdf
      </p>
      <p className="text-xs text-gray-500">1.23 MB</p>
    </div>
  </div>

  {/* Progress Bar */}
  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
    <div className="h-full bg-gradient-to-r from-green-500 to-green-400
                    transition-all duration-300"
         style={{ width: '60%' }} />
  </div>
  <div className="flex justify-between text-xs text-gray-400 mt-1">
    <span>Uploading...</span>
    <span>60%</span>
  </div>
</div>
```

---

## Sidebar Navigation

```tsx
<nav className="w-16 bg-gray-900 border-r border-gray-800">
  <div className="flex flex-col items-center py-4 space-y-2">
    <button className="p-3 rounded-lg text-gray-400 hover:text-white
                       hover:bg-gray-800 transition-colors">
      <HomeIcon className="w-5 h-5" />
    </button>
  </div>
</nav>
```

**Active State:**
```css
bg-green-500/10 text-green-500
```

---

## Design Principles

### 1. Dark Mode First
- All components designed for dark backgrounds
- High contrast for readability
- Green accents for primary actions and success states

### 2. Consistent Spacing
- Use Tailwind's spacing scale (4px base unit)
- Consistent padding: px-4 py-3 for most elements
- Consistent gaps: gap-2, gap-3, space-x-3

### 3. Subtle Interactions
- 10% opacity overlays for hover states
- Smooth transitions (200ms)
- Clear focus states with green rings

### 4. Thin Borders & Outlines
- Prefer outline/ghost buttons over filled
- Single pixel borders (`border` not `border-2`)
- Dashed borders for drop zones

### 5. Icon-First Design
- Use Heroicons outline style exclusively
- Always pair icons with text in buttons
- Consistent icon sizing (w-4 h-4 for most cases)

### 6. Responsive & Adaptive
- Mobile-first approach
- Responsive padding (px-4 sm:px-6 lg:px-8)
- Adaptive layouts with flexbox and grid

---

## Component Sources

### Primary Inspiration
1. **ReactBits** (https://reactbits.dev/components)
   - Table designs and patterns
   - Form components
   - Modal layouts

2. **Untitled UI** (https://www.untitledui.com/)
   - Button variants and states
   - Badge designs
   - Navigation patterns
   - Color system approach

### Customizations
All components are adapted from these sources with:
- Dark mode color scheme (gray-950/gray-900 backgrounds)
- Green accent color (#5ED591)
- Outline-first button design
- Thin, minimal borders
- Consistent spacing and typography

---

## File Structure

```
src/
├── components/
│   ├── Button.tsx                    # Reusable button component
│   ├── FileUploader.tsx              # Drag & drop file uploader
│   ├── ConfirmationModal.tsx         # Confirmation dialogs
│   └── FileDetailsModal/             # Full-screen file viewer modal
│       ├── FileDetailsModal.tsx
│       ├── FilePreview.tsx
│       └── ExtractedDataPanel.tsx
├── pages/
│   └── FileUpload.tsx                # Main upload page
└── styles/
    └── (Tailwind CSS configuration)
```

---

## Future Consistency Guidelines

When building new pages or components:

1. ✅ **Use the Button component** - Don't create custom button styles
2. ✅ **Follow the color palette** - Use defined colors consistently
3. ✅ **Use Heroicons outline icons** - No filled or custom icons
4. ✅ **Match spacing patterns** - px-4 py-3, gap-3, space-x-3
5. ✅ **Keep borders thin** - Single pixel borders, not bold
6. ✅ **Use outline buttons** - Prefer secondary-success/destructive variants
7. ✅ **Add hover states** - 10% opacity overlays for interactive elements
8. ✅ **Implement focus rings** - Green rings (ring-2 ring-green-500)
9. ✅ **Test in dark mode** - All components must work on dark backgrounds
10. ✅ **Reference ReactBits/Untitled UI** - Check these sources for patterns

---

## Quick Reference

### Most Common Classes

**Container:**
```css
bg-gray-950 rounded-lg border border-gray-900 p-6
```

**Button (Success):**
```css
border border-green-500 text-green-500 bg-transparent hover:bg-green-500/10
```

**Input:**
```css
px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:ring-2 focus:ring-green-500
```

**Table Row:**
```css
hover:bg-gray-900/30 transition-colors cursor-pointer
```

**Badge:**
```css
px-2 py-1 rounded-full text-xs bg-green-900/20 border border-green-500/30 text-green-400
```

---

## Resources

- **Tailwind CSS Documentation**: https://tailwindcss.com/docs
- **Heroicons**: https://heroicons.com/
- **ReactBits Components**: https://reactbits.dev/components
- **Untitled UI**: https://www.untitledui.com/
- **Headless UI**: https://headlessui.com/ (for modals, dropdowns)

---

**Last Updated**: December 6, 2025
