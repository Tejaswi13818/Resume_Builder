import React, { useState, useEffect } from 'react'
import { FileText, Upload, Download, RefreshCw, CheckCircle, XCircle, AlertCircle, Zap, Code, Sparkles } from 'lucide-react'

type SchemaField = {
  id: string
  label: string
  default: string
}

type UploadResponse = { schema: SchemaField[] }

type GeneratePayload = {
  template: string
  values: Record<string, string>
}

type ApiError = {
  error: string
  details?: string
  troubleshooting?: string[]
  technical?: {
    name: string
    code: string
  }
}

function App() {
  const [step, setStep] = useState<'upload' | 'fill' | 'done'>('upload')
  const [uploadMode, setUploadMode] = useState<'latex' | 'pdf'>('latex')
  const [template, setTemplate] = useState<string>('')
  const [originalHtml, setOriginalHtml] = useState<string>('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [schema, setSchema] = useState<SchemaField[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [troubleshooting, setTroubleshooting] = useState<string[]>([])
  const [formValues, setFormValues] = useState<Record<string, string>>({})

  // Check backend connectivity on mount
  useEffect(() => {
    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        setBackendStatus('online')
      } else {
        setBackendStatus('offline')
      }
    } catch (error) {
      setBackendStatus('offline')
    }
  }

  const testGeminiConnection = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://localhost:3001/test-gemini')
      const data = await response.json()
      
      if (data.success) {
        alert('✅ Gemini API connection successful!')
      } else {
        setError(`Gemini API test failed: ${data.error}`)
        setTroubleshooting(data.troubleshooting || [])
      }
    } catch (err: any) {
      setError(`Connection test failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const onUploadPdf = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setTroubleshooting([])
    setLoading(true)

    if (!pdfFile) {
      setError('Please select a PDF file')
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('pdf', pdfFile)
      formData.append('page', '0')

      const resp = await fetch('http://localhost:3001/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!resp.ok) {
        const errorData = await resp.json() as ApiError
        setTroubleshooting(errorData.troubleshooting || [])
        throw new Error(errorData.error || resp.statusText)
      }

      const data = await resp.json() as UploadResponse & { originalHtml?: string }
      setSchema(data.schema)
      if (data.originalHtml) {
        setOriginalHtml(data.originalHtml)
      }

      const initialValues: Record<string, string> = {}
      data.schema.forEach((f) => {
        initialValues[f.id] = f.default
      })
      setFormValues(initialValues)

      setStep('fill')
    } catch (err: any) {
      setError(err.message || 'PDF upload failed')
    } finally {
      setLoading(false)
    }
  }

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setTroubleshooting([])
    setLoading(true)
    
    try {
      const resp = await fetch('http://localhost:3001/upload-tex', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: template,
      })
      
      if (!resp.ok) {
        const errorData = await resp.json() as ApiError
        setTroubleshooting(errorData.troubleshooting || [])
        throw new Error(errorData.error || resp.statusText)
      }
      
      const data = (await resp.json()) as UploadResponse
      setSchema(data.schema)
      
      // Initialize form values with defaults
      const defaults: Record<string,string> = {}
      data.schema.forEach(f => { defaults[f.id] = f.default })
      setFormValues(defaults)
      setStep('fill')
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(`Failed to parse template: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const onGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setTroubleshooting([])
    setLoading(true)
    
    try {
      // Use different endpoint based on upload mode
      const endpoint = uploadMode === 'pdf' ? '/generate-pdf-from-html' : '/generate-pdf'
      const payload = uploadMode === 'pdf' 
        ? { html: originalHtml, values: formValues }
        : { template, values: formValues } as GeneratePayload
      
      const resp = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!resp.ok) {
        const errorData = await resp.json() as ApiError
        setTroubleshooting(errorData.troubleshooting || [])
        throw new Error(errorData.error || resp.statusText)
      }
      
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'resume.pdf'
      a.click()
      URL.revokeObjectURL(url)
      setStep('done')
    } catch (err: any) {
      console.error('Generation error:', err)
      setError(`Failed to generate PDF: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const resetApp = () => {
    setStep('upload')
    setTemplate('')
    setSchema([])
    setError(null)
    setTroubleshooting([])
    setFormValues({})
  }

  const handleInputChange = (fieldId: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const StatusIndicator = () => {
    const statusConfig = {
      checking: { color: 'bg-amber-500', text: 'Checking connection...', icon: RefreshCw },
      online: { color: 'bg-emerald-500', text: 'Backend Online', icon: CheckCircle },
      offline: { color: 'bg-red-500', text: 'Backend Offline', icon: XCircle }
    }
    
    const config = statusConfig[backendStatus]
    const IconComponent = config.icon
    
    return (
      <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
        backendStatus === 'online' 
          ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
          : backendStatus === 'offline'
          ? 'bg-red-50 border-red-200 shadow-sm'
          : 'bg-amber-50 border-amber-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${config.color} animate-pulse`} />
          <IconComponent className={`w-4 h-4 ${
            backendStatus === 'online' ? 'text-emerald-600' : 
            backendStatus === 'offline' ? 'text-red-600' : 'text-amber-600'
          }`} />
          <span className={`font-medium text-sm ${
            backendStatus === 'online' ? 'text-emerald-700' : 
            backendStatus === 'offline' ? 'text-red-700' : 'text-amber-700'
          }`}>
            {config.text}
          </span>
        </div>
        
        {backendStatus === 'online' && (
          <button 
            onClick={testGeminiConnection}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Zap className="w-4 h-4" />
            {loading ? 'Testing...' : 'Test Gemini AI'}
          </button>
        )}
      </div>
    )
  }

  const StepIndicator = () => {
    const steps = [
      { id: 'upload', label: 'Upload Template', icon: Upload },
      { id: 'fill', label: 'Fill Details', icon: FileText },
      { id: 'done', label: 'Download PDF', icon: Download }
    ]
    
    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((stepItem, index) => {
          const isActive = stepItem.id === step
          const isCompleted = steps.findIndex(s => s.id === step) > index
          const IconComponent = stepItem.icon
          
          return (
            <React.Fragment key={stepItem.id}>
              <div className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive ? 'bg-blue-100 text-blue-700' : 
                isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <IconComponent className="w-4 h-4" />
                <span className="font-medium text-sm">{stepItem.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 transition-all duration-300 ${
                  isCompleted ? 'bg-emerald-300' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
              <Code className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              AI Resume Builder
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Transform LaTeX templates or PDF resumes with 
            <span className="font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mx-1">
              Chandra OCR + Gemini AI
            </span>
            - intelligent parsing, seamless generation.
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Status Card */}
        <div className="mb-8">
          <StatusIndicator />
        </div>

        {/* Main Content Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Resume</h2>
                <p className="text-gray-600">Choose LaTeX code or PDF file - AI will extract fields automatically</p>
              </div>

              {/* Mode Selection Tabs */}
              <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setUploadMode('latex')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    uploadMode === 'latex'
                      ? 'bg-white text-purple-700 shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  LaTeX Code
                </button>
                <button
                  onClick={() => setUploadMode('pdf')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    uploadMode === 'pdf'
                      ? 'bg-white text-purple-700 shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  PDF Resume
                </button>
              </div>
              
              {uploadMode === 'latex' ? (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">LaTeX Template Code</span>
                    <div className="relative">
                      <textarea
                        value={template}
                        onChange={e => setTemplate(e.target.value)}
                        rows={12}
                        className="w-full p-4 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none bg-gray-50 hover:bg-white"
                        placeholder="Paste your LaTeX template here...

Example:
\documentclass{article}
\begin{document}
\title{{{TITLE}}}
\author{{{AUTHOR_NAME}}}
\maketitle
..."
                        disabled={loading || backendStatus !== 'online'}
                      />
                      <div className="absolute top-3 right-3">
                        <div className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs font-mono">
                          .tex
                        </div>
                      </div>
                    </div>
                  </label>
                  
                  <button 
                    onClick={onUpload}
                    disabled={loading || !template.trim() || backendStatus !== 'online'}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Parsing Template...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Parse Template with AI
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">PDF Resume File</span>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setPdfFile(file)
                          }
                        }}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        disabled={loading || backendStatus !== 'online'}
                      />
                      {pdfFile && (
                        <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Selected: {pdfFile.name} ({(pdfFile.size / 1024).toFixed(2)} KB)
                        </div>
                      )}
                    </div>
                  </label>
                  
                  <button 
                    onClick={onUploadPdf}
                    disabled={loading || !pdfFile || backendStatus !== 'online'}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Processing PDF with OCR...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Extract Fields from PDF
                      </>
                    )}
                  </button>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-2 items-start">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Using Chandra OCR</p>
                        <p>Your PDF will be processed using Chandra OCR to extract text and structure. The AI will then identify all fillable fields in your resume.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'fill' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Fill Your Details</h2>
                  <p className="text-gray-600">Complete the form fields extracted from your template</p>
                </div>
                <button 
                  onClick={resetApp}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Start Over
                </button>
              </div>
              
              <div className="grid gap-6">
                {schema.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {field.label}
                    </label>
                    <input
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      disabled={loading}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  </div>
                ))}
              </div>
              
              <button 
                onClick={onGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Generate Professional PDF
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Success! 🎉</h2>
                <p className="text-xl text-gray-600 mb-2">Your professional resume is ready!</p>
                <p className="text-gray-500">Check your downloads folder for the generated PDF.</p>
              </div>
              
              <button 
                onClick={resetApp}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <FileText className="w-5 h-5" />
                Create Another Resume
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-2">Something went wrong</h3>
                <p className="text-red-700 mb-4">{error}</p>
                
                {troubleshooting.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">Troubleshooting Tips:</h4>
                    <ul className="space-y-1">
                      {troubleshooting.map((tip, index) => (
                        <li key={index} className="text-red-700 text-sm flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0 mt-2" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Backend Offline Notice */}
        {backendStatus === 'offline' && (
          <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-2">Backend Server Offline</h3>
                <p className="text-red-700 mb-2">Make sure your backend server is running on port 3001</p>
                <code className="text-sm bg-red-100 px-2 py-1 rounded font-mono text-red-800">
                  cd backend && node server.js
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App