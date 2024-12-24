'use client'
import { ChevronDown, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { Grid } from 'react-spreadsheet-grid'
import * as XLSX from 'xlsx'
import { Header } from '../components/Header'
import { Spinner } from '../components/Spinner'

const formatCellValue = (value: any): string => {
  if (typeof value === 'number') {
    // Format numbers with up to 2 decimal places, and remove trailing zeros
    return Number(value.toFixed(2)).toString()
  }
  return value?.toString() || ''
}

export default function Home() {
  const [excelData, setExcelData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [view, setView] = useState<'upload' | 'preview' | 'coreMessage' | 'generatingChart' | 'download' | 'error'>('upload')
  const [chartCoreMessage, setChartCoreMessage] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [pptBlob, setPptBlob] = useState<Blob | null>(null)

  const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST

  async function fetchPowerPointSlide(file: File, coreMessage: string) {
    
    setView('generatingChart')
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('chart_core_message', coreMessage)

    const response = await fetch(`${backendHost}/powerpoint`, {
        method: 'POST',
        body: formData,
    })
      
    if (!response.ok) {
      setView('error')
      return
    }
      
    const blob = await response.blob()
    setPptBlob(blob)
    setView('download')
    return blob
  
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setView('preview')
      setUploadedFile(file)
      // Read the Excel file
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      const headers = Object.keys(jsonData[0] || {})
      // Extract headers
      setHeaders(headers)
      setExcelData(jsonData)
    }
  }

  const resetFileUpload = () => {
    setExcelData([])
    setHeaders([])
    setView('upload')
  }

  const handleExampleFile = async () => {
    try {

      const response = await fetch(`${backendHost}/example-excel`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const file = new File([blob], 'example.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      setUploadedFile(file)
      
      // Read the Excel file
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      // Extract headers
      const headers = Object.keys(jsonData[0] || {})
      setHeaders(headers)
      setExcelData(jsonData)
      setView('preview')
    } catch (error) {
      console.error('Error fetching example file:', error)
      alert('Error loading example file')
    }
  }

  const renderUploadView = () => {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <h1 className="text-4xl font-bold sm:text-5xl bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Turn your excel data into powerpoint slides
            </h1>
            <div className="space-y-4">
              <div className="w-full">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="sr-only"
                  id="excel-upload"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="excel-upload"
                  className="relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-white rounded-xl cursor-pointer bg-green-500 hover:bg-green-600 transition-colors duration-300"
                >
                  <FileSpreadsheet className="w-16 h-16 text-white mb-6" />
                  <div className="bg-white text-gray-900 font-medium px-6 py-3 rounded-lg flex items-center">
                    CHOOSE FILE
                    <ChevronDown className="ml-2 w-4 h-4" />
                  </div>
                </label>
              </div>
              <button 
                onClick={handleExampleFile} 
                className="w-full flex items-center justify-center px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300"
              >
                <FileSpreadsheet className="w-6 h-6 mr-2" />
                <span className="text-base font-medium">Use example</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const renderCoreMessageView = () => {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 p-4 overflow-hidden">
        <div className="bg-white rounded-lg shadow h-full flex flex-col p-4 max-w-[800px] mx-auto">
            <h2 className="text-2xl font-semibold mb-6">What should be the core message of your chart?</h2>
            <div className="space-y-4">
              <textarea
                value={chartCoreMessage}
                onChange={(e) => setChartCoreMessage(e.target.value)}
                className="w-full p-3 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Example: Sales increased by 20% over the past 6 months"
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => setView('preview')}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                >
                  Back
                </button>
                <button
                  onClick={async () => {
                    if (!uploadedFile) {
                      alert('No file uploaded')
                      return
                    }
                    try {
                      await fetchPowerPointSlide(uploadedFile, chartCoreMessage)
                    } catch {
                      setView('error')
                      return
                    }
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300"
                >
                  Generate chart
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const renderPreviewView = () => {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 p-4 overflow-hidden">
            <div className="bg-white rounded-lg shadow h-full flex flex-col p-4">
              <h2 className="text-2xl font-semibold mb-2">Does your data look ok?</h2>
              <p className="text-gray-600 mb-4">Please make sure the <span className="font-bold">first row contains the table headers</span> - empty cells here can cause errors.</p>
              
              <div className="border rounded-lg flex-1 overflow-hidden">
                {excelData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Spinner />
                    <p className="mt-4 text-gray-600">Loading data...</p>
                  </div>
                ) : (
                  <div className="h-full overflow-auto">
                    <Grid
                      rows={excelData}
                      columns={headers.map(header => ({
                        title: header,
                        value: (row: any) => formatCellValue(row[header]),
                        id: header
                      }))}
                      getRowKey={(row: any) => row.id || excelData.indexOf(row)}
                      isColumnsResizable={false}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-4">
                <button 
                  onClick={() => resetFileUpload()}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                >
                  Upload different file
                </button>
                <button
                  onClick={() => setView('coreMessage')}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300"
                >
                  Generate chart from this data
                </button>
              </div>
            </div>
        </main>
      </div>
    )
  }

  const renderDownloadView = () => {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow h-full flex flex-col p-4 max-w-[800px] mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Your PowerPoint presentation is ready!</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Your presentation has been generated successfully. Click the button below to download it.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setView('coreMessage')}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (pptBlob && window !== undefined) {
                      const url = window.URL.createObjectURL(pptBlob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'presentation.pptx'
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    }
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300 flex items-center gap-2"
                >
                  Download PowerPoint
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const renderErrorView = () => {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow h-full flex flex-col p-4 max-w-[800px] mx-auto">
            <h2 className="text-2xl font-semibold mb-6">We are sorry! An error occurred.</h2>
            <p className="text-gray-600 mb-4">Please try again with different data. Meanwhile we are already working on fixing this issue.</p>
            <div className="flex gap-4 mt-4">
            <button 
                  onClick={() => setView('coreMessage')}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                >
                  Back
                </button>
              <button 
                onClick={() => resetFileUpload()}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-300"
              >
                  Upload different file
                </button>
              </div>
            </div>
        </main>
      </div>
    )
  }

  const renderGeneratingChartView = () => {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow h-full flex flex-col justify-center items-center p-4 max-w-[800px] min-h-[400px] min-w-[400px] mx-auto">
            <Spinner />
            <p className="mt-4 text-gray-600">Generating chart...</p>
          </div>
        </main>
      </div>
    )
  }

  return view === 'upload' 
    ? renderUploadView() 
    : view === 'preview' 
    ? renderPreviewView() 
    : view === 'coreMessage' 
    ? renderCoreMessageView()
    : view === 'download'
    ? renderDownloadView()
    : view === 'error'
    ? renderErrorView()
    : view === 'generatingChart'
    ? renderGeneratingChartView()
    : renderErrorView()
}



