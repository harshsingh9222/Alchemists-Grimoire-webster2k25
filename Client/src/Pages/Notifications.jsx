import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationItem from '../Components/Notifications/NotificationItem';
import { fetchNotificationsForDate, markNotificationsRead, convertDoseLogToNotification } from '../api';
import { Calendar as CalIcon, RefreshCw } from 'lucide-react';
import { useToast } from '../Components/Toast/ToastProvider.jsx';

const POLL_MS = 5 * 60 * 1000; // 5 minutes

const Notifications = () => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState({ sent: [], upcoming: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (d) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchNotificationsForDate(new Date(d));
      const payload = res.data || { sent: [], upcoming: [] };
      setData(payload);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleUpcomingClick = async (upcomingItem) => {
    try {
      await convertDoseLogToNotification(String(upcomingItem._id));
    } catch (err) {
      console.error('convert failed', err);
    }
    navigate('/dose-tracker');
  };

  const handleMarkRead = async (notification) => {
    try {
      const ids = [notification._id];
      await markNotificationsRead(ids);
      showToast('Notification marked read', 'success');
      // remove from UI
      setData((prev) => ({ ...prev, sent: (prev.sent || []).filter((s) => String(s._id) !== String(notification._id)) }));
    } catch (err) {
      console.error('mark-read failed', err);
      showToast(err?.response?.data?.message || 'Failed to mark as read', 'error');
    }
  };

  useEffect(() => {
    load(date);
    const id = setInterval(() => load(date), POLL_MS);
    return () => clearInterval(id);
  }, [date, load]);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CalIcon className="w-6 h-6 text-purple-300" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">Notifications</h1>
          </div>
          <div className="flex items-center gap-2">
            <input className="px-3 py-2 rounded bg-purple-900/60 text-purple-100 text-sm" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <button onClick={() => load(date)} className="px-3 py-2 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-purple-200 mb-2">Sent</h3>
            <div>
              {loading ? <p className="text-purple-300">Loading…</p> : null}
              {error ? <p className="text-red-400">{error}</p> : null}
              {(!data.sent || data.sent.length === 0) && !loading && <p className="text-purple-300/70">No sent notifications for this date.</p>}
              {(data.sent || []).map((n) => (
                <NotificationItem
                  key={n._id}
                  n={n}
                  actions={
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(n);
                      }}
                      className="w-full text-center px-2 py-1 bg-gradient-to-r from-blue-500 to-sky-500 text-xs text-white rounded-md"
                    >
                      Mark as read
                    </button>
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-purple-200 mb-2">Upcoming</h3>
            <div>
              {(!data.upcoming || data.upcoming.length === 0) && !loading && <p className="text-purple-300/70">No upcoming notifications.</p>}
              {(data.upcoming || []).map((n) => (
                <div key={n._id} onClick={() => handleUpcomingClick(n)} className="cursor-pointer">
                  <NotificationItem n={n} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
