# StockSense — UI Component Kit & Documentation

> **Target Audience:** Member 1, Member 2, Member 3  
> **Location:** `client/src/components/ui/`  
> All components are fully responsive, accessible, dark-mode ready, and styled via Tailwind CSS v4.

---

## Index of Available Components

1. [Button](#1-button)
2. [Input, Textarea & Select](#2-input-textarea--select)
3. [Combobox](#3-combobox-searchable-select)
4. [DateInput & Checkbox](#4-dateinput--checkbox)
5. [FormField](#5-formfield)
6. [Badge, StatusBadge & DirectionBadge](#6-badges)
7. [Card & StatCard](#7-cards)
8. [DataTable](#8-datatable)
9. [Pagination](#9-pagination)
10. [Modal, ConfirmDialog & Drawer](#10-dialogs--overlays)
11. [Tabs, DropdownMenu & Tooltip](#11-navigation--menus)
12. [Skeleton, Spinner, EmptyState & ErrorState](#12-feedback--loading)
13. [PageHeader](#13-pageheader)
14. [SearchInput, FilterChips & ViewToggle](#14-filters--search)
15. [StatusPipeline & KanbanBoard](#15-operations-specialized)
16. [Toaster](#16-toaster)

---

### 1. Button
Standard accessible action button supporting icons, loading spinner, and semantic variants.

**Props:**
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'primary'\|'secondary'\|'ghost'\|'danger'\|'outline'` | `'primary'` | Visual style |
| `size` | `'sm'\|'md'\|'lg'` | `'md'` | Height and padding |
| `loading` | `boolean` | `false` | Shows loading spinner |
| `icon` | `ReactNode` | — | Left-aligned icon |
| `iconRight` | `ReactNode` | — | Right-aligned icon |
| `disabled` | `boolean` | `false` | Disabled state |

**Example:**
```jsx
import { Button } from '@/components/ui/Button.jsx';
import { Plus } from 'lucide-react';

<Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreate}>
  Create Receipt
</Button>
```

---

### 2. Input, Textarea & Select
Native form inputs styled to the design system with error states.

**Example:**
```jsx
import { Input } from '@/components/ui/Input.jsx';
import { Select } from '@/components/ui/Select.jsx';

<Input placeholder="Search references..." error={errors.query?.message} />
<Select options={[{ value: 'WH', label: 'Main Warehouse' }]} />
```

---

### 3. Combobox (Searchable Select)
Searchable combobox for selecting items (Products, Contacts, Locations). Supports local filtering or async query via `onSearch`.

**Props:**
- `options`: `Array<{ value: string, label: string, description?: string }>`
- `value`: `string`
- `onChange`: `(val: string) => void`
- `placeholder`: `string`
- `loading`: `boolean`
- `onSearch`: `(query: string) => void`

**Example:**
```jsx
<Combobox
  options={products.map(p => ({ value: p.id, label: `${p.sku} - ${p.name}` }))}
  value={selectedId}
  onChange={setSelectedId}
  placeholder="Select product..."
/>
```

---

### 4. DateInput & Checkbox
Formatted date picker with icon and accessible custom checkbox.

**Example:**
```jsx
<DateInput value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
<Checkbox label="Active Location" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
```

---

### 5. FormField
Accessible form field wrapper providing label, mandatory asterisk, helper hint, and inline error.

**Example:**
```jsx
<FormField label="Warehouse Code" required error={errors.shortCode?.message} hint="Max 5 capital letters">
  <Input {...register('shortCode')} />
</FormField>
```

---

### 6. Badges
- `<Badge variant="teal|amber|rose|sky|emerald|zinc">`: Generic tag.
- `<StatusBadge status="DRAFT|WAITING|READY|DONE|CANCELED">`: Automatically maps to document lifecycle colors.
- `<DirectionBadge type="RECEIPT|DELIVERY|INTERNAL|ADJUSTMENT">`: Displays movement type with direction code (`IN`, `OUT`, `INT`, `ADJ`).

---

### 7. Cards
- `<Card>`: Surface wrapper with `<CardHeader>`, `<CardBody>`, and `<CardFooter>`.
- `<StatCard title="Total On Hand" value="4,210" delta="+8%" isPositive icon={<Box />} />`: Metric tile.

---

### 8. DataTable
High-performance table with sticky headers, column sorting, skeleton loading rows, and empty state.

**Example:**
```jsx
<DataTable
  columns={[
    { key: 'reference', header: 'Reference', sortable: true },
    { key: 'status', header: 'Status', render: row => <StatusBadge status={row.status} /> },
  ]}
  data={operations}
  loading={loading}
  onRowClick={row => navigate(`/operations/${row.id}`)}
/>
```

---

### 9. Pagination
Integrated pagination bar with record range summary and rows-per-page selector.

---

### 10. Dialogs & Overlays
- `<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Title" footer={...}>`: Centered dialog.
- `<ConfirmDialog isOpen={isOpen} onConfirm={handleDelete} isDanger message="..." />`: Simple confirm dialog.
- `<Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} side="right">`: Slide-out panel for forms.

---

### 11. Navigation & Menus
- `<Tabs tabs={[{ id: 'all', label: 'All' }]} activeTab={tab} onChange={setTab} />`
- `<DropdownMenu trigger={<Button>Actions</Button>} items={[{ label: 'Print', onClick: ... }]} />`
- `<Tooltip content="Filter stock">...</Tooltip>`

---

### 12. Feedback & Loading
- `<Skeleton className="h-6 w-32" />`
- `<Spinner size="md" />`
- `<EmptyState title="No deliveries found" action={<Button>New</Button>} />`
- `<ErrorState onRetry={refetch} />`

---

### 13. PageHeader
Standard page header with breadcrumbs, title, subtitle, and action buttons.

---

### 14. Filters & Search
- `<SearchInput value={query} onChange={setQuery} />`: Debounced text search with `/` shortcut.
- `<FilterChips filters={activeFilters} onRemove={handleRemove} onClearAll={handleClear} />`
- `<ViewToggle view={view} onChange={setView} />`: List / Kanban toggle.

---

### 15. Operations Specialized
- `<StatusPipeline steps={[{ id: 'DRAFT', label: 'Draft' }, { id: 'READY', label: 'Ready' }, { id: 'DONE', label: 'Done' }]} currentStep="READY" />`
- `<KanbanBoard columns={columns} items={items} getItemColumnId={i => i.status} renderCard={renderCard} />`

---

### 16. Toaster
Mount `<Toaster />` once at the root of `App.jsx`. Trigger toasts using `sonner`:
```js
import { toast } from 'sonner';

toast.success('Transfer validated successfully');
toast.error('Insufficient stock');
```
