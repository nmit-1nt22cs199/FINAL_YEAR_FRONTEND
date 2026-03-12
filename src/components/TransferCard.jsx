import { ArrowRight, Clock, ShieldCheck, Key, AlertOctagon } from 'lucide-react';

export default function TransferCard({ transfer, role, onVerify, onCancel }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'in-progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <ShieldCheck className="w-4 h-4" />;
            case 'cancelled': return <AlertOctagon className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    // Helper to format date safely
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString();
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-5 hover:border-cyan-500/30 transition-all shadow-lg shadow-black/20">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-xs text-slate-500 block">Session ID</span>
                    <span className="font-mono text-cyan-400 text-sm">{transfer._id.substring(0, 8)}...</span>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold uppercase ${getStatusColor(transfer.status)}`}>
                    {getStatusIcon(transfer.status)}
                    <span>{transfer.status.replace(/_/g, ' ').replace(/-/g, ' ')}</span>
                </div>
            </div>

            {/* Main Flow */}
            <div className="flex items-center justify-between bg-slate-950/50 rounded-lg p-3 border border-slate-800/50 mb-4">
                <div className="text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Sender</span>
                    <span className="text-sm font-medium text-white block">{transfer.senderId?.name || transfer.senderId?.email || 'Unknown'}</span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600" />

                <div className="text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Vehicle</span>
                    <span className="text-sm font-medium text-cyan-400 block">
                        {transfer.vehicleId?.registrationNumber || transfer.vehicleId?.vehicleId || transfer.vehicleId || 'Unknown'}
                    </span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600" />

                <div className="text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Receiver</span>
                    <span className="text-sm font-medium text-white block">{transfer.receiverId?.name || transfer.receiverId?.email || 'Unknown'}</span>
                </div>
            </div>

            {/* Conditional Details */}
            {(role === 'sender' || role === 'admin') && transfer.status === 'pending' && transfer.senderKey && (
                <div className="mb-4 bg-yellow-500/5 border border-yellow-500/20 rounded-md p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-yellow-200">One-Time Sender Key</span>
                    </div>
                    <span className="text-xl font-mono font-bold text-yellow-400 tracking-widest">{transfer.senderKey}</span>
                </div>
            )}

            {/* Footer / Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                <div className="text-xs text-slate-500">
                    Created: {formatDate(transfer.startTime)}
                </div>

                <div className="flex gap-2">
                    {((role === 'sender' || role === 'admin') && (transfer.status === 'pending' || transfer.status === 'in-progress')) && (
                        <button
                            onClick={() => onCancel(transfer._id)}
                            className="text-xs px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                        >
                            Cancel
                        </button>
                    )}

                    {(role === 'receiver' || role === 'admin') && (transfer.status === 'pending' || transfer.status === 'in-progress') && (
                        <button
                            onClick={() => onVerify(transfer._id)}
                            className="text-xs px-3 py-1.5 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors flex items-center gap-1.5"
                        >
                            <Key className="w-3 h-3" />
                            Verify Key
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
