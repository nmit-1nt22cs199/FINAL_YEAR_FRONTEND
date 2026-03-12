import { useState, useEffect } from 'react';
import { verifyTransfer } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Key, Unlock, ShieldCheck, AlertTriangle, MapPin, Navigation } from 'lucide-react';
import { getDistanceFromLatLonInMeters } from '../utils/geoUtils';

const ALLOWED_RADIUS_METERS = 50; // 50 meters tolerance
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api';

export default function KeyExchange() {
    const { token } = useAuth();

    const [sessionId, setSessionId] = useState('');
    const [receiverKey, setReceiverKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'success', 'error'
    const [message, setMessage] = useState('');

    // Location state (vehicle-based)
    const [locationStatus, setLocationStatus] = useState('checking'); // 'checking', 'verified', 'denied', 'error'
    const [distance, setDistance] = useState(null);
    const [vehicleLoc, setVehicleLoc] = useState(null);
    const [destination, setDestination] = useState(null);
    const [vehicleId, setVehicleId] = useState(null); // DB _id or string
    const [vehicleIdString, setVehicleIdString] = useState(null); // VH001 style

    useEffect(() => {
        const storedSessionId = localStorage.getItem('transferSessionId');
        if (storedSessionId) setSessionId(storedSessionId);
    }, []);

    useEffect(() => {
        if (!sessionId) return;
        const storedKey = localStorage.getItem(`transferKey:${sessionId}`);
        if (storedKey) setReceiverKey(storedKey);
    }, [sessionId]);

    // Resolve destination from active route for this session's vehicle
    const resolveVehicleIdString = async (vId) => {
        if (!vId) return null;
        // If looks like a Mongo ObjectId, fetch vehicle to get vehicleId string
        const isObjectId = typeof vId === 'string' && vId.length === 24;
        if (!isObjectId) return vId;
        try {
            const res = await fetch(`${API_BASE}/vehicles/${vId}`);
            const json = await res.json();
            if (res.ok && json?.data?.vehicleId) return json.data.vehicleId;
        } catch { }
        return null;
    };

    const loadDestination = async (sessionIdValue) => {
        try {
            if (!sessionIdValue) return;
            const sessionRes = await fetch(`${API_BASE}/transfer/${sessionIdValue}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const sessionJson = await sessionRes.json();
            if (!sessionRes.ok) throw new Error(sessionJson.error || 'Failed to load session');
            const vId = sessionJson?.data?.vehicleId?._id || sessionJson?.data?.vehicleId;
            if (!vId) throw new Error('Session has no vehicleId');
            setVehicleId(vId);

            const vIdString = await resolveVehicleIdString(vId);
            setVehicleIdString(vIdString);
            if (!vIdString) throw new Error('Could not resolve vehicleId');

            const routeRes = await fetch(`${API_BASE}/routes/active/${vIdString}`);
            const routeJson = await routeRes.json();
            if (routeRes.ok && routeJson?.data?.destination) {
                setDestination(routeJson.data.destination);
                setLocationStatus('checking');
            } else {
                setDestination(null);
                setLocationStatus('error');
                setMessage('No active route for this vehicle.');
            }
        } catch (err) {
            setDestination(null);
            setLocationStatus('error');
            setMessage(err.message || 'Failed to load destination.');
        }
    };

    // Poll latest telemetry for this vehicle
    const checkVehicleLocation = async () => {
        try {
            if (!sessionId || !destination || !vehicleIdString) return;

            const telemetryRes = await fetch(`${API_BASE}/telemetry`);
            const telemetryJson = await telemetryRes.json();
            const latest = telemetryJson?.data?.find(t => t.vehicleId === vehicleIdString);
            if (!latest?.location) {
                setLocationStatus('error');
                setMessage('No telemetry for this vehicle yet.');
                return;
            }

            setVehicleLoc(latest.location);

            const dist = getDistanceFromLatLonInMeters(
                latest.location.lat,
                latest.location.lng,
                destination.lat,
                destination.lng
            );
            setDistance(dist);
            setLocationStatus(dist <= ALLOWED_RADIUS_METERS ? 'verified' : 'denied');
        } catch (err) {
            setLocationStatus('error');
            setMessage(err.message || 'Unable to retrieve vehicle telemetry.');
        }
    };

    useEffect(() => {
        if (!sessionId) return;
        loadDestination(sessionId);
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId || !destination) return;
        checkVehicleLocation();
        const interval = setInterval(checkVehicleLocation, 2000);
        return () => clearInterval(interval);
    }, [sessionId, destination]);

    const handleVerify = async (e) => {
        e.preventDefault();

        // Strict location check before allowing submission
        if (locationStatus !== 'verified') {
            setStatus('error');
            setMessage(`Location verification failed. You are ${Math.round(distance)}m away from the ATM. Required: < ${ALLOWED_RADIUS_METERS}m.`);
            return;
        }

        setLoading(true);
        setStatus(null);
        setMessage('');

        try {
            // Pass location data for backend audit
            const result = await verifyTransfer({
                sessionId,
                receiverKey,
                location: vehicleLoc
            }, token);

            setStatus('success');
            setMessage('Key Verified! Cash box unlocking...');
            // In a real app, socket would confirm unlock

        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Verification Failed. key invalid.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 pt-20 pb-24">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-10 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.03),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(255,255,255,0.03),transparent_45%)]"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-300 text-xs tracking-wide mb-4">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Secure Verification
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">Verify & Unlock</h1>
                    <p className="text-slate-400 mt-2">Location-locked cash transfer confirmation.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
                    <div className="bg-slate-900/70 backdrop-blur-md border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>

                        {/* Location Status Banner */}
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 transition-colors ${locationStatus === 'verified' ? 'bg-green-500/10 border border-green-500/30' :
                                locationStatus === 'denied' ? 'bg-red-500/10 border border-red-500/30' :
                                    'bg-slate-800/50 border border-slate-700'
                            }`}>
                            {locationStatus === 'verified' && <MapPin className="text-green-400 w-6 h-6 shrink-0" />}
                            {locationStatus === 'denied' && <Navigation className="text-red-400 w-6 h-6 shrink-0" />}
                            {(locationStatus === 'checking' || locationStatus === 'error') && <MapPin className="text-slate-400 w-6 h-6 shrink-0 animate-pulse" />}

                            <div className="flex-1">
                                <h4 className={`text-sm font-bold ${locationStatus === 'verified' ? 'text-green-400' :
                                        locationStatus === 'denied' ? 'text-red-400' : 'text-slate-300'
                                    }`}>
                                    {locationStatus === 'verified' ? 'Vehicle At Destination' :
                                        locationStatus === 'denied' ? 'Vehicle Not At Destination' :
                                            locationStatus === 'error' ? 'Location Error' : 'Checking Vehicle...'}
                                </h4>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {locationStatus === 'verified' ? `Vehicle reached destination.` :
                                        locationStatus === 'denied' && distance ? `Distance to destination: ${Math.round(distance)}m` :
                                            locationStatus === 'error' ? (message || 'Telemetry not available.') : 'Verifying vehicle telemetry...'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Session ID</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 64f2..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white font-mono focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700"
                                    value={sessionId}
                                    onChange={e => setSessionId(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">6-Digit Sender Key</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        maxLength="6"
                                        placeholder="000000"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white font-mono text-center text-xl tracking-[1em] focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-800"
                                        value={receiverKey}
                                        onChange={e => setReceiverKey(e.target.value.replace(/\D/g, ''))}
                                    />
                                    <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || receiverKey.length !== 6 || locationStatus !== 'verified' || !destination}
                                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-lg shadow-lg shadow-cyan-900/20 hover:shadow-cyan-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-5 h-5" />
                                        Verify & Unlock
                                    </>
                                )}
                            </button>

                            {locationStatus === 'denied' && (
                                <p className="text-xs text-red-500/70 text-center animate-pulse">
                                    Vehicle must reach the destination to enable verification.
                                </p>
                            )}
                        </form>

                        {/* Status Messages */}
                        {status === 'success' && (
                            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                    <Unlock className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-green-400 text-sm">Verification Successful</h4>
                                    <p className="text-green-300/80 text-xs">Unlock command sent to vehicle.</p>
                                </div>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-red-400 text-sm">Verification Failed</h4>
                                    <p className="text-red-300/80 text-xs">{message}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                <Key className="w-5 h-5 text-cyan-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">How It Works</h3>
                                <p className="text-xs text-slate-400">Receiver enters the sender’s key at the authorized location.</p>
                            </div>
                        </div>
                        <ol className="space-y-3 text-sm text-slate-300">
                            <li>1. Get the Session ID and Sender Key from the sender.</li>
                            <li>2. Vehicle must reach the active route destination.</li>
                            <li>3. Enter the Session ID and Sender Key, then verify.</li>
                        </ol>
                        <div className="mt-6 p-4 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-400">
                            Session and key are valid only for this transfer. Keep them confidential.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LockIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
    );
}
