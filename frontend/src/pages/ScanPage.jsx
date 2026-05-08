import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useAuth } from '../context/AuthContext';
import { verifyLocation, scanAttendance, getActiveSessions } from '../services/api';
import Navbar from '../components/Navbar';

const STEPS = ['GPS', 'Camera', 'Done'];

export default function ScanPage() {
  const { user } = useAuth();
  const webcamRef = useRef(null);

  const [step, setStep] = useState('loading');
  const [activeSession, setActiveSession] = useState(null);
  const [gpsResult, setGpsResult] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { checkActiveSessions(); }, []);

  const checkActiveSessions = async () => {
    try {
      const res = await getActiveSessions();
      if (res.data.length > 0) {
        setActiveSession(res.data[0]);
        setStep('gps-check');
        checkGPS(res.data[0]);
      } else {
        setStep('no-session');
      }
    } catch {
      setStep('no-session');
    }
  };

  const checkGPS = async (session) => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      const res = await verifyLocation({
        session_id: session.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setGpsResult({ ...res.data, studentLat: position.coords.latitude, studentLon: position.coords.longitude });
      if (res.data.within_geofence) {
        setStep('camera');
      } else if (res.data.window_expired) {
        setStep('gps-fail');
        setError('Attendance window has expired (10 minutes)');
      } else {
        setStep('gps-fail');
        setError(res.data.message);
      }
    } catch (err) {
      setStep('gps-fail');
      setError(`Location error: ${err.message}`);
    }
  };

  const handleCapture = useCallback(async () => {
    if (!webcamRef.current || !activeSession) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    setStep('scanning');
    try {
      const res = await scanAttendance({
        session_id: activeSession.id,
        image_base64: imageSrc,
        latitude: gpsResult.studentLat,
        longitude: gpsResult.studentLon,
      });
      setScanResult(res.data);
      setStep(res.data.success ? 'success' : 'error');
      if (!res.data.success) setError(res.data.message || 'Verification failed');
    } catch (err) {
      setStep('error');
      setError(err.response?.data?.detail || 'Scan failed. Please try again.');
    }
  }, [activeSession, gpsResult]);

  const currentStepIndex = {
    'gps-check': 0, 'gps-fail': 0, 'camera': 1, 'scanning': 1, 'success': 2, 'error': 1,
  }[step] ?? -1;

  return (
    <>
      <Navbar />
      <div className="max-w-xl mx-auto px-6 py-10">

        {/* Page title */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Attendance Scanner</h1>
          <p className="text-sm text-gray-500">GPS verification → Face recognition → Done</p>
        </div>

        {/* Step indicator */}
        {step !== 'loading' && step !== 'no-session' && (
          <div className="flex items-center justify-center gap-0 max-w-xs mx-auto mb-8 animate-fade-in-up">
            {STEPS.map((label, i) => {
              const done = i < currentStepIndex;
              const active = i === currentStepIndex;
              return (
                <div key={label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done  ? 'bg-emerald-500 text-white' :
                      active? 'bg-blue-500 text-white ring-4 ring-blue-500/20' :
                              'bg-white/[0.06] text-gray-600'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs font-medium ${
                      done || active ? 'text-gray-300' : 'text-gray-600'
                    }`}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-16 h-px mx-2 mb-5 transition-all ${
                      done ? 'bg-emerald-500/50' : 'bg-white/[0.06]'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Card content */}
        <div className="card-static rounded-2xl p-8 animate-scale-in">

          {/* Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="spinner w-7 h-7" />
              <p className="text-sm text-gray-500">Checking active sessions…</p>
            </div>
          )}

          {/* No session */}
          {step === 'no-session' && (
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-300 mb-1">No Active Sessions</h2>
                <p className="text-sm text-gray-600 max-w-xs">
                  Your teacher hasn't started a class session yet. Please wait and try again.
                </p>
              </div>
              <button className="btn-ghost rounded-xl px-5 py-2.5 text-sm" onClick={checkActiveSessions}>
                Refresh
              </button>
            </div>
          )}

          {/* GPS checking */}
          {step === 'gps-check' && (
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <div className="spinner w-7 h-7" />
              <div>
                <h2 className="text-base font-semibold text-gray-300 mb-1">Verifying Location</h2>
                <p className="text-sm text-gray-600">Checking classroom geofence boundary…</p>
              </div>
              {activeSession && (
                <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-gray-500">
                  <span>{activeSession.subject_name}</span>
                  {activeSession.faculty_name && <><span className="text-gray-700">·</span><span>{activeSession.faculty_name}</span></>}
                </div>
              )}
            </div>
          )}

          {/* GPS fail */}
          {step === 'gps-fail' && (
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <div className="w-14 h-14 rounded-2xl bg-red-500/[0.08] border border-red-500/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-red-400 mb-1">Location Check Failed</h2>
                <p className="text-sm text-gray-600 max-w-xs">{error}</p>
              </div>
              {gpsResult && (
                <div className="flex gap-6 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-gray-500">
                  <div>Distance: <span className="text-gray-300 font-semibold">{gpsResult.distance_meters}m</span></div>
                  <div>Required: <span className="text-gray-300 font-semibold">≤{gpsResult.radius_meters}m</span></div>
                </div>
              )}
              <button className="btn-primary rounded-xl px-5 py-2.5 text-sm" onClick={() => checkGPS(activeSession)}>
                Retry GPS Check
              </button>
            </div>
          )}

          {/* Camera */}
          {step === 'camera' && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Location verified · {gpsResult?.distance_meters}m / {gpsResult?.radius_meters}m
              </div>

              {/* Webcam */}
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.1] w-full"
                style={{ maxWidth: 420 }}>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.85}
                  videoConstraints={{ facingMode: 'user', width: 480, height: 360 }}
                  className="w-full block"
                />
                {/* Scan overlay frame */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-44 h-56 rounded-2xl"
                    style={{ border: '2px solid rgba(59,130,246,0.5)', boxShadow: '0 0 24px rgba(59,130,246,0.1)' }} />
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Position your face in the frame and click Scan
              </p>

              <button id="capture-btn" className="btn-primary btn-lg w-full rounded-xl" onClick={handleCapture}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
                Scan Face
              </button>
            </div>
          )}

          {/* Scanning */}
          {step === 'scanning' && (
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <div className="spinner w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-300 mb-1">Analyzing Face</h2>
                <p className="text-sm text-gray-600">Running biometric verification with liveness detection…</p>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center text-center gap-5 py-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-scale-in">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-emerald-400 mb-1">Attendance Marked</h2>
                <p className="text-sm text-gray-500">Your attendance has been recorded successfully</p>
              </div>
              <div className="w-full px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-left flex flex-col gap-2.5">
                {[
                  { label: 'Student', value: scanResult?.student_name },
                  { label: 'ID', value: scanResult?.student_id },
                  { label: 'Confidence', value: `${((scanResult?.confidence || 0) * 100).toFixed(1)}%` },
                  { label: 'Liveness', value: scanResult?.is_live ? 'Verified ✓' : 'Failed ✗' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-600">{label}</span>
                    <span className="text-gray-200 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <div className="w-14 h-14 rounded-2xl bg-red-500/[0.08] border border-red-500/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-red-400 mb-1">Verification Failed</h2>
                <p className="text-sm text-gray-600 max-w-xs">{error}</p>
              </div>
              <button className="btn-primary rounded-xl px-5 py-2.5 text-sm" onClick={() => setStep('camera')}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
