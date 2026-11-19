import { useState } from 'react';
import { ArrowLeft, ImagePlus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { submitOwnershipClaim } from '../services/claimsService';
import { uploadItemImage } from '../services/itemsService';
import type { AppRoute, ClaimRequest, ItemReport } from '../types/campus';
import { validateClaimInput, validateImageFile } from '../utils/validation';

interface SubmitClaimPageProps {
  itemId: string;
  items: ItemReport[];
  myClaims: ClaimRequest[];
  onNavigate: (route: AppRoute, itemId?: string) => void;
}

export function SubmitClaimPage({ itemId, items, myClaims, onNavigate }: SubmitClaimPageProps) {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const item = items.find((i) => i.id === itemId);
  const existingClaim = myClaims.find((c) => c.itemId === itemId);

  const [ownershipProof, setOwnershipProof] = useState('');
  const [identifyingFeatures, setIdentifyingFeatures] = useState('');
  const [supportingImageUrl, setSupportingImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white border border-slate-200 rounded-xl p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Sign in to Submit Claim</h1>
        <p className="mt-2 text-sm text-slate-600">
          Verified campus authentication is required to submit an ownership claim.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="mt-5 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white border border-slate-200 rounded-xl p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Item Unavailable</h1>
        <p className="mt-2 text-sm text-slate-600">This item could not be located.</p>
        <button
          type="button"
          onClick={() => onNavigate('search')}
          className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg"
        >
          Search Items
        </button>
      </div>
    );
  }

  if (existingClaim) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white border border-slate-200 rounded-xl p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Claim Already Submitted</h1>
        <p className="mt-2 text-sm text-slate-600">
          You have already submitted a claim for "{item.title}". Current status:{' '}
          <span className="font-semibold text-blue-700">{existingClaim.status}</span>.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('my-claims')}
          className="mt-5 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg"
        >
          View My Claims
        </button>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.valid) {
      showToast(check.error || 'Invalid file.', 'error');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadItemImage(file, profile.uid);
      setSupportingImageUrl(result.url);
      showToast('Supporting receipt/photo uploaded.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateClaimInput({
      itemId: item.id,
      ownershipProof,
      identifyingFeatures,
      supportingImageUrl,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      showToast('Please provide complete ownership verification details.', 'error');
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await submitOwnershipClaim(profile, item, {
        itemId: item.id,
        ownershipProof,
        identifyingFeatures,
        supportingImageUrl,
      });
      showToast('Ownership claim submitted for review.', 'success');
      onNavigate('my-claims');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to submit claim.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => onNavigate('item-details', item.id)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Item Details
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submit Ownership Claim</h1>
        <p className="mt-1 text-sm text-slate-600">
          Claiming: <span className="font-semibold text-slate-900">{item.title}</span> · {item.category} ·{' '}
          {item.location}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
        <div>
          <label htmlFor="claim-proof" className="block text-xs font-medium text-slate-700 mb-1.5">
            Ownership Details &amp; Context * (min 15 characters)
          </label>
          <textarea
            id="claim-proof"
            rows={4}
            value={ownershipProof}
            onChange={(e) => setOwnershipProof(e.target.value)}
            placeholder="Explain when and where you lost the item, purchase date, or contents inside..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {errors.ownershipProof && <p className="mt-1 text-xs text-red-600">{errors.ownershipProof}</p>}
        </div>

        <div>
          <label htmlFor="claim-features" className="block text-xs font-medium text-slate-700 mb-1.5">
            Unique Identifying Information * (serial number, lock screen, initials, stickers)
          </label>
          <textarea
            id="claim-features"
            rows={3}
            value={identifyingFeatures}
            onChange={(e) => setIdentifyingFeatures(e.target.value)}
            placeholder="Describe hidden marks, engravings, serial digits, or specific items in pockets..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {errors.identifyingFeatures && <p className="mt-1 text-xs text-red-600">{errors.identifyingFeatures}</p>}
        </div>

        <div>
          <span className="block text-xs font-medium text-slate-700 mb-2">
            Supporting Proof Photo / Receipt (optional)
          </span>
          <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer">
            <ImagePlus className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : supportingImageUrl ? 'Replace Supporting Photo' : 'Attach Photo'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="sr-only"
              disabled={uploading}
            />
          </label>
          {supportingImageUrl && (
            <div className="mt-3 w-40 h-28 rounded-lg overflow-hidden border border-slate-200">
              <img src={supportingImageUrl} alt="Supporting ownership proof" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onNavigate('item-details', item.id)}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      </form>
    </div>
  );
}
