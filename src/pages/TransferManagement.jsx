import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getActiveSessions,
    getMySessions,
    initiateTransfer,
    cancelTransfer,
    getVehicles,
    getUsers
} from '../api/api';
import TransferCard from '../components/TransferCard';
import { Plus, Loader2, RefreshCw, ShieldCheck, KeyRound, Radio } from 'lucide-react';

// NOTE: Since App.jsx uses simple state-based routing 'setPage', 
// we'll accept 'setPage' as a prop to navigate to KeyExchange.
export default function TransferManagement({ setPage }) {
    const { user, token, role } = useAuth();
    const [activeSessions, setActiveSessions] = useState([]);
    const [history, setHistory] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [receivers, setReceivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [selectedReceiver, setSelectedReceiver] = useState('');
    const [receiverIdInput, setReceiverIdInput] = useState('');
    const [lastCreatedSession, setLastCreatedSession] = useState(null);
    const activeCount = activeSessions.length;
    const pendingCount = activeSessions.filter(s => s.status === 'pending').length;
    const inProgressCount = activeSessions.filter(s => s.status === 'in-progress').length;

    // NOTE: In our backend model, initiateTransfer takes { vehicleId }.
    // The backend determines the driver and potentially the receiver if auto-assigned, 
    // OR we need to pass receiverId if the prompt implies sender chooses receiver.
    // The current backend implementation of initiateTransfer expects: { vehicleId, receiverId }

    // We need a list of potential receivers? 
    // For simplicity, let's fetch users or just assume the vehicle has a receiver assigned?
    // Checking backend: TransferSession requires receiverId. 
    // Checking userController: We have get users. 

    // Let's implement a simple creation modal.

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const sessionsPromise = role === 'admin' ? getActiveSessions(token) : getMySessions(token);
            const [sessionsRes, vehiclesRes, usersRes] = await Promise.all([
                sessionsPromise,
                getVehicles(),
                getUsers(token)
            ]);

            if (sessionsRes?.data?.data) setActiveSessions(sessionsRes.data.data);
            else setActiveSessions([]);
            if (vehiclesRes?.data?.data) setVehicles(vehiclesRes.data.data);
            else setVehicles([]);
            if (usersRes?.data?.data) {
                const receiverList = usersRes.data.data.filter(u => u.role === 'receiver' || u.role === 'admin');
                setReceivers(receiverList);
            }
        } catch (err) {
            console.error("Failed to load transfer data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const receiverId = receivers.length > 0 ? selectedReceiver : receiverIdInput.trim();
        if (!selectedVehicle || !receiverId) return;

        try {
            // For this implementation, we'll ask the admin/sender to pick a vehicle.
            // We also need a receiver. Ideally we'd pick from a list of users with role 'receiver'.
            // But to save time, let's assume for now we just need vehicle id and let backend handle 
            // or we accept receiver ID input.
            // Let's prompt for receiver ID in the UI for now or hardcode for testing?
            // Better: Fetch receivers. 
            // ACTUALLY: The prompt requirements said "Sender and Receiver enter their keys".
            // Let's just create the session.

            // We will need a way to select a receiver. 
            // Let's add a "receiver email" input for now to resolve the ID.
            // Or just assume the "receiver" is the one logged in on the other device?
            // Backend initiateTransfer: const { vehicleId, receiverId } = req.body;

            // I'll add a temporary "Receiver ID" input field, usually you'd select from a dropdown.
            const res = await initiateTransfer({ vehicleId: selectedVehicle, receiverId }, token);
            const senderKey = res?.data?.senderKey;
            const sessionId = res?.data?.session?.id;
            if (sessionId && senderKey) {
                localStorage.setItem(`transferKey:${sessionId}`, senderKey);
            }
            setLastCreatedSession({
                sessionId: sessionId || '',
                senderKey: senderKey || '',
                receiverId
            });
            alert(`Transfer Initiated!\nSession ID: ${sessionId || 'Unavailable'}\nSender Key: ${senderKey || 'Unavailable'}`);
            setIsCreating(false);
            loadData();
        } catch (err) {
            alert("Failed to create transfer: " + err.message);
        }
    };

    const handleVerify = (sessionId) => {
        // Navigate to Key Exchange page with this session pre-filled
        // Since we are using prop-based routing in App.jsx
        // We need to pass data to that page. 
        // We can use localStorage or a simple global state/context if needed.
        // For now, let's just switch page. User will type ID.
        // Enhanced: We could emit an event or use a shared state. 
        // Let's just go to the page.
        if (setPage) {
            localStorage.setItem('transferSessionId', sessionId);
            setPage('key-exchange');
        }
    };

    const handleCancel = async (sessionId) => {
        if (!confirm("Are you sure you want to cancel this transfer?")) return;
        try {
            await cancelTransfer(sessionId, token);
            loadData();
        } catch (err) {
            alert("Failed to cancel: " + err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="flex items-center gap-3 text-cyan-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm tracking-wide">Loading transfer sessions...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 pt-20">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-10 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.03),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(255,255,255,0.03),transparent_45%)]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-300 text-xs tracking-wide mb-4">
                            <Radio className="w-3.5 h-3.5" />
                            Secure Transit Control
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white">Cash Transfers</h1>
                       
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={loadData}
                            className="px-3 py-2 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/70 border border-slate-700/60 transition"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>

                        {(role === 'sender' || role === 'admin') && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                New Transfer
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-400">Active Sessions</div>
                        <div className="text-2xl font-bold text-white mt-1">{activeCount}</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-400">Pending</div>
                        <div className="text-2xl font-bold text-yellow-300 mt-1">{pendingCount}</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-400">In Progress</div>
                        <div className="text-2xl font-bold text-cyan-300 mt-1">{inProgressCount}</div>
                    </div>
                </div>

                {lastCreatedSession && (
                    <div className="mb-8 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
                        <div className="text-sm text-cyan-200 font-semibold mb-2">Latest Session Details</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
                                <div className="text-slate-400">Session ID</div>
                                <div className="text-cyan-300 font-mono mt-1 break-all">{lastCreatedSession.sessionId}</div>
                            </div>
                            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
                                <div className="text-slate-400">Sender Key</div>
                                <div className="text-emerald-300 font-mono mt-1 text-lg tracking-widest">
                                    {lastCreatedSession.senderKey || 'Unavailable'}
                                </div>
                            </div>
                            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
                                <div className="text-slate-400">Receiver</div>
                                <div className="text-slate-200 mt-1 break-all">{lastCreatedSession.receiverId}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Sessions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {activeSessions.length > 0 ? (
                        activeSessions.map(session => (
                            <TransferCard
                                key={session._id}
                                transfer={session}
                                role={role}
                                onVerify={handleVerify}
                                onCancel={handleCancel}
                            />
                        ))
                    ) : (
                        <div className="col-span-full p-10 text-center border border-slate-800 rounded-2xl bg-slate-900/40">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4">
                                <ShieldCheck className="w-6 h-6 text-cyan-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">No active transfers</h3>
                            <p className="text-slate-400 mt-2">Create a new transfer to generate a session ID and sender key.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Creation Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                <KeyRound className="w-5 h-5 text-cyan-300" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Initiate Transfer</h2>
                                <p className="text-xs text-slate-400">Session ID and sender key are generated on create.</p>
                            </div>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                <label className="block text-sm text-slate-400 mb-2">Select Vehicle</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                    value={selectedVehicle}
                                    onChange={(e) => setSelectedVehicle(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Vehicle --</option>
                                    {vehicles.map(v => (
                                        <option key={v._id} value={v._id}>
                                            {v.registrationNumber || v.vehicleId}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {receivers.length > 0 ? (
                                <div className="mb-4">
                                    <label className="block text-sm text-slate-400 mb-2">Select Receiver</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                        value={selectedReceiver}
                                        onChange={(e) => setSelectedReceiver(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Choose Receiver --</option>
                                        {receivers.map(u => (
                                            <option key={u._id} value={u._id}>
                                                {u.name || u.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <label className="block text-sm text-slate-400 mb-2">Receiver User ID</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                        value={receiverIdInput}
                                        onChange={(e) => setReceiverIdInput(e.target.value)}
                                        placeholder="Paste receiver user ID"
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition"
                                >
                                    Create Session
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
