// ML Components - Sistema de Previsões e Machine Learning

export { PredictionDashboard } from './PredictionDashboard'
export { ModelConfig } from './ModelConfig'
export { AnomalyDetection } from './AnomalyDetection'
export { RecommendationEngine } from './RecommendationEngine'

// ML types and interfaces
export interface PredictionModel {
  id: string
  name: string
  description: string
  type: 'demand_forecast' | 'trend_analysis' | 'anomaly_detection' | 'recommendation'
  status: 'active' | 'training' | 'inactive' | 'error'
  accuracy: number
  confidence: number
  trainingData: number
  lastTrained: string
  nextUpdate: string
  version: string
  author: string
  parameters: Record<string, any>
  performance: {
    precision: number
    recall: number
    f1Score: number
    mse: number
  }
  deploymentDate: string
  usageCount: number
  category: string
}

export interface ModelConfiguration {
  type: 'demand_forecast' | 'trend_analysis' | 'anomaly_detection' | 'recommendation'
  algorithm: 'linear_regression' | 'random_forest' | 'neural_network' | 'time_series' | 'clustering' | 'gradient_boosting' | 'svm' | 'naive_bayes'
  parameters: {
    learningRate?: number
    epochs?: number
    batchSize?: number
    hiddenLayers?: number[]
    dropoutRate?: number
    regularization?: number
    maxDepth?: number
    nEstimators?: number
    minSamplesSplit?: number
    minSamplesLeaf?: number
    featureSelection?: boolean
    crossValidation?: number
    testSize?: number
    randomState?: number
    confidence?: number
  }
  features: string[]
  target: string
  preprocessing: {
    scaling: boolean
    encoding: boolean
    featureEngineering: boolean
    outlierRemoval: boolean
    missingValueHandling: 'drop' | 'mean' | 'median' | 'mode' | 'interpolate'
  }
  validation: {
    method: 'holdout' | 'cross_validation' | 'time_series_split'
    testSize: number
    folds?: number
    shuffle: boolean
  }
  deployment: {
    autoRetrain: boolean
    retrainFrequency: 'daily' | 'weekly' | 'monthly'
    performanceThreshold: number
    rollbackEnabled: boolean
  }
}

export interface Prediction {
  id: string
  modelId: string
  modelName: string
  type: 'demand_forecast' | 'trend_analysis' | 'anomaly_detection' | 'recommendation'
  input: Record<string, any>
  output: any
  confidence: number
  timestamp: string
  executionTime: number
  version: string
  metadata: Record<string, any>
  accuracy?: number
  explanation?: string
}

export interface Anomaly {
  id: string
  type: 'traffic' | 'energy' | 'service' | 'citizen_behavior' | 'infrastructure'
  location: string
  coordinates: { lat: number; lng: number }
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  detectedAt: string
  expectedValue: number
  actualValue: number
  deviation: number
  description: string
  category: string
  affectedUsers: number
  estimatedImpact: string
  status: 'new' | 'investigating' | 'resolved' | 'false_positive'
  assignedTo?: string
  resolution?: string
  resolvedAt?: string
}

export interface Recommendation {
  id: string
  title: string
  description: string
  category: 'efficiency' | 'sustainability' | 'citizen_satisfaction' | 'cost_reduction' | 'service_quality'
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  impact: number
  effort: number
  timeframe: string
  department: string
  affectedCitizens: number
  estimatedSavings: number
  implementationSteps: string[]
  requiredResources: string[]
  metrics: string[]
  relatedData: string[]
  status: 'new' | 'under_review' | 'approved' | 'in_progress' | 'completed' | 'rejected'
  createdAt: string
  aiReasoning: string
}

export interface MLMetrics {
  totalModels: number
  activeModels: number
  totalPredictions: number
  avgAccuracy: number
  totalAnomalies: number
  implementedRecommendations: number
  computeUsage: number
  modelPerformance: Record<string, number>
}

export interface TrainingJob {
  id: string
  modelId: string
  modelName: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  startTime: string
  endTime?: string
  duration?: number
  datasetSize: number
  parameters: Record<string, any>
  metrics?: {
    accuracy: number
    precision: number
    recall: number
    f1Score: number
    loss: number
  }
  logs: string[]
  error?: string
  createdBy: string
  computeResources: {
    cpu: number
    memory: number
    gpu?: number
  }
}

export interface DataSource {
  id: string
  name: string
  type: 'database' | 'api' | 'file' | 'stream'
  connection: string
  schema: Record<string, string>
  lastSync: string
  status: 'active' | 'error' | 'syncing'
  rowCount: number
  quality: number
}

