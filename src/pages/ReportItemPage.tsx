import { useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createItemReport, uploadItemImage } from '../services/itemsService';
import {
  CAMPUS_LOCATIONS,
  ITEM_CATEGORIES,
  type AppRoute,
  type ItemCategory,
  type ItemType,
} from '../types/campus';
import { validateImageFile, validateItemInput } from '../utils/validation';

interface ReportItemPageProps {
  mode: ItemType;
  onNavigate: (route: AppRoute, itemId?: string) => void;
}

export function ReportItemPage({ mode, onNavigate }: ReportItemPageProps) {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const today = new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Electronics');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [dateReported, setDateReported] = useState(today);
  const [contactSummary, setContactSummary] = useState(
    mode === 'found' ? 'Student Services Helpdesk · Room 102' : 'Campus Email / Helpdesk Relay'
  );
  const [contactDetails, setContactDetails] = useState(profile?.email || '');
  const [pickupLocation, setPickupLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageName, setImageName] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white border border-slate-200 rounded-xl p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Sign in required</h1>
        <p className="mt-2 text-sm text-slate-600">
          Please sign in with your verified campus account to report a {mode} item.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="mt-5 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const effectiveLocation = location === '__other__' ? customLocation.trim() : location;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileCheck = validateImageFile(file);
    if (!fileCheck.valid) {
      setErrors((prev) => ({ ...prev, image: fileCheck.error || 'Invalid image file.' }));
      showToast(fileCheck.error || 'Invalid image file.', 'error');
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    setUploadingImage(true);
    try {
      const uploaded = await uploadItemImage(file, profile.uid);
      setImageUrl(uploaded.url);
      setImageName(file.name);
      showToast('Item photograph attached successfully.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to upload image.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      type: mode,
      category,
      description,
      location: effectiveLocation,
      dateReported,
      contactSummary,
      contactDetails,
      pickupLocation: pickupLocation.trim() || effectiveLocation,
      imageUrl,
    };

    const validation = validateItemInput(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      showToast('Please fix the highlighted validation errors.', 'error');
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const itemId = await createItemReport(profile, payload);
      showToast(
        mode === 'lost'
          ? 'Lost item report published to CampusTrace.'
          : 'Found item report published to CampusTrace.',
        'success'
      );
      onNavigate('item-details', itemId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === 'lost' ? 'Report a Lost Item' : 'Report a Found Item'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {mode === 'lost'
            ? 'Provide accurate details so finders and campus staff can match your missing property.'
            : 'Log items found on campus. Owners will submit verification details before handover.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="item-title" className="block text-xs font-medium text-slate-700 mb-1.5">
              Item Name *
            </label>
            <input
              id="item-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === 'lost' ? 'e.g. Silver MacBook Air 13"' : 'e.g. Navy Hydro Flask Bottle'}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="item-category" className="block text-xs font-medium text-slate-700 mb-1.5">
              Category *
            </label>
            <select
              id="item-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="item-location" className="block text-xs font-medium text-slate-700 mb-1.5">
              {mode === 'lost' ? 'Last Seen Location *' : 'Found Location *'}
            </label>
            <select
              id="item-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
              <option value="__other__">Other Campus Location</option>
            </select>
            {location === '__other__' && (
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Specify building or room number"
                className="mt-2 w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            )}
            {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
          </div>

          <div>
            <label htmlFor="item-date" className="block text-xs font-medium text-slate-700 mb-1.5">
              {mode === 'lost' ? 'Date Lost *' : 'Date Found *'}
            </label>
            <input
              id="item-date"
              type="date"
              max={today}
              value={dateReported}
              onChange={(e) => setDateReported(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.dateReported && <p className="mt-1 text-xs text-red-600">{errors.dateReported}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="item-description" className="block text-xs font-medium text-slate-700 mb-1.5">
            Detailed Description *
          </label>
          <textarea
            id="item-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe color, brand, case, markings, or approximate time..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
        </div>

        {/* Contact Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
          <div>
            <label htmlFor="item-contact-summary" className="block text-xs font-medium text-slate-700 mb-1.5">
              Public Desk / Custody Note *
            </label>
            <input
              id="item-contact-summary"
              type="text"
              value={contactSummary}
              onChange={(e) => setContactSummary(e.target.value)}
              placeholder="e.g. Turned in at Library Front Desk"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.contactSummary && <p className="mt-1 text-xs text-red-600">{errors.contactSummary}</p>}
          </div>

          <div>
            <label htmlFor="item-contact-details" className="block text-xs font-medium text-slate-700 mb-1.5">
              Direct Contact Details (Verified Users Only) *
            </label>
            <input
              id="item-contact-details"
              type="text"
              value={contactDetails}
              onChange={(e) => setContactDetails(e.target.value)}
              placeholder="Campus email or phone number"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.contactDetails && <p className="mt-1 text-xs text-red-600">{errors.contactDetails}</p>}
          </div>
        </div>

        {mode === 'found' && (
          <div>
            <label htmlFor="item-pickup" className="block text-xs font-medium text-slate-700 mb-1.5">
              Current Holding / Pickup Desk (optional)
            </label>
            <input
              id="item-pickup"
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="e.g. Student Union Lost & Found Counter"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )}

        {/* Photograph Upload */}
        <div className="pt-2 border-t border-slate-100">
          <span className="block text-xs font-medium text-slate-700 mb-2">
            Item Photograph (JPEG, PNG, WebP · max 5 MB)
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors w-fit">
              <ImagePlus className="w-4 h-4" />
              <span>{uploadingImage ? 'Uploading...' : imageUrl ? 'Replace Photo' : 'Upload Photograph'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
                disabled={uploadingImage}
              />
            </label>
            {imageName && <span className="text-xs text-slate-500 truncate max-w-xs">{imageName}</span>}
            {imageUrl && (
              <button
                type="button"
                onClick={() => {
                  setImageUrl('');
                  setImageName('');
                }}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>
          {errors.image && <p className="mt-1.5 text-xs text-red-600">{errors.image}</p>}

          {imageUrl && (
            <div className="mt-3 w-48 h-36 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <img src={imageUrl} alt="Uploaded item preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting
              ? 'Submitting...'
              : mode === 'lost'
                ? 'Submit Lost Report'
                : 'Submit Found Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
