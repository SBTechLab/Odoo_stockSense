import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getOperationApi } from '../../api/operations.js';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Printer, ArrowLeft, AlertCircle } from 'lucide-react';

const TITLE_MAP = {
  RECEIPT: 'GOODS RECEIPT SLIP',
  DELIVERY: 'DELIVERY NOTE & PACKING SLIP',
  INTERNAL: 'INTERNAL STOCK TRANSFER SLIP',
  ADJUSTMENT: 'INVENTORY ADJUSTMENT VOUCHER',
};

export function PrintSlipPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [operation, setOperation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOperationApi(id)
      .then((res) => {
        setOperation(res.data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load document for printing');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (operation && operation.status === 'DONE') {
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [operation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !operation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h1 className="text-lg font-semibold text-zinc-900">Document Not Found</h1>
        <p className="text-sm text-zinc-500 mt-1">{error || 'Unable to locate this operation record'}</p>
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  if (operation.status !== 'DONE') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
        <div className="max-w-md p-6 bg-white border border-amber-200 rounded-xl shadow-xs">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-zinc-900">Print Slip Not Available</h1>
          <p className="text-sm text-zinc-600 mt-2">
            Operation <strong>{operation.reference}</strong> is currently in <strong>{operation.status}</strong> status. Official printable slips can only be generated for validated (<strong>DONE</strong>) operations.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)} icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Document
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const title = TITLE_MAP[operation.type] || 'STOCK OPERATION SLIP';
  const totalQty = operation.lines?.reduce((acc, l) => acc + Number(l.quantity || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans p-6 sm:p-10 max-w-4xl mx-auto print:p-0 print:max-w-none">
      {/* Screen action bar — hidden during print */}
      <div className="print:hidden flex items-center justify-between pb-6 mb-8 border-b border-zinc-200">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Document
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">A4 Document Layout</span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer className="w-4 h-4" />}
          >
            Print Slip
          </Button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="border border-zinc-300 print:border-none p-8 rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-zinc-900">
          <div>
            <div className="text-xs uppercase tracking-widest text-teal-700 font-bold">
              StockSense Logistics & Inventory
            </div>
            <h1 className="text-2xl font-black font-mono tracking-tight mt-1 text-zinc-900">
              {title}
            </h1>
            <div className="font-mono text-base font-bold text-teal-800 mt-1">
              {operation.reference}
            </div>
          </div>
          <div className="text-right text-xs space-y-1">
            <div className="font-semibold text-zinc-900">StockSense Warehouse Ops</div>
            <div className="text-zinc-600">
              Validated:{' '}
              {operation.validatedAt
                ? new Date(operation.validatedAt).toLocaleDateString()
                : new Date().toLocaleDateString()}
            </div>
            <div className="text-zinc-500 font-mono text-[11px]">ID: {operation.id}</div>
          </div>
        </div>

        {/* Operational Context Cards */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b border-zinc-200 text-xs">
          <div className="space-y-2">
            <div>
              <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[10px] block">
                Source Location
              </span>
              <span className="font-bold text-zinc-900 text-sm">
                {operation.sourceName || '—'}
              </span>
            </div>
            <div>
              <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[10px] block">
                Destination Location
              </span>
              <span className="font-bold text-zinc-900 text-sm">
                {operation.destName || '—'}
              </span>
            </div>
            {operation.warehouse && (
              <div>
                <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[10px] block">
                  Warehouse
                </span>
                <span className="text-zinc-800">
                  {operation.warehouse.name} ({operation.warehouse.shortCode})
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-right">
            {operation.contact && (
              <div>
                <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[10px] block">
                  Partner / Contact
                </span>
                <span className="font-bold text-zinc-900 text-sm block">
                  {operation.contact.name}
                </span>
                {operation.contact.gstin && (
                  <span className="font-mono text-zinc-600 block">
                    GSTIN: {operation.contact.gstin}
                  </span>
                )}
                {operation.deliveryAddress && (
                  <span className="text-zinc-600 block mt-0.5 max-w-xs ml-auto">
                    {operation.deliveryAddress}
                  </span>
                )}
              </div>
            )}
            <div>
              <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[10px] block">
                Responsible Operator
              </span>
              <span className="text-zinc-800 font-medium">
                {operation.responsible?.name || operation.validatedBy?.name || 'Warehouse Staff'}
              </span>
            </div>
          </div>
        </div>

        {/* Lines Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-900 text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                <th className="py-2 px-1 w-8">#</th>
                <th className="py-2 px-3 w-36">Product SKU</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3 w-28 text-right">Quantity</th>
                <th className="py-2 px-3 w-20 text-center">UoM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {operation.lines?.map((line, idx) => (
                <tr key={line.id || idx}>
                  <td className="py-2.5 px-1 font-mono text-zinc-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-zinc-900">
                    {line.product?.sku || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-800">
                    {line.product?.name || 'Unknown Product'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                    {line.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-zinc-500">
                    {line.product?.uom || 'Units'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-900 font-bold">
                <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                  Total Items / Quantity:
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-zinc-900">
                  {totalQty}
                </td>
                <td className="py-3 px-3 text-center text-xs text-zinc-500">
                  {operation.lines?.length} lines
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Remarks / Notes */}
        {operation.notes && (
          <div className="pt-2 pb-6 border-t border-zinc-200 text-xs">
            <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[10px] block mb-1">
              Notes & Handling Remarks
            </span>
            <p className="text-zinc-700 bg-zinc-50 p-2.5 rounded border border-zinc-200">
              {operation.notes}
            </p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 pt-16 mt-8 border-t border-zinc-300 text-xs">
          <div>
            <div className="border-b border-zinc-400 pb-1 mb-1" />
            <div className="font-semibold text-zinc-900">Authorized / Validated By</div>
            <div className="text-zinc-500">
              {operation.validatedBy?.name || 'Authorized Supervisor'}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Date & Signature</div>
          </div>
          <div>
            <div className="border-b border-zinc-400 pb-1 mb-1" />
            <div className="font-semibold text-zinc-900">Received / Handed Over By</div>
            <div className="text-zinc-500">Logistics Carrier / Customer Representative</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Date & Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
