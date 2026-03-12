import { Shield, Truck, User as UserIcon, Lock } from 'lucide-react';

export default function UserCard({ user, onAssign, onUnassign }) {
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
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-4 hover:border-cyan-500/30 transition-all">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{user.name || user.username || user.email}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-bold ${getRoleColor(user.role)}`}>
                                {user.role}
                            </span>
                            <span>•</span>
                            <span>{user.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-500 block mb-1">Vehicle Assignment</span>
                        <span className="text-sm font-medium text-slate-300">
                            {user.assignedVehicle ? (
                                <span className="text-cyan-400">{user.assignedVehicle.registrationNumber}</span>
                            ) : (
                                'Unassigned'
                            )}
                        </span>
                    </div>

                    {user.assignedVehicle ? (
                        <button
                            onClick={() => onUnassign(user._id)}
                            className="text-xs px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                        >
                            Unassign
                        </button>
                    ) : (
                        <button
                            onClick={() => onAssign(user)}
                            className="text-xs px-3 py-1.5 rounded-md bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
                        >
                            Assign Vehicle
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
