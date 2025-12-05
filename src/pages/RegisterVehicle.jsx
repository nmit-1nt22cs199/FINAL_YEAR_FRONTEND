import { useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api';

export default function RegisterVehicle() {
  const [formData, setFormData] = useState({
    vehicleId: '',
    registrationNumber: '',
    model: '',
    driverName: '',
    driverPhone: '',
    email: ''      // <-- Added
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Added email field here
  const fields = [
    { label: "Vehicle ID", name: "vehicleId", placeholder: "e.g., VH001", type: "text" },
    { label: "Registration Number", name: "registrationNumber", placeholder: "e.g., KA02AB1234", type: "text" },
    { label: "Vehicle Model", name: "model", placeholder: "e.g., Tata Ace", type: "text" },
    { label: "Driver Name", name: "driverName", placeholder: "e.g., Ramesh Kumar", type: "text" },
    { label: "Driver Phone", name: "driverPhone", placeholder: "e.g., 9876543210", type: "tel", pattern: "[0-9]{10}" },
    { label: "Driver Email", name: "email", placeholder: "e.g., driver@example.com", type: "email" }, // <-- Added
  ];

  const guidelines = [
    "Vehicle ID should be unique (e.g., VH001, VH002)",
    "Registration number format: State code + District code + Series + Number",
    "Driver email helps in sending reports & alerts",
    "Ensure driver phone number is active",
    "All fields are required for successful registration",
  ];

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

        setFormData({
          vehicleId: '',
          registrationNumber: '',
          model: '',
          driverName: '',
          driverPhone: '',
          email: ''    // <-- reset
        });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 sm:py-12 md:py-16 px-4 sm:px-6 overflow-y-scroll">
      <div className="max-w-7xl mx-auto">

        <div className="mb-20 sm:mb-12">
         
          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">

          {/* FORM */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 border border-cyan-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm hover:border-cyan-500/40 transition-colors duration-300">
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  
                  {fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-semibold text-slate-200 mb-2">
                        {field.label} <span className="text-cyan-400">*</span>
                      </label>

                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        required
                        placeholder={field.placeholder}
                        pattern={field.pattern || undefined}
                        className="w-full px-4 py-3 bg-slate-700/40 border border-slate-600/60 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      />

                      {field.name === "driverPhone" && (
                        <p className="text-xs text-slate-500 mt-1.5">Must be 10 digits</p>
                      )}
                    </div>
                  ))}

                </div>

                {message.text && (
                  <div
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      message.type === "success"
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                        : "bg-red-500/10 border-red-500/40 text-red-400"
                    }`}
                  >
                    <p className="text-sm font-medium">{message.text}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registering Vehicle...
                    </span>
                  ) : (
                    "Register Vehicle"
                  )}
                </button>

              </form>
            </div>
          </div>

          {/* GUIDELINES */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/30 border border-cyan-500/20 rounded-2xl p-6 sm:p-8 sticky top-8 backdrop-blur-sm hover:border-cyan-500/40 transition-colors duration-300">

              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                {/* <div className="w-2 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>  */}
                <h3 className="text-xl sm:text-2xl font-bold text-white">Guidelines</h3>
              </div>

              <ul className="space-y-3 sm:space-y-4">
                {guidelines.map((g, i) => (
                  <li key={i} className="flex gap-3 group">
                    <div className="flex-shrink-0 w-1.5 h-1.5 bg-cyan-500 rounded-full mt-2 group-hover:scale-125 transition-transform"></div>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{g}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-700/50">
                <div className="flex gap-2 sm:gap-3">
                  
                  <p className="text-xs sm:text-sm text-slate-400">
                    Complete registration is required before the vehicle can be tracked in the system.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
