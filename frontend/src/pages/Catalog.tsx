import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Camera, Music, Lightbulb, UserCheck, Settings, BookOpen, Layers, CheckCircle2, AlertTriangle, Boxes, PackageCheck, SlidersHorizontal } from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  CAMERA: Camera,
  LIGHTING: Lightbulb,
  AUDIO: Music,
  RECORDING: Settings,
  COSTUME: UserCheck,
  PROP: BookOpen,
  INFRA: Layers,
};

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'CAMERA', label: 'Cameras & Lenses' },
  { value: 'LIGHTING', label: 'Studio Lighting' },
  { value: 'AUDIO', label: 'Sound Systems' },
  { value: 'RECORDING', label: 'Recording Gear' },
  { value: 'COSTUME', label: 'Costumes & Dresswear' },
  { value: 'PROP', label: 'Stage Props' },
  { value: 'INFRA', label: 'Event Infrastructure' },
];

const Catalog: React.FC = () => {
  const { apiFetch } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Booking modal states
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [bookingQty, setBookingQty] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const data = await apiFetch(`/api/v1/assets?${params.toString()}`);
      setAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching assets', err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, selectedCategory]);

  const totalItems = assets.reduce((sum, asset) => sum + (asset.totalQuantity || 0), 0);
  const availableItems = assets.reduce((sum, asset) => sum + (asset.quantityAvailable || 0), 0);
  const activeModels = assets.filter((asset) => asset.status === 'ACTIVE').length;

  const handleOpenBookingModal = (asset: any) => {
    setSelectedAsset(asset);
    setBookingQty(1);
    
    // Default dates: tomorrow to day after
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    setStartDate(tomorrow.toISOString().split('T')[0]);
    setEndDate(dayAfter.toISOString().split('T')[0]);
    setPurpose('');
    setBookingError('');
    setBookingSuccess('');
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');
    setBookingLoading(true);

    try {
      await apiFetch('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify({
          assetId: selectedAsset.id,
          quantity: bookingQty,
          startDate,
          endDate,
          purpose,
        }),
      });

      setBookingSuccess('Booking request submitted successfully! Pending admin approval.');
      fetchAssets(); // Refresh counts
      setTimeout(() => {
        setSelectedAsset(null);
      }, 2000);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to place booking request');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-teal-500/[0.06] p-5 sm:p-6 surface-card">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <p className="page-kicker mb-2">Asset repository</p>
            <h2 className="text-2xl sm:text-3xl font-bold font-sans text-white">Borrow-ready cultural inventory</h2>
            <p className="text-sm text-dark-300 mt-1 max-w-2xl">Browse council gear, check availability, and send loan requests with clean tracking from request to return.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 min-w-full lg:min-w-[420px]">
            <div className="glass-panel rounded-xl p-3 border border-white/10">
              <Boxes className="w-4 h-4 text-teal-300 mb-2" />
              <span className="block text-xl font-extrabold text-white">{assets.length}</span>
              <span className="text-[10px] uppercase tracking-wider text-dark-400">Models</span>
            </div>
            <div className="glass-panel rounded-xl p-3 border border-white/10">
              <PackageCheck className="w-4 h-4 text-emerald-300 mb-2" />
              <span className="block text-xl font-extrabold text-white">{availableItems}/{totalItems}</span>
              <span className="text-[10px] uppercase tracking-wider text-dark-400">Available</span>
            </div>
            <div className="glass-panel rounded-xl p-3 border border-white/10">
              <SlidersHorizontal className="w-4 h-4 text-brand-300 mb-2" />
              <span className="block text-xl font-extrabold text-white">{activeModels}</span>
              <span className="text-[10px] uppercase tracking-wider text-dark-400">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-dark-200">Inventory browser</h3>
          <p className="text-xs text-dark-400">Filter by category or search for a specific model.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg glass-input text-xs"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-dark-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg glass-input text-xs appearance-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-dark-900 text-dark-100">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-dark-800 rounded-xl glass-panel">
          <p className="text-dark-400 text-sm">No items found matching the selected search parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => {
            const IconComp = CATEGORY_ICONS[asset.category] || Camera;
            const isAvailable = asset.quantityAvailable > 0 && asset.status === 'ACTIVE';
            return (
              <div 
                key={asset.id} 
                className="glass-panel surface-card p-5 rounded-2xl border border-white/10 hover:border-teal-300/25 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Category Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-teal-400/8 group-hover:bg-teal-400/12 border border-teal-300/15 transition-colors">
                      <IconComp className="w-5 h-5 text-teal-300" />
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide capitalize ${
                      asset.status === 'ACTIVE' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : asset.status === 'MAINTENANCE'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {asset.status.toLowerCase()}
                    </span>
                  </div>

                  {/* Asset Info */}
                  <h3 className="font-bold text-base text-dark-50 group-hover:text-teal-200 transition-colors mb-1.5 font-sans leading-tight">
                    {asset.name}
                  </h3>
                  <span className="text-[10px] text-dark-400 uppercase tracking-widest font-semibold block mb-2.5">
                    {asset.category.replace('_', ' ')}
                  </span>
                  <p className="text-xs text-dark-300 leading-relaxed mb-5 line-clamp-2">
                    {asset.description || 'No description available for this item.'}
                  </p>
                </div>

                {/* Stock levels and book triggers */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-[10px] text-dark-400 font-medium">Availability</span>
                    <span className="text-xs font-semibold">
                      <span className={isAvailable ? 'text-emerald-400' : 'text-red-400'}>
                        {asset.quantityAvailable}
                      </span>
                      <span className="text-dark-400"> / {asset.totalQuantity} in stock</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenBookingModal(asset)}
                    disabled={!isAvailable}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      isAvailable 
                        ? 'btn-primary text-white' 
                        : 'bg-dark-800 text-dark-400 cursor-not-allowed border border-dark-750'
                    }`}
                  >
                    Request Asset
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-dark-800 shadow-2xl relative animate-slide-up">
            <h3 className="text-lg font-bold mb-2 font-sans">Request Booking</h3>
            <p className="text-xs text-brand-300 font-semibold mb-4 leading-tight">
              {selectedAsset.name}
            </p>

            {bookingSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <p className="text-sm font-medium text-emerald-300">{bookingSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-4">
                {bookingError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">
                    Quantity Required (Max available: {selectedAsset.quantityAvailable})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedAsset.quantityAvailable}
                    required
                    value={bookingQty}
                    onChange={(e) => setBookingQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                    />
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">Purpose of Loan</label>
                  <textarea
                    rows={3}
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Provide details on the event, society session, or council project..."
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAsset(null)}
                    className="w-1/2 py-2 rounded-lg text-xs font-semibold btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-1/2 py-2 rounded-lg text-xs font-semibold btn-primary text-white"
                  >
                    {bookingLoading ? 'Submitting...' : 'Request Loan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
