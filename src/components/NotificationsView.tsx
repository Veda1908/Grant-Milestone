import React from 'react';
import { 
  Bell, 
  CheckCheck, 
  CheckCircle2, 
  Clock, 
  FileText, 
  IndianRupee, 
  ShieldCheck, 
  Info,
  Calendar
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';

export const NotificationsView: React.FC = () => {
  const notifications = simulationEngine.notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    simulationEngine.markAllNotificationsRead();
  };

  const handleMarkRead = (id: string) => {
    simulationEngine.markNotificationRead(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time workflow alerts for milestone evidence submissions, approvals, and fund disbursements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Bell className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Notifications</h3>
          <p className="text-xs text-slate-500 mt-1">
            You will be notified here whenever evidence is submitted, reviewed, or when funds are qualified.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => {
            let icon = <Info className="w-4 h-4 text-slate-500" />;
            let badgeBg = 'bg-slate-100 text-slate-700';

            if (n.type === 'approval') {
              icon = <ShieldCheck className="w-4 h-4 text-emerald-600" />;
              badgeBg = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            } else if (n.type === 'submission') {
              icon = <FileText className="w-4 h-4 text-blue-600" />;
              badgeBg = 'bg-blue-50 text-blue-700 border border-blue-200';
            } else if (n.type === 'release') {
              icon = <IndianRupee className="w-4 h-4 text-emerald-600" />;
              badgeBg = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            }

            return (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-start justify-between gap-4 ${
                  !n.read 
                    ? 'bg-white border-emerald-200 shadow-xs ring-1 ring-emerald-500/10' 
                    : 'bg-white/70 border-slate-200 hover:bg-white text-slate-600'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-50 shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 text-xs">
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                      )}
                      <span className={`text-[10px] font-medium px-2 py-0.2 rounded-full capitalize ${badgeBg}`}>
                        {n.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-300" />
                        {new Date(n.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {n.grantId && (
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {n.grantId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(n.id);
                    }}
                    className="text-[11px] text-slate-400 hover:text-emerald-700 font-medium shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
