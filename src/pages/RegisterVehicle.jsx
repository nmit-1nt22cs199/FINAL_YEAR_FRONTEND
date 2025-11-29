import { useState } from 'react';

const API_BASE = 'http://localhost:3000/api';

export default function RegisterVehicle() {
  const [formData, setFormData] = useState({
    vehicleId: '',
    registrationNumber: '',
    model: '',
    driverName: '',
    driverPhone: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Vehicle registered successfully!' });
        setFormData({ vehicleId: '', registrationNumber: '', model: '', driverName: '', driverPhone: '' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to register vehicle' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      console.error('Error registering vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-20 flex items-start justify-center px-4">
      <main className="w-full max-w-md"> {/* slightly narrower */}
        <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-6 shadow-lg"> {/* smaller padding */}
          <form onSubmit={handleSubmit} className="space-y-4"> {/* closer fields */}
            {[
              { label: 'Vehicle ID', name: 'vehicleId', placeholder: 'e.g., VH001', type: 'text' },
              { label: 'Registration Number', name: 'registrationNumber', placeholder: 'e.g., KA02AB1234', type: 'text' },
              { label: 'Vehicle Model', name: 'model', placeholder: 'e.g., Tata Ace', type: 'text' },
              { label: 'Driver Name', name: 'driverName', placeholder: 'e.g., Ramesh Kumar', type: 'text' },
              { label: 'Driver Phone', name: 'driverPhone', placeholder: 'e.g., 9876543210', type: 'tel', pattern: '[0-9]{10}' }
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {field.label} <span className="text-red-400">*</span>
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required
                  placeholder={field.placeholder}
                  pattern={field.pattern || undefined}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition text-sm"
                />
                {field.name === 'driverPhone' && (
                  <p className="text-xs text-slate-500 mt-1">10-digit phone number</p>
                )}
              </div>
            ))}

            {message.text && (
              <div
                className={`p-3 rounded-lg ml-auto w-fit ${
                  message.type === 'success'
                    ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                    : 'bg-red-500/20 border border-red-500/50 text-red-400'
                }`}
              >
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registering...
                </span>
              ) : (
                'Register Vehicle'
              )}
            </button>
          </form>
        </div>

        <div className="mt-4 bg-slate-900/70 border border-cyan-500/20 rounded-lg p-3 text-xs text-slate-400">
          <h3 className="text-cyan-400 font-semibold mb-1"> Registration Guidelines</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>Vehicle ID should be unique (e.g., VH001, VH002)</li>
            <li>Registration number format: State code + District code + Series + Number</li>
            <li>Ensure driver phone number is active for alerts</li>
            <li>All fields are required for successful registration</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
