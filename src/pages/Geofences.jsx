import { useState, useEffect } from 'react';
import { fetchGeofences, createGeofence, updateGeofence, deleteGeofence, toggleGeofence } from '../api/geofenceApi';
import { MapPin, Plus, Edit2, Trash2, Power, Circle } from 'lucide-react';

export default function Geofences() {
    const [geofences, setGeofences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingGeofence, setEditingGeofence] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'circle',
        center: { lat: '', lng: '' },
        radius: '1000',
        color: '#3b82f6',
        alertOnEntry: true,
        alertOnExit: true,
        description: ''
    });

    useEffect(() => {
        loadGeofences();
    }, []);

    const loadGeofences = async () => {
        try {
            setLoading(true);
            const data = await fetchGeofences();
            setGeofences(data);
        } catch (error) {
            console.error('Failed to load geofences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const geofenceData = {
                ...formData,
                center: {
                    lat: parseFloat(formData.center.lat),
                    lng: parseFloat(formData.center.lng)
                },
                radius: parseFloat(formData.radius)
            };

            if (editingGeofence) {
                await updateGeofence(editingGeofence._id, geofenceData);
            } else {
                await createGeofence(geofenceData);
            }

            await loadGeofences();
            resetForm();
        } catch (error) {
            alert(`Failed to ${editingGeofence ? 'update' : 'create'} geofence: ${error.message}`);
        }
    };

    const handleEdit = (geofence) => {
        setEditingGeofence(geofence);
        setFormData({
            name: geofence.name,
            type: geofence.type,
            center: geofence.center,
            radius: geofence.radius.toString(),
            color: geofence.color,
            alertOnEntry: geofence.alertOnEntry,
            alertOnExit: geofence.alertOnExit,
            description: geofence.description || ''
        });
        setShowCreateModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this geofence?')) return;

        try {
            await deleteGeofence(id);
            await loadGeofences();
        } catch (error) {
            alert('Failed to delete geofence');
        }
    };

    const handleToggle = async (id) => {
        try {
            await toggleGeofence(id);
            await loadGeofences();
        } catch (error) {
            alert('Failed to toggle geofence');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'circle',
            center: { lat: '', lng: '' },
            radius: '1000',
            color: '#3b82f6',
            alertOnEntry: true,
            alertOnExit: true,
            description: ''
        });
        setEditingGeofence(null);
        setShowCreateModal(false);
    };

    return (
        <div className="flex-1 bg-slate-950 p-4 md:p-6 overflow-auto mt-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Geofences</h1>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Create Geofence
                </button>
            </div>

            {/* Geofences Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : geofences.length === 0 ? (
                <div className="text-center py-16">
                    <MapPin size={64} className="mx-auto text-slate-700 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-400 mb-2">No Geofences Yet</h3>
                    <p className="text-slate-500 mb-6">Create your first geofence to start monitoring zones</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                    >
                        Create First Geofence
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {geofences.map((geofence) => (
                        <div
                            key={geofence._id}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${geofence.color}20`, color: geofence.color }}
                                    >
                                        <Circle size={20} fill={geofence.color} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{geofence.name}</h3>
                                        <span className={`text-xs px-2 py-1 rounded ${geofence.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                            {geofence.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Type:</span>
                                    <span className="text-white capitalize">{geofence.type}</span>
                                </div>
                                {geofence.type === 'circle' && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Radius:</span>
                                        <span className="text-white">{geofence.radius}m</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Alerts:</span>
                                    <span className="text-white">
                                        {geofence.alertOnEntry && geofence.alertOnExit ? 'Entry & Exit' :
                                            geofence.alertOnEntry ? 'Entry Only' :
                                                geofence.alertOnExit ? 'Exit Only' : 'None'}
                                    </span>
                                </div>
                                {geofence.description && (
                                    <p className="text-sm text-slate-400 mt-2">{geofence.description}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t border-slate-800">
                                <button
                                    onClick={() => handleToggle(geofence._id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${geofence.active
                                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                            : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                                        }`}
                                    title={geofence.active ? 'Deactivate' : 'Activate'}
                                >
                                    <Power size={16} />
                                </button>
                                <button
                                    onClick={() => handleEdit(geofence)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(geofence._id)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingGeofence ? 'Edit Geofence' : 'Create New Geofence'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                    placeholder="e.g., Main Warehouse"
                                    required
                                />
                            </div>

                            {/* Latitude */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.center.lat}
                                    onChange={(e) => setFormData({ ...formData, center: { ...formData.center, lat: e.target.value } })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                    placeholder="e.g., 28.6139"
                                    required
                                />
                            </div>

                            {/* Longitude */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.center.lng}
                                    onChange={(e) => setFormData({ ...formData, center: { ...formData.center, lng: e.target.value } })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                    placeholder="e.g., 77.2090"
                                    required
                                />
                            </div>

                            {/* Radius */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Radius (meters)</label>
                                <input
                                    type="number"
                                    value={formData.radius}
                                    onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                    placeholder="e.g., 1000"
                                    min="50"
                                    required
                                />
                            </div>

                            {/* Color */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-full h-12 px-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
                                />
                            </div>

                            {/* Alert Options */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.alertOnEntry}
                                        onChange={(e) => setFormData({ ...formData, alertOnEntry: e.target.checked })}
                                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                                    />
                                    Alert on Entry
                                </label>
                                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.alertOnExit}
                                        onChange={(e) => setFormData({ ...formData, alertOnExit: e.target.checked })}
                                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                                    />
                                    Alert on Exit
                                </label>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                    rows="3"
                                    placeholder="Additional notes about this geofence..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                                >
                                    {editingGeofence ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
