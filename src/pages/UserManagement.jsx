import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, registerUser, assignVehicle, unassignVehicle, getVehicles } from '../api/api';
import UserCard from '../components/UserCard';
import { UserPlus, Loader2, RefreshCw, ShieldCheck, Users, UserCog } from 'lucide-react';

export default function UserManagement() {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [assigningUser, setAssigningUser] = useState(null);
    const [error, setError] = useState('');
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'admin').length;
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


            const [usersRes, vehiclesRes] = await Promise.all([
                getUsers(token),
                getVehicles()
            ]);
            
        console.log("Users API Response:", usersRes);
        console.log("Vehicles API Response:", vehiclesRes);

            const normalizeList = (res) => {
                if (!res) return [];
                if (res.error) return [];
                const data = res.data ?? res;
                if (Array.isArray(data)) return data;
                if (Array.isArray(data?.data)) return data.data;
                return [];
            };

            if (usersRes?.error) {
                setError(usersRes.error);
            }
            setUsers(normalizeList(usersRes));
            setVehicles(normalizeList(vehiclesRes));

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

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 pt-20 mt-5 h-full">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 right-0 w-80 h-80 bg-cyan-500/10 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-10 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.03),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(255,255,255,0.03),transparent_45%)]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-10 ">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-300 text-xs tracking-wide mb-4">
                            <UserCog className="w-3.5 h-3.5" />
                            Identity & Access
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white">User Management</h1>
                       
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={loadData}
                            className="px-3 py-2 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/70 border border-slate-700/60 transition"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => setIsRegistering(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                        >
                            <UserPlus className="w-5 h-5" />
                            Register User
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                            <Users className="w-4 h-4 text-cyan-300" />
                            Total Users
                        </div>
                        <div className="text-2xl font-bold text-white mt-1">{totalUsers}</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-400">Admins</div>
                        <div className="text-2xl font-bold text-red-300 mt-1">{adminCount}</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-400">Receivers</div>
                        <div className="text-2xl font-bold text-purple-300 mt-1">{receiverCount}</div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300">
                        {error}
                    </div>
                )}

                {/* Users Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users?.length > 0 ? users.map(user => (
                        <UserCard
                            key={user._id}
                            user={user}
                            onAssign={setAssigningUser}
                            onUnassign={handleUnassign}
                        />
                    )) : (
                        <div className="col-span-full p-10 text-center border border-slate-800 rounded-2xl bg-slate-900/40">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4">
                                <ShieldCheck className="w-6 h-6 text-cyan-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">No users found</h3>
                            <p className="text-slate-400 mt-2">Register a new user to begin assigning roles and vehicles.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Registration Modal */}
            {isRegistering && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-cyan-300" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Register New User</h2>
                                <p className="text-xs text-slate-400">Create accounts with assigned roles.</p>
                            </div>
                        </div>
                        <form onSubmit={handleRegister}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-cyan-500 outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-cyan-500 outline-none"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-cyan-500 outline-none"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Role</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-cyan-500 outline-none"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="driver">Driver</option>
                                        <option value="sender">Sender</option>
                                        <option value="receiver">Receiver</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsRegistering(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-400 transition"
                                >
                                    Register
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {assigningUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-6 shadow-2xl">
                        <h2 className="text-lg font-bold text-white mb-2">Assign Vehicle to {assigningUser.name || assigningUser.email}</h2>
                        <p className="text-slate-400 text-sm mb-4">Select a vehicle to assign to this user.</p>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {vehicles.length > 0 ? vehicles.map(v => (
                                <button
                                    key={v._id}
                                    onClick={() => handleAssign(v._id)}
                                    className="w-full text-left px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 transition flex justify-between items-center group"
                                >
                                    <span className="text-white font-medium">{v.registrationNumber || v.vehicleId}</span>
                                    <span className="text-xs text-slate-500 group-hover:text-cyan-400">{v.vehicleId || v._id}</span>
                                </button>
                            )) : (
                                <p className="text-slate-500 italic">No vehicles available</p>
                            )}
                        </div>

                        <div className="mt-4 text-right">
                            <button
                                onClick={() => setAssigningUser(null)}
                                className="text-slate-400 hover:text-white text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
