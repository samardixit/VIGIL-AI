import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useAuth } from '../context/AuthContext';
import { verifyLocation, scanAttendance, getActiveSessions } from '../services/api';
import Navbar from '../components/Navbar';

export default function ScanPage() {
  const { user } = useAuth();
  const webcamRef = useRef(null);

  const [step, setStep] = useState('loading'); // loading, no-session, gps-check, gps-fail, camera, scanning, success, error
  const [activeSession, setActiveSession] = useState(null);
  const [gpsResult, setGpsResult] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkActiveSessions();
  }, []);

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
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 10000,
        });
      });

      const res = await verifyLocation({
        session_id: session.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      setGpsResult({
        ...res.data,
        studentLat: position.coords.latitude,
        studentLon: position.coords.longitude,
      });

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
      setError(`GPS Error: ${err.message}`);
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
      setError(err.response?.data?.detail || 'Scan failed');
    }
  }, [activeSession, gpsResult]);

  return (
    <>
      <Navbar />
      <div className="animated-bg" />

      <div className="page-container" style={{ maxWidth: '700px' }}>
        <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={styles.pageTitle}>
            <span className="text-gradient">Attendance Scanner</span>
          </h1>
          <p style={styles.pageSub}>GPS verification → Face recognition → Done</p>
        </div>

        {/* Step indicator */}
        <div style={styles.steps}>
          <StepDot label="GPS" active={['gps-check', 'gps-fail'].includes(step)} done={['camera', 'scanning', 'success'].includes(step)} />
          <div style={styles.stepLine} />
          <StepDot label="Camera" active={['camera', 'scanning'].includes(step)} done={step === 'success'} />
          <div style={styles.stepLine} />
          <StepDot label="Done" active={step === 'success'} done={false} />
        </div>

        <div className="glass-card animate-scale-in" style={{ padding: '32px', marginTop: '24px' }}>
          {/* Loading */}
          {step === 'loading' && (
            <div style={styles.center}>
              <div className="spinner" />
              <p style={styles.msg}>Checking active sessions...</p>
            </div>
          )}

          {/* No Session */}
          {step === 'no-session' && (
            <div style={styles.center}>
              <span style={{ fontSize: '3rem' }}>📭</span>
              <h2 style={styles.stepTitle}>No Active Sessions</h2>
              <p style={styles.msg}>No teacher has started a class session yet. Please wait for your teacher to begin.</p>
              <button className="btn btn-ghost" onClick={checkActiveSessions} style={{ marginTop: '16px' }}>
                🔄 Refresh
              </button>
            </div>
          )}

          {/* GPS Check */}
          {step === 'gps-check' && (
            <div style={styles.center}>
              <div className="spinner" />
              <h2 style={styles.stepTitle}>Verifying Location</h2>
              <p style={styles.msg}>Checking if you're within the classroom geofence...</p>
              {activeSession && (
                <div style={styles.sessionInfo}>
                  <span>📚 {activeSession.subject_name}</span>
                  <span>👨‍🏫 {activeSession.faculty_name}</span>
                </div>
              )}
            </div>
          )}

          {/* GPS Fail */}
          {step === 'gps-fail' && (
            <div style={styles.center}>
              <span style={{ fontSize: '3rem' }}>📍</span>
              <h2 style={{ ...styles.stepTitle, color: '#f43f5e' }}>Location Check Failed</h2>
              <p style={styles.msg}>{error}</p>
              {gpsResult && (
                <div style={styles.gpsDetails}>
                  <div>Distance: <strong>{gpsResult.distance_meters}m</strong></div>
                  <div>Required: <strong>≤ {gpsResult.radius_meters}m</strong></div>
                </div>
              )}
              <button className="btn btn-primary" onClick={() => checkGPS(activeSession)} style={{ marginTop: '16px' }}>
                📍 Retry GPS Check
              </button>
            </div>
          )}

          {/* Camera */}
          {step === 'camera' && (
            <div style={styles.center}>
              <div style={styles.gpsSuccess}>
                ✅ Location verified ({gpsResult?.distance_meters}m / {gpsResult?.radius_meters}m)
              </div>

              <div style={styles.webcamWrap}>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.8}
                  videoConstraints={{ facingMode: 'user', width: 480, height: 360 }}
                  style={styles.webcam}
                />
                <div style={styles.scanOverlay}>
                  <div style={styles.scanFrame} />
                </div>
              </div>

              <p style={styles.msg}>Position your face in the frame and click scan</p>

              <button
                className="btn btn-primary btn-lg w-full"
                onClick={handleCapture}
                style={{ marginTop: '16px' }}
                id="capture-btn"
              >
                🔬 Scan Face
              </button>
            </div>
          )}

          {/* Scanning */}
          {step === 'scanning' && (
            <div style={styles.center}>
              <div className="spinner" style={{ width: '50px', height: '50px' }} />
              <h2 style={styles.stepTitle}>Analyzing Face...</h2>
              <p style={styles.msg}>Running biometric verification with liveness detection</p>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div style={styles.center}>
              <div style={styles.successIcon}>✅</div>
              <h2 style={{ ...styles.stepTitle, color: '#10b981' }}>Attendance Marked!</h2>
              <div style={styles.resultCard}>
                <div><strong>Student:</strong> {scanResult?.student_name}</div>
                <div><strong>ID:</strong> {scanResult?.student_id}</div>
                <div><strong>Confidence:</strong> {((scanResult?.confidence || 0) * 100).toFixed(1)}%</div>
                <div><strong>Liveness:</strong> {scanResult?.is_live ? '✅ Verified' : '❌ Failed'}</div>
              </div>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div style={styles.center}>
              <span style={{ fontSize: '3rem' }}>❌</span>
              <h2 style={{ ...styles.stepTitle, color: '#f43f5e' }}>Verification Failed</h2>
              <p style={styles.msg}>{error}</p>
              <button className="btn btn-primary" onClick={() => setStep('camera')} style={{ marginTop: '16px' }}>
                🔄 Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StepDot({ label, active, done }) {
  const bg = done ? '#10b981' : active ? '#00d4ff' : 'rgba(255,255,255,0.1)';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.8rem', fontWeight: 700, color: done || active ? '#fff' : '#8b95b3',
        transition: 'all 0.3s',
        boxShadow: active ? `0 0 15px ${bg}50` : 'none',
        margin: '0 auto',
      }}>
        {done ? '✓' : ''}
      </div>
      <div style={{ fontSize: '0.65rem', color: active || done ? '#f0f4ff' : '#8b95b3', marginTop: '4px', fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

const styles = {
  pageTitle: { fontSize: '2rem', fontWeight: 800 },
  pageSub: { color: '#8b95b3', fontSize: '0.9rem', marginTop: '4px' },
  steps: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0',
    maxWidth: '300px', margin: '0 auto',
  },
  stepLine: {
    flex: 1, height: '2px', background: 'rgba(255,255,255,0.1)', margin: '0 8px',
  },
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', gap: '12px',
  },
  stepTitle: { fontSize: '1.25rem', fontWeight: 700, color: '#f0f4ff' },
  msg: { fontSize: '0.85rem', color: '#8b95b3', maxWidth: '400px' },
  sessionInfo: {
    display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#8b95b3',
    padding: '10px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
  },
  gpsDetails: {
    padding: '12px 20px', background: 'rgba(244,63,94,0.06)', borderRadius: '8px',
    fontSize: '0.8rem', color: '#f0f4ff', display: 'flex', gap: '20px',
  },
  gpsSuccess: {
    padding: '8px 16px', background: 'rgba(16,185,129,0.08)',
    borderRadius: '999px', fontSize: '0.8rem', color: '#10b981', fontWeight: 500,
  },
  webcamWrap: {
    position: 'relative', borderRadius: '16px', overflow: 'hidden',
    border: '2px solid rgba(0,212,255,0.2)', width: '100%', maxWidth: '480px',
  },
  webcam: { width: '100%', display: 'block' },
  scanOverlay: {
    position: 'absolute', inset: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
  },
  scanFrame: {
    width: '200px', height: '250px', border: '2px solid rgba(0,212,255,0.4)',
    borderRadius: '16px',
    boxShadow: '0 0 30px rgba(0,212,255,0.1)',
  },
  successIcon: { fontSize: '4rem', animation: 'scaleIn 0.5s ease-out' },
  resultCard: {
    padding: '16px 24px', background: 'rgba(16,185,129,0.06)',
    borderRadius: '12px', border: '1px solid rgba(16,185,129,0.12)',
    fontSize: '0.85rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px',
  },
};
