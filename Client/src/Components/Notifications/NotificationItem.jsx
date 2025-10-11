import PropTypes from 'prop-types';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

const NotificationItem = ({ n, onAcknowledge, actions }) => {
  const when = n.scheduledFor ? new Date(n.scheduledFor).toLocaleString() : '—';
  const Icon = n.type === 'missed_dose' ? AlertCircle : n.type === 'achievement' ? CheckCircle : Clock;
  return (
    <div
      className={`p-3 rounded-lg bg-gradient-to-br from-purple-950/80 to-indigo-950/80 border border-purple-500/20 mb-2 ${onAcknowledge ? 'cursor-pointer hover:shadow-lg transform hover:-translate-y-0.5 transition' : ''}`}
      onClick={() => onAcknowledge && onAcknowledge(n)}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded bg-purple-800/40">
          {Icon && <Icon className="w-5 h-5 text-purple-300" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-purple-100">{n.title}</h4>
            <span className="text-xs text-purple-300">{when}</span>
          </div>
          <p className="text-sm text-purple-300/80 mt-1">{n.message}</p>
        </div>
        {actions && (
          <div className="ml-3 flex items-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

NotificationItem.propTypes = {
  n: PropTypes.object.isRequired,
  onAcknowledge: PropTypes.func,
  actions: PropTypes.node,
};

export default NotificationItem;
