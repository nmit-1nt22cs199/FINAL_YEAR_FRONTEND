import { Shield, Truck, User as UserIcon, Lock } from 'lucide-react';

export default function UserCard({ user, onAssign, onUnassign, isAdmin }) {
    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <Shield className="w-4 h-4" />;
            case 'driver': return <Truck className="w-4 h-4" />;
            case 'receiver': return <Lock className="w-4 h-4" />;
            default: return <UserIcon className="w-4 h-4" />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'driver': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'receiver': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'sender': return 'bg-green-500/10 text-green-400 border-green-500/20';
            default: return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-4 hover:border-cyan-500/30 transition-all flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white truncate max-w-[150px]">{user.name || user.username || user.email}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-bold ${getRoleColor(user.role)}`}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Assigned Vehicle</span>
                        <div className="flex items-center gap-2">
                             {user.assignedVehicle ? (
                                <span className="text-sm font-bold text-cyan-400">
                                    {user.assignedVehicle.registrationNumber || user.assignedVehicle.vehicleId || 'Active'}
                                </span>
                            ) : (
                                <span className="text-xs text-slate-600 italic">None</span>
                            )}
                        </div>
                    </div>

                    {isAdmin && (
                        user.assignedVehicle ? (
                            <button
                                onClick={() => onUnassign(user._id)}
                                className="text-[10px] px-2 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all uppercase font-bold"
                            >
                                Unassign
                            </button>
                        ) : (
                            <button
                                onClick={() => onAssign(user)}
                                className="text-[10px] px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-400 hover:bg-cyan-400/20 border border-cyan-500/20 transition-all uppercase font-bold"
                            >
                                Assign
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
