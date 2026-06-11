import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, Check, X, ShieldCheck, Plus, Pencil, Trash, 
  QrCode, AlertOctagon, RefreshCw, FileText, ClipboardList, ScanLine 
} from 'lucide-react';
import QRCode from 'qrcode';

const AdminDashboard: React.FC = () => {
  const { apiFetch } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'inventory' | 'qr' | 'health' | 'audit'>('requests');
  
  // Data states
  const [bookings, setBookings] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [healthReports, setHealthReports] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [actionKey, setActionKey] = useState<string | null>(null);

  // Asset creation/edit form states
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [assetForm, setAssetForm] = useState({
    name: '',
    category: 'CAMERA',
    description: '',
    totalQuantity: 1,
    status: 'ACTIVE',
  });
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetFormError, setAssetFormError] = useState('');

  // QR Simulator states
  const [qrAssetId, setQrAssetId] = useState('');
  const [qrScannedAsset, setQrScannedAsset] = useState<any | null>(null);
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Return modal states
  const [selectedAllocationForReturn, setSelectedAllocationForReturn] = useState<any | null>(null);
  const [returnCondition, setReturnCondition] = useState('GOOD');
  const [returnNotes, setReturnNotes] = useState('');

  // Asset manual health logging states
  const [healthAssetId, setHealthAssetId] = useState('');
  const [healthCondition, setHealthCondition] = useState('GOOD');
  const [healthNotes, setHealthNotes] = useState('');
  const [healthError, setHealthError] = useState('');

  const refreshAllData = async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }
    setSyncing(true);
    setSyncError('');

    try {
      const [bookingsResult, assetsResult, allocationsResult] = await Promise.allSettled([
        apiFetch('/api/v1/bookings'),
        apiFetch('/api/v1/assets'),
        apiFetch('/api/v1/allocations'),
      ]);
      const failedSections: string[] = [];

      if (bookingsResult.status === 'fulfilled') {
        setBookings(Array.isArray(bookingsResult.value) ? bookingsResult.value : []);
      } else {
        failedSections.push('booking requests');
        console.error('Failed to refresh bookings', bookingsResult.reason);
      }

      if (assetsResult.status === 'fulfilled') {
        setAssets(Array.isArray(assetsResult.value) ? assetsResult.value : []);
      } else {
        failedSections.push('inventory');
        console.error('Failed to refresh assets', assetsResult.reason);
      }

      if (allocationsResult.status === 'fulfilled') {
        setAllocations(Array.isArray(allocationsResult.value) ? allocationsResult.value : []);
      } else {
        failedSections.push('active loans');
        console.error('Failed to refresh allocations', allocationsResult.reason);
      }

      const [returnRequestsResult, healthResult, auditResult] = await Promise.allSettled([
        apiFetch('/api/v1/allocations/return-requests'),
        apiFetch('/api/v1/allocations/health'),
        apiFetch('/api/v1/audit'),
      ]);

      if (returnRequestsResult.status === 'fulfilled') {
        setReturnRequests(Array.isArray(returnRequestsResult.value) ? returnRequestsResult.value : []);
      } else {
        failedSections.push('return requests');
        console.warn('Return request log is unavailable; keeping last synced data.', returnRequestsResult.reason);
      }

      if (healthResult.status === 'fulfilled') {
        setHealthReports(Array.isArray(healthResult.value) ? healthResult.value : []);
      } else {
        failedSections.push('health logs');
        console.warn('Health reports are unavailable; keeping last synced data.', healthResult.reason);
      }

      if (auditResult.status === 'fulfilled') {
        setAuditLogs(Array.isArray(auditResult.value) ? auditResult.value : []);
      } else {
        failedSections.push('audit logs');
        console.warn('Audit logs are unavailable; keeping last synced data.', auditResult.reason);
      }

      if (failedSections.length > 0) {
        setSyncError(`Could not refresh ${failedSections.join(', ')}. Showing the last synced data.`);
      }
    } catch (err) {
      console.error('Failed to sync administrative dashboard datasets', err);
      setSyncError('Could not reach the backend. Showing the last synced data.');
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
      setSyncing(false);
    }
  };

  useEffect(() => {
    refreshAllData();
    const intervalId = window.setInterval(() => refreshAllData(false), 15000);
    const handleFocus = () => refreshAllData(false);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const runSyncedAction = async (key: string, action: () => Promise<void>, fallbackMessage: string) => {
    if (actionKey) return;

    try {
      setActionKey(key);
      setSyncError('');
      await action();
      await refreshAllData(false);
    } catch (err: any) {
      setSyncError(err.message || fallbackMessage);
    } finally {
      setActionKey(null);
    }
  };

  // Render QR Code canvas
  useEffect(() => {
    if (activeQrCode && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, activeQrCode, { width: 180, margin: 2 }, (error) => {
        if (error) console.error('Error drawing QR Code canvas', error);
      });
    }
  }, [activeQrCode]);

  // Request approval logic
  const handleApproveBooking = async (id: string) => {
    await runSyncedAction(
      `approve-${id}`,
      () => apiFetch(`/api/v1/bookings/${id}/approve`, { method: 'PUT' }),
      'Approval failed'
    );
  };

  const handleRejectBooking = async (id: string) => {
    await runSyncedAction(
      `reject-${id}`,
      () => apiFetch(`/api/v1/bookings/${id}/reject`, { method: 'PUT' }),
      'Rejection failed'
    );
  };

  const handleIssueAsset = async (bookingId: string) => {
    await runSyncedAction(
      `issue-${bookingId}`,
      () => apiFetch('/api/v1/allocations/issue', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      }),
      'Failed to issue asset'
    );
  };

  const handleRequestReturnFromUser = async (allocation: any) => {
    const notes = window.prompt(`Send return request to ${allocation.user.fullName}? Add optional notes for the user.`);
    if (notes === null) return;

    await runSyncedAction(
      `request-return-${allocation.id}`,
      () => apiFetch('/api/v1/allocations/request-return', {
        method: 'POST',
        body: JSON.stringify({
          allocationId: allocation.id,
          notes,
        }),
      }),
      'Failed to send return request'
    );
  };

  const handleReturnAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocationForReturn) return;

    await runSyncedAction(
      `return-${selectedAllocationForReturn.id}`,
      async () => {
        await apiFetch('/api/v1/allocations/return', {
          method: 'POST',
          body: JSON.stringify({
            allocationId: selectedAllocationForReturn.id,
            conditionOnReturn: returnCondition,
            notes: returnNotes,
          }),
        });
        setSelectedAllocationForReturn(null);
        setReturnNotes('');
      },
      'Return failed'
    );
  };

  const handleAssetFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssetFormError('');

    const path = editingAsset ? `/api/v1/assets/${editingAsset.id}` : '/api/v1/assets';
    const method = editingAsset ? 'PUT' : 'POST';

    await runSyncedAction(
      editingAsset ? `asset-update-${editingAsset.id}` : 'asset-create',
      async () => {
        await apiFetch(path, {
          method,
          body: JSON.stringify(assetForm),
        });
        setShowAssetModal(false);
      },
      'Asset operation failed'
    );
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this asset?')) return;

    await runSyncedAction(
      `asset-delete-${id}`,
      () => apiFetch(`/api/v1/assets/${id}`, { method: 'DELETE' }),
      'Failed to delete asset'
    );
  };

  // QR Scanning Simulator
  const handleSimulateScan = async () => {
    if (!qrAssetId) return;
    try {
      const asset = await apiFetch(`/api/v1/assets/${qrAssetId}`);
      setQrScannedAsset(asset);
    } catch (err) {
      alert('Invalid QR Code or Asset Not Found');
      setQrScannedAsset(null);
    }
  };

  // Health report creation
  const handleHealthReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHealthError('');
    if (!healthAssetId) return;

    await runSyncedAction(
      'health-create',
      async () => {
        await apiFetch('/api/v1/allocations/health', {
          method: 'POST',
          body: JSON.stringify({
            assetId: healthAssetId,
            condition: healthCondition,
            notes: healthNotes,
          }),
        });
        setHealthNotes('');
        setHealthAssetId('');
      },
      'Failed to create health report'
    );
  };

  // Asset CRUD logic
  const handleOpenCreateModal = () => {
    setEditingAsset(null);
    setAssetForm({
      name: '',
      category: 'CAMERA',
      description: '',
      totalQuantity: 1,
      status: 'ACTIVE',
    });
    setAssetFormError('');
    setShowAssetModal(true);
  };

  const handleOpenEditModal = (asset: any) => {
    setEditingAsset(asset);
    setAssetForm({
      name: asset.name,
      category: asset.category,
      description: asset.description,
      totalQuantity: asset.totalQuantity,
      status: asset.status,
    });
    setAssetFormError('');
    setShowAssetModal(true);
  };

  /*
   * Kept below helpers close to the render so the UI can use one consistent view of
   * active requests even if the server adds more terminal statuses later.
   */
  const activeReturnRequests = returnRequests.filter(request =>
    ['PENDING', 'USER_CONFIRMED'].includes(request.status)
  );

  const outstandingAllocations = allocations.filter(allocation => allocation.status === 'ISSUED');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-sans">Council Control Desk</h2>
          <p className="text-sm text-dark-400">Manage bookings, issue resources, scan QR codes, and review audits.</p>
        </div>
        <button
          onClick={() => refreshAllData()}
          disabled={syncing}
          className="p-2 rounded-lg bg-dark-900 border border-dark-800 text-dark-300 hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          title="Refresh admin data"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {syncError && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-200">
          {syncError}
        </div>
      )}

      {/* Admin Tab Selectors */}
      <div className="flex border-b border-dark-800/80 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'requests'
              ? 'border-brand-500 text-brand-300'
              : 'border-transparent text-dark-400 hover:text-dark-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Requests & Issuance ({bookings.filter(b => b.status === 'PENDING' || b.status === 'APPROVED').length})
        </button>
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'inventory'
              ? 'border-brand-500 text-brand-300'
              : 'border-transparent text-dark-400 hover:text-dark-200'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Inventory Manager
        </button>
        <button
          onClick={() => setActiveSubTab('qr')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'qr'
              ? 'border-brand-500 text-brand-300'
              : 'border-transparent text-dark-400 hover:text-dark-200'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          Check-in Desk (QR)
        </button>
        <button
          onClick={() => setActiveSubTab('health')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'health'
              ? 'border-brand-500 text-brand-300'
              : 'border-transparent text-dark-400 hover:text-dark-200'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          Health Logs
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'audit'
              ? 'border-brand-500 text-brand-300'
              : 'border-transparent text-dark-400 hover:text-dark-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          System Audit Logs
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: REQUESTS HUB */}
          {activeSubTab === 'requests' && (
            <div className="space-y-6">
              {/* Part A: Pending Booking requests */}
              <div className="glass-panel p-5 rounded-2xl border border-dark-850">
                <h3 className="font-bold text-sm text-dark-200 mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> Pending Approval Queue
                </h3>

                {bookings.filter(b => b.status === 'PENDING').length === 0 ? (
                  <p className="text-xs text-dark-400 text-center py-6">No pending booking requests.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-dark-800 text-dark-400 uppercase tracking-widest text-[9px] font-bold">
                          <th className="py-3 px-2">Member</th>
                          <th className="py-3 px-2">Asset Details</th>
                          <th className="py-3 px-2">Duration</th>
                          <th className="py-3 px-2">Purpose</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-850/40">
                        {bookings.filter(b => b.status === 'PENDING').map(booking => (
                          <tr key={booking.id} className="hover:bg-dark-900/10">
                            <td className="py-4 px-2">
                              <span className="font-semibold text-dark-100 block">{booking.user.fullName}</span>
                              <span className="text-[10px] text-dark-400">{booking.user.email}</span>
                            </td>
                            <td className="py-4 px-2">
                              <span className="font-semibold text-brand-300 block">{booking.asset.name}</span>
                              <span className="text-[10px] text-dark-400">Qty requested: {booking.quantity}</span>
                            </td>
                            <td className="py-4 px-2 leading-relaxed">
                              {new Date(booking.startDate).toLocaleDateString()} to<br/>
                              {new Date(booking.endDate).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-2 italic text-dark-300 max-w-[200px] truncate" title={booking.purpose}>
                              "{booking.purpose}"
                            </td>
                            <td className="py-4 px-2 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveBooking(booking.id)}
                                  disabled={!!actionKey}
                                  className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectBooking(booking.id)}
                                  disabled={!!actionKey}
                                  className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Part B: Approved Bookings (Ready to Issue) */}
              <div className="glass-panel p-5 rounded-2xl border border-dark-850">
                <h3 className="font-bold text-sm text-dark-200 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Approved & Awaiting Handover
                </h3>

                {bookings.filter(b => b.status === 'APPROVED' && !b.allocation).length === 0 ? (
                  <p className="text-xs text-dark-400 text-center py-6">No approved loans waiting for issuance.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-dark-800 text-dark-400 uppercase tracking-widest text-[9px] font-bold">
                          <th className="py-3 px-2">Member</th>
                          <th className="py-3 px-2">Asset Details</th>
                          <th className="py-3 px-2">Duration</th>
                          <th className="py-3 px-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-850/40">
                        {bookings.filter(b => b.status === 'APPROVED' && !b.allocation).map(booking => (
                          <tr key={booking.id} className="hover:bg-dark-900/10">
                            <td className="py-4 px-2">
                              <span className="font-semibold text-dark-100 block">{booking.user.fullName}</span>
                              <span className="text-[10px] text-dark-400">{booking.user.email}</span>
                            </td>
                            <td className="py-4 px-2">
                              <span className="font-semibold text-brand-300 block">{booking.asset.name}</span>
                              <span className="text-[10px] text-dark-400">Qty: {booking.quantity}</span>
                            </td>
                            <td className="py-4 px-2">
                              {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-2 text-right">
                              <button
                                onClick={() => handleIssueAsset(booking.id)}
                                disabled={!!actionKey}
                                className="px-3 py-1.5 rounded-lg bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 border border-brand-500/20 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {actionKey === `issue-${booking.id}` ? 'Issuing...' : 'Handover / Issue'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY MANAGER */}
          {activeSubTab === 'inventory' && (
            <div className="glass-panel p-5 rounded-2xl border border-dark-850">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-dark-200">Council Inventory List</h3>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-3 py-1.5 rounded-lg btn-primary text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Asset
                </button>
              </div>

              {assets.length === 0 ? (
                <p className="text-xs text-dark-400 text-center py-6">No assets registered. Click Add Asset to start.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-dark-800 text-dark-400 uppercase tracking-widest text-[9px] font-bold">
                        <th className="py-3 px-2">Asset Details</th>
                        <th className="py-3 px-2">Category</th>
                        <th className="py-3 px-2">Stock Available</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-850/40">
                      {assets.map(asset => (
                        <tr key={asset.id} className="hover:bg-dark-900/10">
                          <td className="py-3 px-2">
                            <span className="font-semibold text-dark-100 block">{asset.name}</span>
                            <span className="text-[10px] text-dark-400 truncate max-w-[250px] block" title={asset.description}>
                              {asset.description || 'No description'}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-[10px] uppercase bg-dark-900 px-2 py-0.5 rounded border border-dark-800 tracking-wider">
                              {asset.category.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-2 font-semibold">
                            {asset.quantityAvailable} / {asset.totalQuantity}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                              asset.status === 'ACTIVE' 
                                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                : asset.status === 'MAINTENANCE'
                                ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                                : 'text-red-400 bg-red-500/10 border border-red-500/20'
                            }`}>
                              {asset.status.toLowerCase()}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setActiveQrCode(asset.qrCodeUrl);
                                }}
                                className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border border-indigo-500/20"
                                title="Show QR Code"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(asset)}
                                className="p-1.5 rounded-lg bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 border border-brand-500/20"
                                title="Edit Details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20"
                                title="Delete Asset"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHECK-IN DESK (QR SIMULATOR) */}
          {activeSubTab === 'qr' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              {/* Part A: Simulated Scanning Desk */}
              <div className="glass-panel p-5 rounded-2xl border border-dark-850 space-y-4">
                <h3 className="font-bold text-sm text-dark-200 flex items-center gap-1.5">
                  <ScanLine className="w-4 h-4 text-brand-400" /> QR Code Scanner Simulator
                </h3>
                <p className="text-xs text-dark-400 leading-relaxed">
                  Generate an asset QR from the inventory tab, copy the ID link, or select a registered asset below to simulate a hardware QR camera scan trigger:
                </p>

                <div className="flex gap-2">
                  <select
                    value={qrAssetId}
                    onChange={(e) => setQrAssetId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg glass-input text-xs cursor-pointer"
                  >
                    <option value="">Select Asset to Scan...</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleSimulateScan}
                    disabled={!qrAssetId}
                    className="px-4 py-2 rounded-lg btn-primary text-white text-xs font-semibold disabled:opacity-40"
                  >
                    Scan QR
                  </button>
                </div>

                {qrScannedAsset && (
                  <div className="border border-brand-500/25 bg-brand-500/5 p-4 rounded-xl space-y-3 animate-slide-up">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-brand-300">{qrScannedAsset.name}</h4>
                        <span className="text-[10px] text-dark-400 uppercase tracking-widest">{qrScannedAsset.category}</span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] rounded font-bold capitalize bg-dark-900 border border-dark-800 text-dark-200">
                        {qrScannedAsset.status}
                      </span>
                    </div>

                    <div className="text-[11px] grid grid-cols-2 gap-2 text-dark-300">
                      <div>
                        <span className="text-dark-400 block">Current Available:</span>
                        <span className="font-semibold text-dark-100">{qrScannedAsset.quantityAvailable} / {qrScannedAsset.totalQuantity}</span>
                      </div>
                      <div>
                        <span className="text-dark-400 block">QR Link Payload:</span>
                        <code className="text-[10px] text-brand-400 font-mono truncate block max-w-[150px]">
                          {qrScannedAsset.qrCodeUrl}
                        </code>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-brand-500/10 flex justify-end">
                      <button
                        onClick={() => {
                          setHealthAssetId(qrScannedAsset.id);
                          setActiveSubTab('health');
                          setQrScannedAsset(null);
                        }}
                        className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-[10px] font-semibold border border-amber-500/20"
                      >
                        Log Damage
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Part B: Active Loans / Returns Table */}
              <div className="glass-panel p-5 rounded-2xl border border-dark-850">
                <h3 className="font-bold text-sm text-dark-200 mb-4">Active Outstanding Loans</h3>

                {outstandingAllocations.length === 0 ? (
                  <p className="text-xs text-dark-400 text-center py-6">No assets checked out currently.</p>
                ) : (
                  <div className="overflow-y-auto max-h-[300px]">
                    <div className="space-y-2">
                      {outstandingAllocations.map(allocation => {
                        const isOverdue = new Date(allocation.dueDate) < new Date();
                        const activeReturnRequest = activeReturnRequests.find(request => request.allocationId === allocation.id);
                        const requestActionKey = `request-return-${allocation.id}`;
                        return (
                          <div 
                            key={allocation.id}
                            className={`p-3 rounded-xl border text-xs flex justify-between items-center transition-colors ${
                              isOverdue 
                                ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' 
                                : 'bg-dark-900/30 border-dark-850 hover:bg-dark-900/50'
                            }`}
                          >
                            <div>
                              <span className="font-bold text-dark-100 block">{allocation.asset.name}</span>
                              <div className="text-[10px] text-dark-400 space-x-2">
                                <span>Qty: {allocation.quantity}</span>
                                <span>&bull;</span>
                                <span>To: {allocation.user.fullName}</span>
                              </div>
                              <span className={`text-[10px] block mt-1 ${isOverdue ? 'text-red-400 font-semibold' : 'text-dark-400'}`}>
                                Due: {new Date(allocation.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                onClick={() => handleRequestReturnFromUser(allocation)}
                                disabled={!!activeReturnRequest || !!actionKey}
                                className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 font-semibold shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {actionKey === requestActionKey ? 'Sending...' : activeReturnRequest ? 'Request Sent' : 'Request Return'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAllocationForReturn(allocation);
                                  setReturnCondition('GOOD');
                                }}
                                disabled={!!actionKey}
                                className="px-2.5 py-1 rounded bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 border border-brand-500/20 font-semibold shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Check-in / Return
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-dark-850">
                <h3 className="font-bold text-sm text-dark-200 mb-4">Return Request Log</h3>

                {activeReturnRequests.length === 0 ? (
                  <p className="text-xs text-dark-400 text-center py-6">No active return requests.</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {activeReturnRequests
                      .map(request => (
                        <div key={request.id} className="rounded-xl border border-dark-850 bg-dark-900/30 p-3 text-xs">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <span className="font-bold text-dark-100 block">{request.allocation.asset.name}</span>
                              <div className="mt-1 text-[10px] text-dark-400 space-x-2">
                                <span>Qty: {request.allocation.quantity}</span>
                                <span>&bull;</span>
                                <span>User: {request.allocation.user.fullName}</span>
                              </div>
                              <p className="mt-1 text-dark-400">
                                {request.source === 'ADMIN' ? 'Admin requested return' : 'User requested return'}
                                {request.requestedBy?.fullName ? ` by ${request.requestedBy.fullName}` : ''}
                              </p>
                              {request.notes && <p className="mt-1 text-dark-300">Notes: {request.notes}</p>}
                              {request.responseNotes && <p className="mt-1 text-emerald-300">User response: {request.responseNotes}</p>}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-lg border px-2.5 py-1 font-bold ${
                                request.status === 'USER_CONFIRMED'
                                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                                  : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                              }`}>
                                {request.status === 'USER_CONFIRMED' ? 'User ready' : 'Pending user'}
                              </span>
                              {request.allocation.status === 'ISSUED' && (
                                <button
                                  onClick={() => {
                                    setSelectedAllocationForReturn(request.allocation);
                                    setReturnCondition('GOOD');
                                  }}
                                  className="px-2.5 py-1 rounded bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 border border-brand-500/20 font-semibold"
                                >
                                  Check-in
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: HEALTH LOGS */}
          {activeSubTab === 'health' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Part A: Log Health Record */}
              <div className="glass-panel p-5 rounded-2xl border border-dark-850 lg:col-span-1 space-y-4 h-fit">
                <h3 className="font-bold text-sm text-dark-200">Log Health checkup</h3>
                {healthError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
                    {healthError}
                  </div>
                )}
                <form onSubmit={handleHealthReportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Select Asset</label>
                    <select
                      required
                      value={healthAssetId}
                      onChange={(e) => setHealthAssetId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs cursor-pointer"
                    >
                      <option value="">Choose Asset...</option>
                      {assets.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Condition Status</label>
                    <select
                      required
                      value={healthCondition}
                      onChange={(e) => setHealthCondition(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs cursor-pointer"
                    >
                      <option value="EXCELLENT">Excellent</option>
                      <option value="GOOD">Good / Normal</option>
                      <option value="DAMAGED">Damaged / Malfunctional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Maintenance Notes</label>
                    <textarea
                      required
                      rows={3}
                      value={healthNotes}
                      onChange={(e) => setHealthNotes(e.target.value)}
                      placeholder="List details on scratches, lens checks, or cables missing..."
                      className="w-full px-3 py-2 rounded-lg glass-input text-xs resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg text-xs font-semibold btn-primary text-white"
                  >
                    Log Report
                  </button>
                </form>
              </div>

              {/* Part B: Health History Logs */}
              <div className="glass-panel p-5 rounded-2xl border border-dark-850 lg:col-span-2">
                <h3 className="font-bold text-sm text-dark-200 mb-4">Historical Logs</h3>

                {healthReports.length === 0 ? (
                  <p className="text-xs text-dark-400 text-center py-6">No damage logs or health checkups recorded.</p>
                ) : (
                  <div className="overflow-y-auto max-h-[400px] divide-y divide-dark-850/40">
                    {healthReports.map((report) => (
                      <div key={report.id} className="py-3.5 text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-dark-100">{report.asset.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                            report.condition === 'EXCELLENT'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : report.condition === 'GOOD'
                              ? 'text-brand-300 bg-brand-500/10'
                              : 'text-red-400 bg-red-500/10'
                          }`}>
                            {report.condition.toLowerCase()}
                          </span>
                        </div>
                        <p className="text-dark-300 mb-1 leading-relaxed">"{report.notes}"</p>
                        <span className="text-[10px] text-dark-400 block">
                          Reported by: {report.reportedBy.fullName} &bull; {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM AUDIT */}
          {activeSubTab === 'audit' && (
            <div className="glass-panel p-5 rounded-2xl border border-dark-850">
              <h3 className="font-bold text-sm text-dark-200 mb-4">Security Compliance Audit Log</h3>

              {auditLogs.length === 0 ? (
                <p className="text-xs text-dark-400 text-center py-6">No system logs registered.</p>
              ) : (
                <div className="overflow-y-auto max-h-[400px]">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-dark-800 text-dark-400 uppercase tracking-widest text-[9px] font-bold">
                        <th className="py-2.5 px-2">Timestamp</th>
                        <th className="py-2.5 px-2">Executor</th>
                        <th className="py-2.5 px-2">Action Type</th>
                        <th className="py-2.5 px-2">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-850/40 text-[11px] text-dark-300">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-dark-900/10">
                          <td className="py-2.5 px-2 text-dark-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 font-medium text-dark-100">
                            {log.user.fullName} ({log.user.role})
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="px-1.5 py-0.5 rounded bg-dark-900 border border-dark-800 text-[10px] uppercase font-mono tracking-wider font-semibold text-brand-300">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-sans italic text-dark-200">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating QR Modal Viewer */}
      {activeQrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl border border-dark-800 shadow-2xl relative text-center w-64">
            <h4 className="font-bold text-xs text-dark-100 uppercase tracking-wider mb-4">Generated Asset ID QR</h4>
            <div className="bg-white p-2 rounded-xl inline-block shadow-inner mb-4">
              <canvas ref={canvasRef} />
            </div>
            <button
              onClick={() => setActiveQrCode(null)}
              className="w-full py-2 rounded-lg text-xs font-semibold btn-secondary"
            >
              Close Viewer
            </button>
          </div>
        </div>
      )}

      {/* Return Asset Process Modal */}
      {selectedAllocationForReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-dark-800 shadow-2xl relative animate-slide-up">
            <h3 className="text-sm font-bold text-dark-100 mb-1 font-sans">Check-in Returned Asset</h3>
            <span className="text-xs text-brand-300 font-semibold block mb-4">
              {selectedAllocationForReturn.asset.name}
            </span>

            <form onSubmit={handleReturnAssetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">Return Condition</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs cursor-pointer"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good / Normal</option>
                  <option value="DAMAGED">Damaged (Logs Health Report)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">Check-in Notes</label>
                <textarea
                  rows={2}
                  required
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Notes on item check-in..."
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAllocationForReturn(null)}
                  disabled={!!actionKey}
                  className="w-1/2 py-2 rounded-lg text-xs font-semibold btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!actionKey}
                  className="w-1/2 py-2 rounded-lg text-xs font-semibold btn-primary text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionKey === `return-${selectedAllocationForReturn.id}` ? 'Saving...' : 'Submit Check-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Create/Edit modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-dark-800 shadow-2xl relative animate-slide-up">
            <h3 className="text-lg font-bold mb-4 font-sans">
              {editingAsset ? 'Edit Asset Parameters' : 'Create New Asset'}
            </h3>

            {assetFormError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs mb-3">
                {assetFormError}
              </div>
            )}

            <form onSubmit={handleAssetFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  value={assetForm.name}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sony A7 IV Mirrorless"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">Category</label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs cursor-pointer"
                  >
                    <option value="CAMERA">Cameras & Lenses</option>
                    <option value="LIGHTING">Studio Lighting</option>
                    <option value="AUDIO">Sound Systems</option>
                    <option value="RECORDING">Recording Gear</option>
                    <option value="COSTUME">Costumes & Dresswear</option>
                    <option value="PROP">Stage Props</option>
                    <option value="INFRA">Event Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={assetForm.totalQuantity}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, totalQuantity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={assetForm.description}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Details of lenses, cables, charging adapters included..."
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs resize-none"
                />
              </div>

              {editingAsset && (
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">Operational Condition</label>
                  <select
                    value={assetForm.status}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs cursor-pointer"
                  >
                    <option value="ACTIVE">Active / On Shelves</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="w-1/2 py-2 rounded-lg text-xs font-semibold btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-lg text-xs font-semibold btn-primary text-white"
                >
                  {editingAsset ? 'Update Asset' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
