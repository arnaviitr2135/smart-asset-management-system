import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckCircle, Clock, XCircle, ArrowRight, CornerDownRight, RotateCcw } from 'lucide-react';

const BookingsList: React.FC = () => {
  const { apiFetch } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningIds, setReturningIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const [bookingsData, returnRequestsData] = await Promise.all([
        apiFetch('/api/v1/bookings'),
        apiFetch('/api/v1/allocations/return-requests'),
      ]);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setReturnRequests(Array.isArray(returnRequestsData) ? returnRequestsData : []);
    } catch (err) {
      console.error('Error fetching user bookings', err);
      setBookings([]);
      setReturnRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleRequestReturn = async (allocation: any) => {
    const notes = window.prompt('Any notes for the admin desk before return? You can leave this blank.');
    if (notes === null) return;

    try {
      setNotice(null);
      setReturningIds((current) => new Set(current).add(allocation.id));
      await apiFetch('/api/v1/allocations/request-return', {
        method: 'POST',
        body: JSON.stringify({
          allocationId: allocation.id,
          notes,
        }),
      });
      setNotice('Return request sent to the admin desk. Please bring the item for check-in verification.');
      await fetchBookings();
    } catch (err: any) {
      setNotice(err.message || 'Return request failed. Please try again.');
    } finally {
      setReturningIds((current) => {
        const next = new Set(current);
        next.delete(allocation.id);
        return next;
      });
    }
  };

  const handleConfirmReturnRequest = async (request: any) => {
    const responseNotes = window.prompt('Confirm you are ready to return this item. Add notes for the admin desk, or leave blank.');
    if (responseNotes === null) return;

    try {
      setNotice(null);
      setReturningIds((current) => new Set(current).add(request.allocationId));
      await apiFetch(`/api/v1/allocations/return-requests/${request.id}/respond`, {
        method: 'POST',
        body: JSON.stringify({ responseNotes }),
      });
      setNotice('Return confirmed. Please bring the item to the council desk for final check-in.');
      await fetchBookings();
    } catch (err: any) {
      setNotice(err.message || 'Return confirmation failed. Please try again.');
    } finally {
      setReturningIds((current) => {
        const next = new Set(current);
        next.delete(request.allocationId);
        return next;
      });
    }
  };

  const getActiveReturnRequest = (allocationId: string) =>
    returnRequests.find((request) =>
      request.allocationId === allocationId &&
      ['PENDING', 'USER_CONFIRMED'].includes(request.status)
    );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-dark-800 text-dark-400 border border-dark-750';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-3.5 h-3.5 mr-1 inline" />;
      case 'APPROVED':
        return <CheckCircle className="w-3.5 h-3.5 mr-1 inline" />;
      case 'REJECTED':
        return <XCircle className="w-3.5 h-3.5 mr-1 inline" />;
      default:
        return <Clock className="w-3.5 h-3.5 mr-1 inline" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-sans">My Borrowing Board</h2>
        <p className="text-sm text-dark-400">Track current loan requests, active assets, and due dates.</p>
      </div>

      {notice && (
        <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">
          {notice}
        </div>
      )}

      {returnRequests.filter((request) => request.status !== 'COMPLETED').length > 0 && (
        <div className="glass-panel rounded-2xl border border-dark-850 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-dark-100">Return Request Log</h3>
              <p className="text-xs text-dark-400">Confirm admin return requests or track your own return requests.</p>
            </div>
          </div>
          <div className="space-y-2">
            {returnRequests
              .filter((request) => request.status !== 'COMPLETED')
              .map((request) => {
                const isAdminRequest = request.source === 'ADMIN';
                const canConfirm = request.status === 'PENDING';
                const isSending = returningIds.has(request.allocationId);

                return (
                  <div key={request.id} className="flex flex-col gap-3 rounded-xl border border-dark-800 bg-dark-900/30 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="font-bold text-dark-100">{request.allocation.asset.name}</span>
                      <p className="mt-1 text-dark-400">
                        {isAdminRequest ? 'Admin requested this return' : 'You requested this return'} - Qty {request.allocation.quantity} - Due {new Date(request.allocation.dueDate).toLocaleDateString()}
                      </p>
                      {request.notes && <p className="mt-1 text-dark-300">Notes: {request.notes}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-lg border px-2.5 py-1 font-bold ${
                        request.status === 'USER_CONFIRMED'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                          : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                      }`}>
                        {request.status === 'USER_CONFIRMED' ? 'Ready for check-in' : 'Pending confirmation'}
                      </span>
                      {canConfirm && (
                        <button
                          type="button"
                          onClick={() => handleConfirmReturnRequest(request)}
                          disabled={isSending}
                          className="inline-flex items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2 font-bold text-brand-100 hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {isSending ? 'Confirming...' : 'Confirm Return'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-dark-800 rounded-xl glass-panel">
          <Calendar className="w-12 h-12 text-dark-400 mx-auto mb-3" />
          <p className="text-dark-400 text-sm">You haven't requested any assets yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const hasAllocation = !!booking.allocation;
            const isReturned = booking.allocation?.status === 'RETURNED';
            const isOverdue = booking.allocation?.status === 'OVERDUE' || 
              (booking.allocation?.status === 'ISSUED' && new Date(booking.allocation.dueDate) < new Date());
            const activeReturnRequest = booking.allocation ? getActiveReturnRequest(booking.allocation.id) : null;
            const returnRequestSent = !!activeReturnRequest;
            const canRequestReturn = booking.allocation?.status === 'ISSUED' && !activeReturnRequest;
            const canConfirmReturn = activeReturnRequest?.status === 'PENDING';
            const returnConfirmed = activeReturnRequest?.status === 'USER_CONFIRMED';
            const isRequestingReturn = booking.allocation && returningIds.has(booking.allocation.id);

            return (
              <div 
                key={booking.id} 
                className="glass-panel p-5 rounded-2xl border border-dark-850 flex flex-col gap-4"
              >
                {/* Upper line: booking title, quantity, and status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-dark-50">{booking.asset.name}</h3>
                    <p className="text-xs text-dark-400">
                      Quantity requested: <span className="text-dark-200 font-semibold">{booking.quantity}x</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center ${getStatusStyle(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Date spans and loan description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-dark-900/40 p-3.5 rounded-xl border border-dark-850/50">
                  <div>
                    <span className="text-dark-400 block mb-0.5">Duration Requested</span>
                    <span className="font-semibold text-dark-200 flex items-center gap-1.5">
                      {new Date(booking.startDate).toLocaleDateString()}
                      <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                      {new Date(booking.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-dark-400 block mb-0.5">Purpose of Request</span>
                    <p className="text-dark-200 italic font-medium">"{booking.purpose}"</p>
                  </div>
                </div>

                {booking.status === 'APPROVED' && !hasAllocation && (
                  <div className="border-t border-dark-850/50 pt-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-300">
                          Approved, Awaiting Handover
                        </span>
                        <p className="mt-1 text-dark-200">
                          Visit the council desk to collect this item. Once an admin issues it, your return option will appear here.
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 font-bold text-emerald-300">
                        Ready for collection
                      </span>
                    </div>
                  </div>
                )}

                {/* Asset Allocation status block */}
                {hasAllocation && (
                  <div className="border-t border-dark-850/50 pt-3.5 flex flex-col gap-2">
                    <span className="text-[10px] text-brand-400 uppercase tracking-widest font-bold flex items-center gap-1">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      Handover & Loan Status
                    </span>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-dark-900/20 p-3 rounded-xl border border-dark-850/30">
                      <div>
                        <span className="text-dark-400 mr-2">Status:</span>
                        <span className={`font-semibold ${
                          isReturned 
                            ? 'text-emerald-400' 
                            : isOverdue 
                            ? 'text-red-400 animate-pulse' 
                            : 'text-brand-300'
                        }`}>
                          {isReturned ? 'Returned' : isOverdue ? 'OVERDUE' : 'Handover Complete (On Loan)'}
                        </span>
                      </div>

                      <div>
                        <span className="text-dark-400 mr-2">Issued On:</span>
                        <span className="text-dark-200 font-medium">
                          {new Date(booking.allocation.issuedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div>
                        <span className="text-dark-400 mr-2">Due Date:</span>
                        <span className={`font-medium ${isOverdue && !isReturned ? 'text-red-400 font-semibold' : 'text-dark-200'}`}>
                          {new Date(booking.allocation.dueDate).toLocaleDateString()}
                        </span>
                      </div>

                      {isReturned && booking.allocation.returnRecord && (
                        <div>
                          <span className="text-dark-400 mr-2">Condition on Return:</span>
                          <span className={`font-semibold ${
                            booking.allocation.returnRecord.conditionOnReturn === 'EXCELLENT'
                              ? 'text-emerald-400'
                              : booking.allocation.returnRecord.conditionOnReturn === 'GOOD'
                              ? 'text-brand-300'
                              : 'text-red-400'
                          }`}>
                            {booking.allocation.returnRecord.conditionOnReturn.toLowerCase()}
                          </span>
                        </div>
                      )}

                      {!isReturned && (
                        <button
                          type="button"
                          onClick={() => activeReturnRequest ? handleConfirmReturnRequest(activeReturnRequest) : handleRequestReturn(booking.allocation)}
                          disabled={(!canRequestReturn && !canConfirmReturn) || !!isRequestingReturn}
                          className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                            returnConfirmed
                              ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                              : 'border border-brand-500/30 bg-brand-500/10 text-brand-100 hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60'
                          }`}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {isRequestingReturn
                            ? 'Sending...'
                            : returnConfirmed
                            ? 'Return Confirmed'
                            : returnRequestSent
                            ? 'Confirm Return'
                            : 'Return Asset'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingsList;
