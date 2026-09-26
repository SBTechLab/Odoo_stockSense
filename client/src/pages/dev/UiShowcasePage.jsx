import { useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { DirectionBadge } from '../../components/ui/DirectionBadge.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { DateInput } from '../../components/ui/DateInput.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Combobox } from '../../components/ui/Combobox.jsx';
import { Checkbox } from '../../components/ui/Checkbox.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { ViewToggle } from '../../components/ui/ViewToggle.jsx';
import { StatusPipeline } from '../../components/ui/StatusPipeline.jsx';
import { FilterChips } from '../../components/ui/FilterChips.jsx';
import { DropdownMenu } from '../../components/ui/DropdownMenu.jsx';
import { Tooltip } from '../../components/ui/Tooltip.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Drawer } from '../../components/ui/Drawer.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  Package,
  Layers,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Sun,
  Moon,
  Plus,
  Trash2,
  MoreVertical,
  Check,
  Search,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export function UiShowcasePage() {
  const { isDark, toggleTheme } = useTheme();

  // Local interactive states for showcase
  const [btnLoading, setBtnLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [activeView, setActiveView] = useState('list');
  const [pipelineStep, setPipelineStep] = useState('draft');
  const [searchVal, setSearchVal] = useState('');
  const [comboVal, setComboVal] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sampleComboboxOptions = [
    { value: 'wh-main', label: 'Main Distribution Hub (WH-MAIN)' },
    { value: 'wh-east', label: 'East Coast Center (WH-EAST)' },
    { value: 'wh-west', label: 'West Coast Annex (WH-WEST)' },
    { value: 'wh-cold', label: 'Cold Storage Vault (WH-COLD)' },
  ];

  const sampleTableData = [
    { id: '1', ref: 'WH/IN/0001', partner: 'Acme Steel Inc.', status: 'DONE', qty: 1500, direction: 'IN' },
    { id: '2', ref: 'WH/OUT/0042', partner: 'Logitech Europe', status: 'WAITING', qty: -320, direction: 'OUT' },
    { id: '3', ref: 'WH/INT/0109', partner: 'Internal Transit', status: 'READY', qty: 45, direction: 'INT' },
    { id: '4', ref: 'WH/ADJ/0004', partner: 'Annual Cycle Count', status: 'DRAFT', qty: -12, direction: 'ADJ' },
    { id: '5', ref: 'WH/OUT/0043', partner: 'Stark Industries', status: 'CANCELED', qty: -100, direction: 'OUT' },
  ];

  const sampleTableColumns = [
    {
      key: 'ref',
      header: 'Reference',
      render: (r) => (
        <span className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
          {r.ref}
        </span>
      ),
    },
    {
      key: 'partner',
      header: 'Partner / Contact',
      render: (r) => <span className="font-medium text-zinc-900 dark:text-zinc-100">{r.partner}</span>,
    },
    {
      key: 'direction',
      header: 'Direction',
      render: (r) => <DirectionBadge direction={r.direction} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'qty',
      header: 'Quantity',
      className: 'text-right',
      render: (r) => (
        <span
          className={`font-mono font-semibold tabular-nums ${
            r.qty > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {r.qty > 0 ? `+${r.qty}` : r.qty}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-10 pb-16 max-w-6xl mx-auto">
      {/* Header with Theme Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Design System & UI Kit
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
            Component Showcase (/dev/ui)
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Enterprise SaaS tokens, components, and layout primitives for StockSense.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={toggleTheme}
            icon={isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          >
            {isDark ? 'Switch to Light' : 'Switch to Dark'}
          </Button>

          <Button
            variant="primary"
            onClick={() => toast.success('Sonner theme toast triggered!')}
          >
            Test Toast
          </Button>
        </div>
      </div>

      {/* 1. Buttons */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          Buttons (36px desktop / 40px mobile touch)
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
            With Icon
          </Button>
          <Button variant="secondary" iconRight={<ArrowRight className="w-4 h-4" />}>
            With Right Icon
          </Button>
          <Button
            variant="primary"
            loading={btnLoading}
            onClick={() => {
              setBtnLoading(true);
              setTimeout(() => setBtnLoading(false), 1500);
            }}
          >
            {btnLoading ? 'Saving...' : 'Click for Loading'}
          </Button>
          <Button variant="primary" size="sm">
            Small (32px)
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
        </div>
      </section>

      {/* 2. Status Badges & Direction Pills */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          Status Badges & Direction Pills (Soft Ring + Dot)
        </h2>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-zinc-400 w-24">Statuses:</span>
            <StatusBadge status="DRAFT" />
            <StatusBadge status="WAITING" />
            <StatusBadge status="READY" />
            <StatusBadge status="DONE" />
            <StatusBadge status="CANCELED" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-zinc-400 w-24">Directions:</span>
            <DirectionBadge direction="IN" />
            <DirectionBadge direction="OUT" />
            <DirectionBadge direction="INT" />
            <DirectionBadge direction="ADJ" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-zinc-400 w-24">Generic:</span>
            <Badge variant="teal">Teal Pill</Badge>
            <Badge variant="emerald">Emerald Pill</Badge>
            <Badge variant="amber">Amber Pill</Badge>
            <Badge variant="rose">Rose Pill</Badge>
            <Badge variant="sky">Sky Pill</Badge>
            <Badge variant="violet">Violet Pill</Badge>
            <Badge variant="zinc">Zinc Pill</Badge>
          </div>
        </div>
      </section>

      {/* 3. Form Controls & Inputs */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          Form Controls (36px desktop / 40px mobile touch)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FormField label="Standard Input" hint="Helper description text">
            <Input placeholder="Enter reference..." />
          </FormField>

          <FormField label="Search Input (/ shortcut)">
            <SearchInput
              value={searchVal}
              onChange={setSearchVal}
              placeholder="Search anything..."
            />
          </FormField>

          <FormField label="Select Dropdown" required>
            <Select defaultValue="one">
              <option value="one">Option One</option>
              <option value="two">Option Two</option>
              <option value="three">Option Three</option>
            </Select>
          </FormField>

          <FormField label="Date Input">
            <DateInput />
          </FormField>

          <FormField label="Accessible Combobox">
            <Combobox
              options={sampleComboboxOptions}
              value={comboVal}
              onChange={setComboVal}
              placeholder="Select warehouse..."
            />
          </FormField>

          <FormField label="Input with Error" error="This field is required and cannot be empty">
            <Input defaultValue="Invalid input data" error="This field is required" />
          </FormField>

          <div className="lg:col-span-3">
            <Checkbox
              label="Enable Double-Entry Ledger Validation"
              description="Transactions will be verified against on-hand reserved balances before committing moves."
              defaultChecked
            />
          </div>
        </div>
      </section>

      {/* 4. Stat Cards */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          StatCards (28px Semibold Tabular + Hover Lift)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Products in Stock"
            value="14,820"
            subtext="+120 items this week"
            icon={<Boxes className="w-5 h-5 text-teal-600" />}
          />
          <StatCard
            label="Pending Receipts"
            value="24"
            subtext="3 shipments late"
            icon={<Package className="w-5 h-5 text-sky-600" />}
          />
          <StatCard
            label="Pending Deliveries"
            value="18"
            subtext="4 waiting for stock"
            icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
          />
          <StatCard
            label="Out of Stock Alerts"
            value="2"
            subtext="Immediate reorder recommended"
            icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          />
        </div>
      </section>

      {/* 5. Stepper Pipeline & Navigation Primitives */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          Status Pipeline & Navigation Primitives
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-zinc-400 mb-2">Interactive StatusPipeline:</p>
            <StatusPipeline
              steps={[
                { id: 'draft', label: 'Draft' },
                { id: 'waiting', label: 'Waiting Availability' },
                { id: 'ready', label: 'Ready' },
                { id: 'done', label: 'Done' },
              ]}
              currentStep={pipelineStep}
              onStepClick={setPipelineStep}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-xs text-zinc-400 mb-2">Tabs Component:</p>
              <Tabs
                tabs={[
                  { id: 'all', label: 'All Operations', count: 48 },
                  { id: 'receipts', label: 'Receipts', count: 24 },
                  { id: 'deliveries', label: 'Deliveries', count: 18 },
                  { id: 'transfers', label: 'Transfers', count: 6 },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>

            <div>
              <p className="text-xs text-zinc-400 mb-2">ViewToggle Component:</p>
              <ViewToggle view={activeView} onChange={setActiveView} />
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-400 mb-1">FilterChips:</p>
            <FilterChips
              filters={[
                { key: 'type', label: 'Document', value: 'Receipts' },
                { key: 'status', label: 'Status', value: 'Ready' },
                { key: 'warehouse', label: 'Warehouse', value: 'Main Hub' },
              ]}
              onRemove={(key) => toast.info(`Removed filter: ${key}`)}
              onClearAll={() => toast.info('Cleared all filters')}
            />
          </div>
        </div>
      </section>

      {/* 6. DataTable */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          DataTable (44px rows, Tabular Numbers, Tinting)
        </h2>
        <DataTable
          columns={sampleTableColumns}
          data={sampleTableData}
          onRowClick={(row) => toast.info(`Clicked row: ${row.ref}`)}
        />
      </section>

      {/* 7. Modals, Drawers & Dialogs */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          Overlays (12px Radius, Backdrop Blur, Esc to Close)
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open Sample Modal
          </Button>

          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            Open Sample Drawer
          </Button>

          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Open Danger ConfirmDialog
          </Button>

          <DropdownMenu
            trigger={
              <Button variant="secondary" icon={<MoreVertical className="w-4 h-4" />}>
                Dropdown Menu
              </Button>
            }
            items={[
              { label: 'View Details', onClick: () => toast.info('View Details') },
              { label: 'Duplicate Entry', onClick: () => toast.info('Duplicated') },
              { label: 'Delete Record', onClick: () => toast.error('Deleted'), danger: true },
            ]}
          />

          <Tooltip content="Tooltip helper text on hover" position="top">
            <Button variant="ghost">Hover for Tooltip</Button>
          </Tooltip>
        </div>
      </section>

      {/* 8. States & Feedback */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          Empty, Error & Skeleton States
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <EmptyState
            title="No shipments pending"
            description="All orders for this warehouse have been processed and validated."
            action={<Button variant="primary" size="sm">Create New Order</Button>}
          />

          <ErrorState
            title="Failed to communicate with inventory ledger"
            message="Database connection timed out while querying stock balances."
            onRetry={() => toast.info('Retrying connection...')}
          />
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Skeleton Shimmer Sweep
          </p>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </section>

      {/* Modal Demo */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Sample Modal Title"
        description="This modal demonstrates standard backdrop blur, 12px radius, and right-aligned actions."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Confirm Action
            </Button>
          </div>
        }
      >
        <div className="py-2 text-sm text-zinc-600 dark:text-zinc-300">
          Modal content body goes here with standard typography and spacing.
        </div>
      </Modal>

      {/* Drawer Demo */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Side Detail Drawer"
        description="Inspect details without leaving current context."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="py-2 text-sm text-zinc-600 dark:text-zinc-300">
          Drawer content sliding smoothly from the right side.
        </div>
      </Drawer>

      {/* Confirm Dialog Demo */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          toast.error('Item deleted');
          setConfirmOpen(false);
        }}
        title="Delete Operation Document?"
        message="Are you sure you want to delete this operation record? This action cannot be reversed."
        confirmText="Delete Document"
        isDanger
      />
    </div>
  );
}
