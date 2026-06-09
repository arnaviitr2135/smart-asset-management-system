import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckCircle, Clock, XCircle, ArrowRight, CornerDownRight } from 'lucide-react';

const BookingsList: React.FC = () => {
  const { apiFetch } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/v1/bookings');
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching user bookings', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

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

                {/* Asset Allocation status block */}
                {hasAllocation && (
                  <div className="border-t border-dark-850/50 pt-3.5 flex flex-col gap-2">
                    <span className="text-[10px] text-brand-400 uppercase tracking-widest font-bold flex items-center gap-1">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      Allocation & Check-out Status
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
                          {isReturned ? 'Returned' : isOverdue ? 'OVERDUE' : 'Issued (On Loan)'}
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
