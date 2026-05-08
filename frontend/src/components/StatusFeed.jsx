import { useState, useEffect } from 'react';
import wsService from '../services/websocket';

export default function StatusFeed() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsub = wsService.subscribe((data) => {
      if (data.type === 'attendance_marked') {
        setEvents((prev) => [data, ...prev].slice(0, 40));
        setConnected(true);
      }
    });
    wsService.connect('global');
    return () => unsub();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-200">Live Scan Feed</span>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
          events.length > 0
            ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-400'
            : 'bg-white/[0.04] border-white/[0.06] text-gray-500'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${events.length > 0 ? 'bg-emerald-400' : 'bg-gray-600'}`}
            style={events.length > 0 ? { animation: 'pulse 2s ease-in-out infinite' } : {}} />
          {events.length > 0 ? 'LIVE' : 'WAITING'}
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {events.length === 0 ? (
          <div className="empty-state py-10">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <ScanIcon />
            </div>
            <p className="text-sm text-gray-500 font-medium">No live scan events</p>
            <p className="text-xs text-gray-600 mt-1">Events will appear here when students scan in</p>
          </div>
        ) : (
          events.map((event, i) => (
            <div key={i} className="animate-slide-right flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                event.method === 'biometric'
                  ? 'bg-blue-500/10 border border-blue-500/20'
                  : 'bg-violet-500/10 border border-violet-500/20'
              }`}>
                {event.method === 'biometric'
                  ? <FaceIcon className="text-blue-400" />
                  : <HandIcon className="text-violet-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-200 truncate">{event.student_name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-gray-600">{event.student_id}</span>
                  {event.confidence && (
                    <>
                      <span className="text-gray-700">·</span>
                      <span className="text-xs text-emerald-500">{(event.confidence * 100).toFixed(0)}%</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-600 flex-shrink-0">
                {event.timestamp
                  ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'now'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ScanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9V5a2 2 0 0 1 2-2h4M3 15v4a2 2 0 0 0 2 2h4M21 9V5a2 2 0 0 0-2-2h-4M21 15v4a2 2 0 0 1-2 2h-4" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
function FaceIcon({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}
function HandIcon({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8a6 6 0 0 0 12 0v-5a2 2 0 0 0-4 0v3" />
    </svg>
  );
}
