import { useParams, Link } from 'react-router';
import { Button } from '../../components/ui/Button.jsx';
import { Printer, ArrowLeft } from 'lucide-react';

export function PrintSlipPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-white p-8 max-w-3xl mx-auto text-zinc-900 font-sans">
      <div className="no-print flex items-center justify-between pb-6 mb-6 border-b border-zinc-200">
        <Link to={`/operations/receipts/${id}`}>
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Document
          </Button>
        </Link>
        <Button variant="primary" size="sm" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>
          Print Slip
        </Button>
      </div>

      <div className="border border-zinc-300 p-8 rounded-lg">
        <div className="flex justify-between items-start pb-6 border-b border-zinc-200">
          <div>
            <h1 className="text-2xl font-bold font-mono">STOCK OPERATION SLIP</h1>
            <p className="text-xs text-zinc-500 mt-1">Document ID: {id}</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">StockSense Logistics</p>
            <p className="text-zinc-500">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="py-12 text-center text-sm text-zinc-400">
          Print layout template ready — product line data populated by Member 2 upon validation.
        </div>
      </div>
    </div>
  );
}
