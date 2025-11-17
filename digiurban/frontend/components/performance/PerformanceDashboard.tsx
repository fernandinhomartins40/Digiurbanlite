'use client'

import React, { useState, useEffect } from 'react'
import { usePerformance, performanceUtils } from '@/hooks/usePerformance'
import { cacheManager } from '@/hooks/useCache'
import {
  Activity,
  Zap,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Monitor,
  Wifi,
  HardDrive,
  Cpu,
  RefreshCw,
  Eye,
  BarChart3
} from 'lucide-react'

interface PerformanceCard {
  title: string
  value: string | number
  unit?: string
  status: 'good' | 'warning' | 'error'
  trend?: 'up' | 'down' | 'stable'
  description: string
  icon: React.ReactNode
}

export function PerformanceDashboard() {
  const { metrics, alerts, score, isMonitoring, clearAlerts, getComponentMetrics } = usePerformance()
  const [cacheStats, setCacheStats] = useState(cacheManager.getAllStats())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(cacheManager.getAllStats())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const refreshMetrics = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const getStatusFromScore = (score: number): 'good' | 'warning' | 'error' => {
    if (score >= 80) return 'good'
    if (score >= 60) return 'warning'
    return 'error'
  }

  const getStatusColor = (status: 'good' | 'warning' | 'error') => {
    const colors = {
      good: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100'
    }
    return colors[status]
  }

  const performanceCards: PerformanceCard[] = [
    {
      title: 'Performance Score',
      value: score,
      unit: '/100',
      status: getStatusFromScore(score),
      description: 'Overall performance score based on Web Vitals and custom metrics',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      title: 'Largest Contentful Paint',
      value: metrics?.lcp ? performanceUtils.formatValue(metrics.lcp) : 'N/A',
      status: metrics?.lcp ? (metrics.lcp <= 2500 ? 'good' : metrics.lcp <= 4000 ? 'warning' : 'error') : 'good',
      description: 'Time until the largest content element is visible',
      icon: <Eye className="w-5 h-5" />
    },
    {
      title: 'First Input Delay',
      value: metrics?.fid ? performanceUtils.formatValue(metrics.fid) : 'N/A',
      status: metrics?.fid ? (metrics.fid <= 100 ? 'good' : metrics.fid <= 300 ? 'warning' : 'error') : 'good',
      description: 'Time from first user interaction to browser response',
      icon: <Zap className="w-5 h-5" />
    },
    {
      title: 'Cumulative Layout Shift',
      value: metrics?.cls ? metrics.cls.toFixed(3) : 'N/A',
      status: metrics?.cls ? (metrics.cls <= 0.1 ? 'good' : metrics.cls <= 0.25 ? 'warning' : 'error') : 'good',
      description: 'Measure of visual stability during page load',
      icon: <Activity className="w-5 h-5" />
    },
    {
      title: 'Page Load Time',
      value: metrics?.loadTime ? performanceUtils.formatValue(metrics.loadTime) : 'N/A',
      status: metrics?.loadTime ? (metrics.loadTime <= 3000 ? 'good' : metrics.loadTime <= 5000 ? 'warning' : 'error') : 'good',
      description: 'Total time to load the complete page',
      icon: <Clock className="w-5 h-5" />
    },
    {
      title: 'Time to First Byte',
      value: metrics?.ttfb ? performanceUtils.formatValue(metrics.ttfb) : 'N/A',
      status: metrics?.ttfb ? (metrics.ttfb <= 200 ? 'good' : metrics.ttfb <= 500 ? 'warning' : 'error') : 'good',
      description: 'Time from request start to receiving first byte',
      icon: <Wifi className="w-5 h-5" />
    }
  ]

  const componentMetrics = getComponentMetrics()
  const sortedComponents = componentMetrics.sort((a, b) => b.avgRenderTime - a.avgRenderTime)

  const avgApiResponseTime = metrics?.apiResponseTime
    ? Object.values(metrics.apiResponseTime).reduce((sum, time) => sum + time, 0) / Object.values(metrics.apiResponseTime).length
    : 0

  const avgClickResponseTime = metrics?.clickResponseTime?.length
    ? metrics.clickResponseTime.reduce((sum, time) => sum + time, 0) / metrics.clickResponseTime.length
    : 0

  const { grade, color } = performanceUtils.getGrade(score)

  if (!isMonitoring) {
    return (
      <div className="p-6 text-center">
        <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Performance Monitoring Unavailable</h2>
        <p className="text-gray-600">Performance monitoring is not available in this environment.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time application performance monitoring</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(getStatusFromScore(score))}`}>
            Grade: {grade}
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>

          <button
            onClick={refreshMetrics}
            disabled={isRefreshing}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Performance Score</h2>
            <p className="text-gray-600">Based on Web Vitals and custom metrics</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${color}`}>{score}</div>
            <div className="text-sm text-gray-500">/ 100</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
              Performance Alerts ({alerts.length})
            </h2>
            <button
              onClick={clearAlerts}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {alerts.slice(-5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded border-l-4 ${
                  alert.type === 'error' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-medium ${
                      alert.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {alert.message}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    alert.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.type.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {performanceCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded ${getStatusColor(card.status).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                {card.icon}
              </div>
              {card.trend && (
                <div className={`flex items-center text-sm ${
                  card.trend === 'up' ? 'text-red-600' : card.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {card.trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                   card.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
                </div>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
            <div className="text-2xl font-bold text-gray-900">
              {card.value}{card.unit && <span className="text-lg text-gray-500">{card.unit}</span>}
            </div>
            <p className="text-sm text-gray-600 mt-2">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Performance</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Average Response Time</span>
              <span className={`font-semibold ${
                avgApiResponseTime <= 500 ? 'text-green-600' :
                avgApiResponseTime <= 1000 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {avgApiResponseTime > 0 ? performanceUtils.formatValue(avgApiResponseTime) : 'N/A'}
              </span>
            </div>

            {metrics?.apiResponseTime && Object.entries(metrics.apiResponseTime).slice(0, 5).map(([endpoint, time]) => (
              <div key={endpoint} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate mr-2">{endpoint}</span>
                <span className={`text-sm font-medium ${
                  time <= 500 ? 'text-green-600' : time <= 1000 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {performanceUtils.formatValue(time)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cache Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cache Performance</h2>

          <div className="space-y-4">
            {Object.entries(cacheStats).map(([cacheType, stats]) => (
              <div key={cacheType} className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{cacheType} Cache</span>
                  <span className="text-sm text-gray-600">
                    {stats.size}/{stats.maxSize}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-green-600">{stats.hits}</div>
                    <div className="text-gray-500">Hits</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-red-600">{stats.misses}</div>
                    <div className="text-gray-500">Misses</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-blue-600">
                      {(stats.hitRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-gray-500">Hit Rate</div>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${(stats.size / stats.maxSize) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Component Performance - Only show if there are components and details are shown */}
      {showDetails && componentMetrics.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Component Performance</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium">Component</th>
                  <th className="text-center py-2 font-medium">Renders</th>
                  <th className="text-center py-2 font-medium">Avg Time</th>
                  <th className="text-center py-2 font-medium">Max Time</th>
                  <th className="text-center py-2 font-medium">Min Time</th>
                  <th className="text-center py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedComponents.slice(0, 10).map((component, index) => (
                  <tr key={component.name} className="border-b border-gray-100">
                    <td className="py-2 font-medium">{component.name}</td>
                    <td className="text-center py-2">{component.renderCount}</td>
                    <td className="text-center py-2">
                      {performanceUtils.formatValue(component.avgRenderTime)}
                    </td>
                    <td className="text-center py-2">
                      {performanceUtils.formatValue(component.maxRenderTime)}
                    </td>
                    <td className="text-center py-2">
                      {performanceUtils.formatValue(component.minRenderTime)}
                    </td>
                    <td className="text-center py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        component.avgRenderTime <= 16 ? 'bg-green-100 text-green-800' :
                        component.avgRenderTime <= 33 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {component.avgRenderTime <= 16 ? 'Good' :
                         component.avgRenderTime <= 33 ? 'Warning' : 'Poor'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Interaction Metrics */}
      {showDetails && (avgClickResponseTime > 0 || (metrics?.scrollPerformance?.length ?? 0) > 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Interaction Performance</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {avgClickResponseTime > 0 && (
              <div className="p-4 bg-gray-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Average Click Response</span>
                  <span className={`font-semibold ${
                    avgClickResponseTime <= 100 ? 'text-green-600' :
                    avgClickResponseTime <= 300 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {performanceUtils.formatValue(avgClickResponseTime)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Based on {metrics?.clickResponseTime?.length || 0} interactions
                </p>
              </div>
            )}

            {(metrics?.scrollPerformance?.length ?? 0) > 0 && (
              <div className="p-4 bg-gray-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Average Scroll Performance</span>
                  <span className="font-semibold text-blue-600">
                    {performanceUtils.formatValue(
                      metrics!.scrollPerformance.reduce((a, b) => a + b, 0) / metrics!.scrollPerformance.length
                    )}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Based on {metrics?.scrollPerformance?.length || 0} scroll events
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Information */}
      {showDetails && (metrics?.memoryUsage || metrics?.networkInfo) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metrics?.memoryUsage && (
              <div>
                <h3 className="font-medium mb-3 flex items-center">
                  <HardDrive className="w-4 h-4 mr-2" />
                  Memory Usage
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Used:</span>
                    <span>{(metrics.memoryUsage.usedJSSize / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{(metrics.memoryUsage.totalJSSize / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Limit:</span>
                    <span>{(metrics.memoryUsage.jsHeapSizeLimit / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                </div>
              </div>
            )}

            {metrics?.networkInfo && (
              <div>
                <h3 className="font-medium mb-3 flex items-center">
                  <Wifi className="w-4 h-4 mr-2" />
                  Network Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Connection:</span>
                    <span className="capitalize">{metrics.networkInfo.effectiveType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Downlink:</span>
                    <span>{metrics.networkInfo.downlink} Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RTT:</span>
                    <span>{metrics.networkInfo.rtt} ms</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}