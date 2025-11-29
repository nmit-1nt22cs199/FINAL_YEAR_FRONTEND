import { useState } from "react";
import useVehicleData from '../useVehicleData';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X, Check, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Alerts() {
  const { alerts: allAlerts, acknowledgeAlert, loading } = useVehicleData();
  const [dismissed, setDismissed] = useState(new Set());
  const [filter, setFilter] = useState('all'); // all, unacknowledged, acknowledged
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [acknowledgingIds, setAcknowledgingIds] = useState(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Get unique vehicle IDs for filter dropdown
  const uniqueVehicles = [...new Set(allAlerts.map(a => a.vehicleId))].sort();

  // Apply filters
  const filteredAlerts = allAlerts.filter(alert => {
    // Filter by acknowledgement status
    if (filter === 'unacknowledged' && alert.acknowledged) return false;
    if (filter === 'acknowledged' && !alert.acknowledged) return false;

    // Filter by vehicle
    if (vehicleFilter !== 'all' && alert.vehicleId !== vehicleFilter) return false;

    // Filter out dismissed alerts
    if (dismissed.has(alert._id)) return false;

    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleVehicleFilterChange = (newVehicleFilter) => {
    setVehicleFilter(newVehicleFilter);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(Number(newItemsPerPage));
    setCurrentPage(1);
  };

  // Map backend alert level to UI config
  const getAlertConfig = (level, type) => {
    // Map level to severity
    const levelMap = {
      high: {
        icon: AlertCircle,
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-900",
        badgeColor: "bg-red-100 text-red-700",
        iconColor: "text-red-500",
      },
      medium: {
        icon: AlertTriangle,
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        textColor: "text-amber-900",
        badgeColor: "bg-amber-100 text-amber-700",
        iconColor: "text-amber-500",
      },
      low: {
        icon: Info,
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-900",
        badgeColor: "bg-blue-100 text-blue-700",
        iconColor: "text-blue-500",
      },
    };

    return levelMap[level] || levelMap.low;
  };

  const handleDismiss = (id) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
  };

  const handleAcknowledge = async (alertId) => {
    try {
      setAcknowledgingIds(prev => new Set([...prev, alertId]));
      await acknowledgeAlert(alertId);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      alert('Failed to acknowledge alert. Please try again.');
    } finally {
      setAcknowledgingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  // Format alert type for display
  const formatAlertType = (type) => {
    if (!type) return 'ALERT';
    return type.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Alerts</h1>
        <p className="text-sm sm:text-base text-slate-600">
          {filteredAlerts.length} {filteredAlerts.length === 1 ? "alert" : "alerts"}
          {filter !== 'all' && ` (${filter})`}
          {vehicleFilter !== 'all' && ` for ${vehicleFilter}`}
        </p>
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs sm:text-sm font-medium text-slate-700">Status:</span>
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="all">All Alerts</option>
            <option value="unacknowledged">Unacknowledged</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-slate-700">Vehicle:</span>
          <select
            value={vehicleFilter}
            onChange={(e) => handleVehicleFilterChange(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="all">All Vehicles</option>
            {uniqueVehicles.map(vehicleId => (
              <option key={vehicleId} value={vehicleId}>{vehicleId}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="text-xs sm:text-sm font-medium text-slate-700">Per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-3">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <p className="text-slate-500">Loading alerts...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <p className="text-slate-500">
              {filter === 'all' && vehicleFilter === 'all'
                ? 'No alerts at this time'
                : 'No alerts match the selected filters'}
            </p>
          </div>
        ) : (
          <>
            {paginatedAlerts.map((alert) => {
              const config = getAlertConfig(alert.level, alert.type);
              const IconComponent = config.icon;
              const isAcknowledging = acknowledgingIds.has(alert._id);

              return (
                <div
                  key={alert._id}
                  className={`flex flex-col sm:flex-row gap-3 sm:gap-4 items-start p-3 sm:p-4 rounded-lg border transition-all duration-200 ${config.bgColor} ${config.borderColor} ${alert.acknowledged ? 'opacity-60' : ''
                    }`}
                >
                  <IconComponent className={`flex-shrink-0 w-5 h-5 mt-0.5 ${config.iconColor}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${config.badgeColor}`}
                      >
                        {formatAlertType(alert.type)}
                      </span>
                      <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                        {alert.vehicleId}
                      </span>
                      {alert.acknowledged && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          Acknowledged
                        </span>
                      )}
                    </div>

                    <p className={`text-sm font-medium mb-1 ${config.textColor}`}>
                      {alert.message}
                    </p>

                    <p className="text-xs text-slate-500">
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert._id)}
                        disabled={isAcknowledging}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
                        title="Acknowledge alert"
                      >
                        {isAcknowledging ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Ack</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(alert._id)}
                      className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label="Dismiss alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 pb-2 px-4 bg-white rounded-lg border border-slate-200">
                <div className="text-xs sm:text-sm text-slate-600">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredAlerts.length)}</span> of{' '}
                  <span className="font-medium">{filteredAlerts.length}</span> alerts
                </div>

                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
                  {/* First Page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 sm:p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="First page"
                  >
                    <ChevronsLeft className="w-4 h-4 text-slate-600" />
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 sm:p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;

                        return (
                          <div key={page} className="flex items-center gap-1">
                            {showEllipsisBefore && (
                              <span className="px-2 text-slate-400">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`min-w-[2rem] sm:min-w-[2.5rem] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${currentPage === page
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 sm:p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 sm:p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Last page"
                  >
                    <ChevronsRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
