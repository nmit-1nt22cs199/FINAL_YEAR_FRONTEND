import { useState } from "react"
import useVehicleData from "../useVehicleData"
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Check,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Bell,
} from "lucide-react"

export default function Alerts() {
  const { alerts: allAlerts, acknowledgeAlert, loading } = useVehicleData()
  const [dismissed, setDismissed] = useState(new Set())
  const [filter, setFilter] = useState("all")
  const [vehicleFilter, setVehicleFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all") // New category filter
  const [acknowledgingIds, setAcknowledgingIds] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Acknowledgment Modal State
  const [ackModal, setAckModal] = useState(null) // alertId
  const [operatorName, setOperatorName] = useState("")
  const [ackNote, setAckNote] = useState("")

  const uniqueVehicles = [...new Set(allAlerts.map((a) => a.vehicleId))].sort()

  const getAlertCategory = (type) => {
    if (type.includes('geofence')) return 'geofence';
    if (['high_temperature', 'low_fuel'].includes(type)) return 'health';
    if (['overspeed', 'crash'].includes(type)) return 'safety';
    return 'other';
  };

  const filteredAlerts = allAlerts.filter((alert) => {
    if (filter === "unacknowledged" && alert.acknowledged) return false
    if (filter === "acknowledged" && !alert.acknowledged) return false
    if (vehicleFilter !== "all" && alert.vehicleId !== vehicleFilter) return false
    if (dismissed.has(alert._id)) return false

    // Category Filter Logic
    if (categoryFilter !== "all") {
      const category = getAlertCategory(alert.type);
      if (category !== categoryFilter) return false;
    }

    return true
  })

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex)

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }

  const handleVehicleFilterChange = (newVehicleFilter) => {
    setVehicleFilter(newVehicleFilter)
    setCurrentPage(1)
  }

  const handleCategoryFilterChange = (newCategory) => {
    setCategoryFilter(newCategory)
    setCurrentPage(1)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(Number(newItemsPerPage))
    setCurrentPage(1)
  }

  const getAlertConfig = (level, type) => {
    const levelMap = {
      high: {
        icon: AlertCircle,
        bgColor: "bg-slate-900/80",
        borderColor: "border-red-500/30",
        textColor: "text-red-100",
        badgeColor: "bg-red-500/20 text-red-300",
        iconColor: "text-red-400",
        accentColor: "from-red-500 to-orange-500",
      },
      medium: {
        icon: AlertTriangle,
        bgColor: "bg-slate-900/80",
        borderColor: "border-amber-500/30",
        textColor: "text-amber-100",
        badgeColor: "bg-amber-500/20 text-amber-300",
        iconColor: "text-amber-400",
        accentColor: "from-amber-500 to-orange-500",
      },
      low: {
        icon: Info,
        bgColor: "bg-slate-900/80",
        borderColor: "border-cyan-500/30",
        textColor: "text-cyan-100",
        badgeColor: "bg-cyan-500/20 text-cyan-300",
        iconColor: "text-cyan-400",
        accentColor: "from-cyan-500 to-blue-500",
      },
    }
    return levelMap[level] || levelMap.low
  }

  const handleDismiss = (id) => {
    const newDismissed = new Set(dismissed)
    newDismissed.add(id)
    setDismissed(newDismissed)
  }

  const handleOpenAckModal = (alertId) => {
    setAckModal(alertId)
    setOperatorName("")
    setAckNote("")
  }

  const handleSubmitAck = async () => {
    if (!ackModal) return
    if (!operatorName.trim()) {
      alert("Please enter your name")
      return
    }

    try {
      setAcknowledgingIds((prev) => new Set([...prev, ackModal]))
      await acknowledgeAlert(ackModal, operatorName, ackNote)
      setAckModal(null)
    } catch (error) {
      console.error("Failed to acknowledge alert:", error)
      alert("Failed to acknowledge alert. Please try again.")
    } finally {
      setAcknowledgingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(ackModal)
        return newSet
      })
    }
  }

  const formatAlertType = (type) => {
    if (!type) return "ALERT"
    return type.replace(/_/g, " ").toUpperCase()
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 p-4 sm:p-6 lg:p-8 overflow-scroll">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* Acknowledgment Modal */}
      {ackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Acknowledge Alert</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Operator Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  value={ackNote}
                  onChange={(e) => setAckNote(e.target.value)}
                  placeholder="Add a note about this alert..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAckModal(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAck}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 rounded-lg transition-all shadow-lg shadow-cyan-500/20"
                >
                  Confirm Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
              <Bell className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Alerts</h1>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            {filteredAlerts.length} {filteredAlerts.length === 1 ? "alert" : "alerts"}
            {filter !== "all" && ` • ${filter}`}
            {vehicleFilter !== "all" && ` • ${vehicleFilter}`}
          </p>
        </div>

        {/* Filters Section */}
        <div className="mb-8 p-4 sm:p-6 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-400">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
                className="px-3 py-2.5 text-sm bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              >
                <option value="all">All Categories</option>
                <option value="geofence">Geofence (Location)</option>
                <option value="health">Vehicle Health (Temp/Fuel)</option>
                <option value="safety">Safety (Speed/Crash)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-400">Status</label>
              <select
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-3 py-2.5 text-sm bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="unacknowledged">Unacknowledged</option>
                <option value="acknowledged">Acknowledged</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-400">Vehicle</label>
              <select
                value={vehicleFilter}
                onChange={(e) => handleVehicleFilterChange(e.target.value)}
                className="px-3 py-2.5 text-sm bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              >
                <option value="all">All Vehicles</option>
                {uniqueVehicles.map((vehicleId) => (
                  <option key={vehicleId} value={vehicleId}>
                    {vehicleId}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-400">Per Page</label>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className="px-3 py-2.5 text-sm bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-16 bg-slate-800/20 backdrop-blur-xl border border-slate-700/50 rounded-xl">
              <div className="inline-flex gap-2 mb-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
              <p className="text-slate-400 text-sm">Loading alerts...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/20 backdrop-blur-xl border border-slate-700/50 rounded-xl">
              <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
              <p className="text-slate-400 text-sm">
                {filter === "all" && vehicleFilter === "all"
                  ? "No alerts at this time"
                  : "No alerts match the selected filters"}
              </p>
            </div>
          ) : (
            <>
              {paginatedAlerts.map((alert) => {
                const config = getAlertConfig(alert.level, alert.type)
                const IconComponent = config.icon
                const isAcknowledging = acknowledgingIds.has(alert._id)

                return (
                  <div
                    key={alert._id}
                    className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${config.bgColor} ${config.borderColor} ${alert.acknowledged ? "opacity-60" : "hover:border-slate-600/80"
                      }`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.accentColor}`}></div>

                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 p-2.5 rounded-lg bg-slate-800/50 group-hover:bg-slate-800 transition-colors`}
                      >
                        <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-lg ${config.badgeColor} whitespace-nowrap`}
                          >
                            {formatAlertType(alert.type)}
                          </span>
                          <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-lg bg-slate-700/50 text-slate-300">
                            {alert.vehicleId}
                          </span>
                          {alert.acknowledged && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-lg bg-emerald-500/20 text-emerald-300">
                              <CheckCircle className="w-3 h-3" />
                              Acknowledged
                            </span>
                          )}
                        </div>

                        <p className={`text-sm font-medium mb-2 ${config.textColor}`}>{alert.message}</p>

                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-slate-500">
                            {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ""}
                          </p>

                          {alert.acknowledged && (
                            <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                <span>Acknowledged by <span className="text-slate-300 font-medium">{alert.acknowledgedBy || 'Operator'}</span></span>
                                <span>at {alert.acknowledgedAt ? new Date(alert.acknowledgedAt).toLocaleTimeString() : ''}</span>
                              </div>
                              {alert.acknowledgmentNote && (
                                <p className="mt-1 pl-4.5 italic text-slate-500">"{alert.acknowledgmentNote}"</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
                        {!alert.acknowledged && (
                          <button
                            onClick={() => handleOpenAckModal(alert._id)}
                            disabled={isAcknowledging}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-700 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/20"
                          >
                            {isAcknowledging ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Acknowledge</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(alert._id)}
                          className="flex-shrink-0 p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
                          aria-label="Dismiss alert"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 px-4 py-3 bg-slate-800/20 backdrop-blur-xl border border-slate-700/50 rounded-xl">
                  <div className="text-xs sm:text-sm text-slate-400">
                    Showing <span className="font-semibold text-slate-300">{startIndex + 1}</span> to{" "}
                    <span className="font-semibold text-slate-300">{Math.min(endIndex, filteredAlerts.length)}</span> of{" "}
                    <span className="font-semibold text-slate-300">{filteredAlerts.length}</span> alerts
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="First page"
                    >
                      <ChevronsLeft className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                        })
                        .map((page, index, array) => {
                          const showEllipsisBefore = index > 0 && page - array[index - 1] > 1

                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsisBefore && <span className="px-1.5 text-slate-600">...</span>}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`min-w-[2.25rem] px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${currentPage === page
                                  ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/20"
                                  : "bg-slate-900/50 border border-slate-700 text-slate-400 hover:bg-slate-800"
                                  }`}
                              >
                                {page}
                              </button>
                            </div>
                          )
                        })}
                    </div>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Next page"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Last page"
                    >
                      <ChevronsRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
