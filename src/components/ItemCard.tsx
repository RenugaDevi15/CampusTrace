import { ArrowRight, CheckCircle2, Clock, HelpCircle, PackageCheck } from 'lucide-react';
import type { ItemReport, ItemStatus } from '../types/campus';
import { ItemImage } from './ItemImage';

export function StatusIndicator({ status }: { status: ItemStatus }) {
  if (status === 'Lost') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 whitespace-nowrap">
        <HelpCircle className="w-3.5 h-3.5" />
        Lost
      </span>
    );
  }
  if (status === 'Found') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Found
      </span>
    );
  }
  if (status === 'Claimed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5" />
        Claimed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
      <PackageCheck className="w-3.5 h-3.5" />
      Returned
    </span>
  );
}

interface ItemCardProps {
  item: ItemReport;
  onSelect: (itemId: string) => void;
}

export function ItemCard({ item, onSelect }: ItemCardProps) {
  return (
    <article className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-blue-300 transition-colors">
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset flex-1 flex flex-col"
      >
        <div className="w-full overflow-hidden">
          <ItemImage src={item.imageUrl} alt={item.title} category={item.category} className="w-full h-44" />
        </div>
        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <StatusIndicator status={item.status} />
              <span className="text-xs text-slate-500 font-mono tabular-nums">{item.dateReported}</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 line-clamp-1">{item.title}</h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
              <span>{item.category}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[180px]">{item.location}</span>
            </div>
            <p className="mt-2.5 text-sm text-slate-600 line-clamp-2 leading-relaxed">{item.description}</p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-blue-700">
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </button>
    </article>
  );
}
