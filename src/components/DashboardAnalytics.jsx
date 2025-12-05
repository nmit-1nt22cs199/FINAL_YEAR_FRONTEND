import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Gauge } from 'lucide-react';

export default function DashboardAnalytics({ vehicles = [] }) {
    // Calculate fleet health distribution
    const healthData = [
        {
            name: 'Healthy',
            value: vehicles.filter(v => v.fuel >= 50 && v.temperature <= 85).length,
            color: '#10b981'
        },
        {
            name: 'Warning',
            value: vehicles.filter(v => (v.fuel >= 30 && v.fuel < 50) || (v.temperature > 85 && v.temperature <= 100)).length,
            color: '#f59e0b'
        },
        {
            name: 'Critical',
            value: vehicles.filter(v => v.fuel < 30 || v.temperature > 100).length,
            color: '#ef4444'
        }
    ];

    // Prepare fuel and temperature data for bar chart
    const fuelTempData = vehicles.slice(0, 8).map(v => ({
        name: v.vehicleId,
        fuel: v.fuel,
        temperature: v.temperature
    }));

    // Prepare speed data for area chart
    const speedData = vehicles.slice(0, 8).map(v => ({
        name: v.vehicleId,
        speed: v.speed
    }));

    // Custom tooltip styling
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-3 shadow-xl">
                    <p className="text-white font-semibold mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Section Header */}
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        Fleet Analytics
                    </h2>
                </div>
                <p className="text-slate-400 text-sm sm:text-base ml-4">Real-time insights and performance metrics</p>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Fleet Health Distribution - Pie Chart */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-400/60 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-semibold text-white">Fleet Health Distribution</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={healthData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {healthData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-4">
                        {healthData.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-xs text-slate-400">{item.name}: {item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Speed Monitoring - Area Chart */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-400/60 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-4">
                        <Gauge className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-semibold text-white">Speed Monitoring</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={speedData}>
                            <defs>
                                <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="speed" stroke="#06b6d4" fillOpacity={1} fill="url(#speedGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Fuel & Temperature Overview - Bar Chart */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-400/60 transition-all duration-300 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-semibold text-white">Fuel & Temperature Overview</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={fuelTempData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            <Bar dataKey="fuel" fill="#10b981" name="Fuel %" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="temperature" fill="#f59e0b" name="Temperature °C" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </div>
        </div>
    );
}