// Constants
export const MODEL_TYPES = {
  DEMAND_FORECAST: 'demand_forecast',
  TREND_ANALYSIS: 'trend_analysis',
  ANOMALY_DETECTION: 'anomaly_detection',
  RECOMMENDATION: 'recommendation'
} as const

export const MODEL_STATUS = {
  ACTIVE: 'active',
  TRAINING: 'training',
  INACTIVE: 'inactive',
  ERROR: 'error'
} as const

export const ALGORITHMS = {
  LINEAR_REGRESSION: 'linear_regression',
  RANDOM_FOREST: 'random_forest',
  NEURAL_NETWORK: 'neural_network',
  TIME_SERIES: 'time_series',
  CLUSTERING: 'clustering',
  GRADIENT_BOOSTING: 'gradient_boosting',
  SVM: 'svm',
  NAIVE_BAYES: 'naive_bayes'
} as const

export const ANOMALY_SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const

export const RECOMMENDATION_CATEGORIES = {
  EFFICIENCY: 'efficiency',
  SUSTAINABILITY: 'sustainability',
  CITIZEN_SATISFACTION: 'citizen_satisfaction',
  COST_REDUCTION: 'cost_reduction',
  SERVICE_QUALITY: 'service_quality'
} as const

export const RECOMMENDATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const

// Utility functions
export const getModelStatusLabel = (status: string): string => {
  const labels = {
    active: 'Ativo',
    training: 'Treinando',
    inactive: 'Inativo',
    error: 'Erro'
  }
  return labels[status as keyof typeof labels] || status
}

export const getModelTypeLabel = (type: string): string => {
  const labels = {
    demand_forecast: 'Previsão de Demanda',
    trend_analysis: 'Análise de Tendências',
    anomaly_detection: 'Detecção de Anomalias',
    recommendation: 'Sistema de Recomendações'
  }
  return labels[type as keyof typeof labels] || type
}

export const getAlgorithmLabel = (algorithm: string): string => {
  const labels = {
    linear_regression: 'Regressão Linear',
    random_forest: 'Random Forest',
    neural_network: 'Rede Neural',
    time_series: 'Séries Temporais',
    clustering: 'Agrupamento',
    gradient_boosting: 'Gradient Boosting',
    svm: 'Support Vector Machine',
    naive_bayes: 'Naive Bayes'
  }
  return labels[algorithm as keyof typeof labels] || algorithm
}

export const getSeverityColor = (severity: string): string => {
  const colors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  }
  return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export const getPriorityColor = (priority: string): string => {
  const colors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  }
  return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export const getCategoryColor = (category: string): string => {
  const colors = {
    efficiency: 'bg-blue-100 text-blue-800',
    sustainability: 'bg-green-100 text-green-800',
    citizen_satisfaction: 'bg-purple-100 text-purple-800',
    cost_reduction: 'bg-orange-100 text-orange-800',
    service_quality: 'bg-indigo-100 text-indigo-800'
  }
  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export const getModelStatusColor = (status: string): string => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    training: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export const formatAccuracy = (accuracy: number): string => {
  return `${(accuracy * 100).toFixed(1)}%`
}

export const formatConfidence = (confidence: number): string => {
  return `${(confidence * 100).toFixed(0)}%`
}

export const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `R$ ${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `R$ ${(amount / 1000).toFixed(1)}K`
  }
  return `R$ ${amount.toFixed(2)}`
}

export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export const calculateModelHealth = (model: PredictionModel): number => {
  const accuracyWeight = 0.4
  const confidenceWeight = 0.3
  const uptimeWeight = 0.3

  const uptime = model.status === 'active' ? 1 : 0

  return (
    model.accuracy * accuracyWeight +
    model.confidence * confidenceWeight +
    uptime * uptimeWeight
  )
}

export const getPredictionTrend = (predictions: Prediction[]): 'up' | 'down' | 'stable' => {
  if (predictions.length < 2) return 'stable'

  const recent = predictions.slice(-5)
  const older = predictions.slice(-10, -5)

  if (recent.length === 0 || older.length === 0) return 'stable'

  const recentAvg = recent.reduce((sum, p) => sum + p.confidence, 0) / recent.length
  const olderAvg = older.reduce((sum, p) => sum + p.confidence, 0) / older.length

  const threshold = 0.05

  if (recentAvg > olderAvg + threshold) return 'up'
  if (recentAvg < olderAvg - threshold) return 'down'
  return 'stable'
}