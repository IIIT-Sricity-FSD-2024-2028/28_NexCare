// ReceptionQueue.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchTodayAppointments,
  patientCheckedIn,
  setActiveFilter,
  selectFilteredAppointments,
  selectRoLoading,
} from '../../store/slices/roSlice';
import { useConfirm } from '../common/useConfirm';
import { addNotification } from '../../store/slices/uiSlice';

export const ReceptionQueue = () => {
  const dispatch = useDispatch();
  const appointments = useSelector(selectFilteredAppointments);
  const loading = useSelector(selectRoLoading);
  const activeFilter = useSelector((state) => state.ro.activeFilter);
  const { confirm } = useConfirm();

  useEffect(() => {
    dispatch(fetchTodayAppointments());
  }, [dispatch]);

  const handleCheckIn = async (appointment) => {
    // Calling Poornasri's useConfirm UI kit (async promise, no functions in Redux!)
    const isConfirmed = await confirm({
      title: 'Confirm Check-In',
      message: `Do you want to check in ${appointment.patientName || 'this patient'}?`,
      confirmText: 'Check In',
      type: 'default',
    });

    if (isConfirmed) {
      // Rule #10: Synchronous check-in action
      dispatch(patientCheckedIn(appointment.id || appointment._id));
      dispatch(
        addNotification({
          type: 'success',
          message: `${appointment.patientName || 'Patient'} successfully checked in!`,
        })
      );
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Reception Officer - Daily Queue</h1>
          {/* Status filter tabs */}
          <div className="flex gap-2">
            {['ALL', 'PENDING', 'CHECKED_IN', 'COMPLETED'].map((filter) => (
              <button
                key={filter}
                onClick={() => dispatch(setActiveFilter(filter))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border hover:bg-gray-100'
                }`}
              >
                {filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading today's queue...</p>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow-sm">
            No appointments found for the selected filter.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((appt) => (
                  <tr key={appt.id || appt._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{appt.time || '09:00 AM'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{appt.patientName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{appt.doctorName}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appt.status === 'CHECKED_IN'
                            ? 'bg-green-100 text-green-800'
                            : appt.status === 'COMPLETED'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {appt.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {appt.status !== 'CHECKED_IN' && appt.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleCheckIn(appt)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md font-medium text-xs transition-colors"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionQueue;

