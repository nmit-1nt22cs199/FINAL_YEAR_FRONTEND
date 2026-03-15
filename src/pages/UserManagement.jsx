import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, registerUser, assignVehicle, unassignVehicle, getVehicles, getActiveSessions } from '../api/api';
import UserCard from '../components/UserCard';
import { UserPlus, Loader2, RefreshCw, ShieldCheck, Users, UserCog, Shield, Lock, ArrowRight, Truck } from 'lucide-react';

export default function UserManagement() {
    const { token, user, role } = useAuth();
    const [users, setUsers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [assigningUser, setAssigningUser] = useState(null);
    const [error, setError] = useState('');
    
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const senderCount = users.filter(u => u.role === 'sender').length;
    const receiverCount = users.filter(u => u.role === 'receiver').length;

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'driver'
    });

    useEffect(() => {
        if (token) {
            loadData();
        }
    }, [token]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            if (!token) {
                setUsers([]);
                setVehicles([]);
                setError('Not authenticated. Please log in as admin to view users.');
                return;
            }


            const normalizeList = (res) => {
                if (!res) return [];
                if (res.error) return [];
                const data = res.data ?? res;
                if (Array.isArray(data)) return data;
                if (Array.isArray(data?.data)) return data.data;
                return [];
            };

            if (role === 'admin') {
                const [usersRes, vehiclesRes, sessionsRes] = await Promise.all([
                    getUsers(token),
                    getVehicles(),
                    getActiveSessions(token)
                ]);
                
                console.log("Users API Response:", usersRes);
                console.log("Vehicles API Response:", vehiclesRes);
                console.log("Sessions API Response:", sessionsRes);

                if (usersRes?.error) {
                    setError(usersRes.error);
                }
                setUsers(normalizeList(usersRes));
                setVehicles(normalizeList(vehiclesRes));
                setSessions(normalizeList(sessionsRes));
            } else {
                setUsers([user]);
                setVehicles([]);
                setSessions([]);
            }

        } catch (err) {
            console.error("Failed to load user data", err);
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await registerUser(formData);
            alert('User Registered Successfully');
            setIsRegistering(false);
            setFormData({ name: '', email: '', password: '', role: 'driver' });
            loadData();
        } catch (err) {
            alert('Registration Failed: ' + err.message);
        }
    };

    const handleAssign = async (vehicleId) => {
        if (!assigningUser) return;
        try {
            await assignVehicle({ userId: assigningUser._id, vehicleId }, token);
            setAssigningUser(null);
            loadData();
        } catch (err) {
            alert('Assignment Failed: ' + err.message);
        }
    };

    const handleUnassign = async (userId) => {
        if (!confirm('Unassign vehicle from this user?')) return;
        try {
            await unassignVehicle(userId, token);
            loadData();
        } catch (err) {
            alert('Unassignment Failed: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="flex items-center gap-3 text-cyan-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm tracking-wide">Loading users...</span>
                </div>
            </div>
        );
    }

    const senders = users.filter(u => u.role === 'sender' || u.role === 'driver');
    const receivers = users.filter(u => u.role === 'receiver');

    return (
        <div className="relative h-screen overflow-y-auto bg-slate-950 pb-24 pt-20 mt-5">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                {/* Header Container */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-cyan-500/80">
                            <Shield className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Fleet Authority Control</span>
                        </div>

                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadData}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all duration-300"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        {role === 'admin' && (
                            <button
                                onClick={() => setIsRegistering(true)}
                                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-950/20 transition-all duration-300"
                            >
                                <UserPlus className="w-5 h-5" />
                                Register Participant
                            </button>
                        )}
                    </div>
                </div>

                {role === 'admin' && (
                    <>
                        {/* Stats Strip */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                            {[
                                { label: 'Total Node', val: totalUsers, icon: Users, color: 'text-white' },
                                { label: 'Administrators', val: adminCount, icon: Shield, color: 'text-red-400' },
                                { label: 'Active Senders', val: senderCount, icon: Truck, color: 'text-cyan-400' },
                                { label: 'Active Receivers', val: receiverCount, icon: Lock, color: 'text-purple-400' }
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 backdrop-blur-md">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                                        <stat.icon className={`w-4 h-4 ${stat.color} opacity-40`} />
                                    </div>
                                    <div className="text-2xl font-black text-white">{stat.val}</div>
                                </div>
                            ))}
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                            {/* Senders Column */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                                        <Truck className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Senders & Drivers</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {senders.map(u => (
                                        <UserCard key={u._id} user={u} onAssign={setAssigningUser} onUnassign={handleUnassign} isAdmin={role === 'admin'} />
                                    ))}
                                </div>
                            </div>

                            {/* Receivers Column */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <Lock className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Receivers</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {receivers.map(u => (
                                        <UserCard key={u._id} user={u} onAssign={setAssigningUser} onUnassign={handleUnassign} isAdmin={role === 'admin'} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Active Sessions Visualization */}
                        <div className="mt-12">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-green-400" />
                                Live Transfer Map
                            </h2>
                            {sessions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sessions.map(s => (
                                        <div key={s._id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between group hover:border-cyan-500/30 transition-all duration-300">
                                            <div className="flex-1">
                                                <span className="text-[10px] text-slate-500 uppercase block mb-1">Sender</span>
                                                <span className="text-sm font-bold text-white">{s.senderId?.name || '---'}</span>
                                            </div>
                                            <div className="flex flex-col items-center px-4">
                                                <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent relative">
                                                    <Truck className="w-4 h-4 text-cyan-400 absolute left-1/2 -translate-x-1/2 -top-2 animate-pulse" />
                                                </div>
                                                <span className="text-[9px] text-cyan-500 font-mono mt-2">{s.vehicleId?.registrationNumber || 'VEHICLE'}</span>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <span className="text-[10px] text-slate-500 uppercase block mb-1">Receiver</span>
                                                <span className="text-sm font-bold text-white">{s.receiverId?.name || '---'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                                    No active transfer sessions detected at this moment.
                                </div>
                            )}
                        </div>
                    </>
                )}

                {role !== 'admin' && (
                    <div className="max-w-md">
                         <UserCard user={user} isAdmin={false} />
                    </div>
                )}
            </div>

            {/* Modals remain the same but with refined styling */}
            {isRegistering && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
                         {/* Close logic etc */}
                         <h2 className="text-2xl font-bold text-white mb-6">Enroll Participant</h2>
                         <form onSubmit={handleRegister} className="space-y-4">
                             {/* ... (Keep form inputs) ... */}
                             <input type="text" placeholder="Full Name" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                             <input type="email" placeholder="Corporate Email" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                             <input type="password" placeholder="Secure Password" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                             <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option value="driver">Driver</option>
                                <option value="sender">Sender</option>
                                <option value="receiver">Receiver</option>
                                <option value="admin">Administrator</option>
                             </select>
                             <div className="flex gap-4 mt-8">
                                <button type="button" onClick={() => setIsRegistering(false)} className="flex-1 py-3 text-slate-400 font-bold hover:text-white transition">Cancel</button>
                                <button type="submit" className="flex-2 px-8 py-3 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-500 transition">Complete Registration</button>
                             </div>
                         </form>
                    </div>
                </div>
            )}

            {/* Assignment Modal Refined */}
            {assigningUser && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-8 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-2">Assign Fleet Asset</h2>
                        <p className="text-slate-400 text-xs mb-6">Select a vehicle to link with **{assigningUser.name || assigningUser.email}**</p>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {vehicles.map(v => (
                                <button key={v._id} onClick={() => handleAssign(v._id)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:border-cyan-500/50 group transition-all">
                                    <div className="flex items-center gap-3">
                                        <Truck className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                                        <span className="text-white font-bold">{v.registrationNumber || v.vehicleId}</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-cyan-400" />
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setAssigningUser(null)} className="w-full mt-6 py-3 text-slate-500 font-bold hover:text-white transition">Dismiss</button>
                    </div>
                </div>
            )}
        </div>
    );
}
