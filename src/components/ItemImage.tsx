import { useState } from 'react';
import { BookOpen, Briefcase, Cpu, CreditCard, Package, Shirt, Trophy } from 'lucide-react';
import type { ItemCategory } from '../types/campus';

interface ItemImageProps {
  src?: string;
  alt: string;
  category: ItemCategory | string;
  className?: string;
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'Electronics':
      return Cpu;
    case 'ID Cards & Keys':
      return CreditCard;
    case 'Bags & Backpacks':
      return Briefcase;
    case 'Books & Notes':
      return BookOpen;
    case 'Clothing & Accessories':
      return Shirt;
    case 'Sports & Gear':
      return Trophy;
    default:
      return Package;
  }
}

export function ItemImage({ src, alt, category, className = 'w-full h-44' }: ItemImageProps) {
  const [failed, setFailed] = useState(false);
  const Icon = getCategoryIcon(category);

  if (!src || failed) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-slate-100 via-blue-50/70 to-slate-100 border-b border-slate-200 flex flex-col items-center justify-center p-4 text-center select-none`}
      >
        <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center mb-2 text-blue-700">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium text-slate-500">{category}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} object-cover bg-slate-100`}
    />
  );
}
