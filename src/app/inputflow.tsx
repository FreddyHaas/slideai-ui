'use client'
import { AlertTriangle, Check, ChevronDown, FileSpreadsheet, Loader, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import Header from '../components/header'
import Spreadsheet from '../components/spreadsheet'
import { Progress } from '../components/ui/progress'
import { Textarea } from '../components/ui/textarea'

export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [view, setView] = useState<'upload' | 'preview' | 'coreMessage' | 'generatingChart' | 'download' | 'error'>('upload')
  const [chartCoreMessage, setChartCoreMessage] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [validationIsLoading, setValidationIsLoading] = useState<boolean>(true)
  const [isValid, setIsValid] = useState<boolean>(false)
  const [pptName, setPptName] = useState<string | null>(null)
  const [validationHints, setValidationHints] = useState<string[]>([])
  const [progressValue, setProgressValue] = useState<number>(10)
  const [progressText, setProgressText] = useState<string>('Analyzing data...')

  const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST

  useEffect(() => {
    if (view === 'generatingChart') {
      setProgressValue(10);
      const steps = [20, 40, 60, 80];
      const texts = ['Analyzing data...', 'Selecting chart types...', 'Creating slides...', 'Preparing presentation...']
      let index = 0;

      const interval = setInterval(() => {
        setProgressValue(steps[index]);
        setProgressText(texts[index]);
        index++;

        if (index >= steps.length) {
          clearInterval(interval);
        }
      }, 5000);

      return () => {
        clearInterval(interval);
        setProgressValue(100);
      }
    }
  }, [view])

  useEffect(() => {
    if (data.length === 0) return;

    setValidationIsLoading(true)
    const url = `${backendHost}/validate-data`;

    const fetchData = async (inputData: string) => {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: inputData }),
            });

            if (!response.ok) {
                console.error("Validation request failed:", response.statusText);
                setIsValid(true);
                return;
            }

            const result = await response.json();
            setIsValid(result.is_valid);
            setValidationHints(result.validation_hints);
        } catch (error) {
          console.log("Error validating data:", error);
          setIsValid(true);
        }
    };

    fetchData(JSON.stringify(data));
    setValidationIsLoading(false)

  }, [data]);

  async function fetchPowerPointSlide(file: File | null, data: any[] | undefined, coreMessage: string) {
    
    setView('generatingChart')

    let response
    const url = `${backendHost}/powerpoint`
    const formData = new FormData()
    formData.append('chart_core_message', coreMessage)

    if (file) {
      formData.append('file', file)
      response = await fetch(url, {
          method: 'POST',
          body: formData,
      })    
    } else {
      formData.append('data', JSON.stringify(data))
      response = await fetch(url, {
        method: 'POST',
        body: formData
      })
    }

    if (!response.ok) {
      setView('error')
      return
    }

    const responeBody = await response.json()
    setPptName(responeBody.presentation_name)
    setView('download')
    return
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
      // Extract headers
      setData(jsonData)
    }
  }

  const handlePasteDataIn = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasteContent = event.clipboardData.getData('text/plain');
    if (pasteContent) {
      setView('preview');

      console.log("PasteContent")
      console.log(pasteContent)

      const rows = pasteContent.split('\n');

      const headers = rows[0].split('\t').map(header => header.trim())

      const parsedData = rows.slice(1).map(row => {
        const entries = row.split('\t').map(entry => entry.trim())
        return entries.reduce((acc, entry, index) => {
          acc[headers[index]] = entry;
          return acc;
        }, {} as Record<string, string>);
      });

      console.log("Parsed data")
      console.log(parsedData)

      setData(parsedData);
    }
  };

  const resetFileUpload = () => {
    setUploadedFile(null)
    setData([])
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
      setData(jsonData)
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
          <div className="max-w-xl w-full space-y-6 text-center">
            <h1 className="text-4xl font-bold sm:text-5xl bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Turn your excel data into powerpoint slides
            </h1>
            <div className="space-y-4">
              <div className="w-full flex gap-2">
                <div className='w-1/2'>
                  <Textarea
                    placeholder='PASTE YOUR DATA HERE...'
                    className='rounded-xl h-full placeholder:text-gray-900 placeholder:font-medium resize-none border-green-500 border-4 focus-visible:ring-0 focus-visible:border-green-600'
                    onPaste={handlePasteDataIn}
                  />
                </div>
                <div className='w-1/2'>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="sr-only"
                    id="excel-upload"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="excel-upload"
                    className="relative flex flex-col items-center justify-center p-12 rounded-xl cursor-pointer bg-green-500 hover:bg-green-600 transition-colors duration-300"
                  >
                    <FileSpreadsheet className="w-16 h-16 text-white mb-6" />
                    <div className="bg-white text-gray-900 font-medium px-6 py-3 rounded-lg flex items-center">
                      CHOOSE FILE
                      <ChevronDown className="ml-2 w-4 h-4" />
                    </div>
                  </label>
                </div>
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
                className="w-full p-3 border rounded-lg h-32 resize-none"
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
                    if (!data) {
                      alert('No data input')
                      return
                    }
                    try {
                      await fetchPowerPointSlide(uploadedFile, data, chartCoreMessage)
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
              <div className="mb-4">
                {validationIsLoading ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="animate-spin"/>
                    <span>Validating data...</span>
                  </div>
                ) : isValid ? (
                  <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-700">Your data looks good! You can proceed to generate the chart.</span>
                  </div>
                ) : (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-700">Please check your data for the following issues:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-red-700">
                      {validationHints.map((hint, index) => (
                        <li key={index} className="text-sm">{hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                {data.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Loader className="animate-spin" />
                    <p className="mt-4 text-gray-600">Loading data...</p>
                  </div>
                ) : (
                    <Spreadsheet tableData={data} />
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
              <div className="flex gap-4">
                <button 
                  onClick={() => setView('coreMessage')}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                >
                  Back
                </button>
                <a
                    href={`${backendHost}/powerpoint/${pptName}`}
                    download={`${pptName}.pptx`}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300 flex items-center gap-2"
                  >
                  Download PowerPoint
                </a>
              </div>
              <div className="mt-6 h-[450px] w-full border border-gray-200 rounded-lg overflow-hidden">
                <iframe 
                  src={`${backendHost}/pdf/${pptName}`}
                  className="w-full h-full"
                  title="PowerPoint Preview"
                />
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

  const renderLoadChartView = () => {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow h-full flex flex-col justify-center items-center p-4 max-w-[800px] min-h-[400px] min-w-[400px] mx-auto">
            <Progress value={progressValue}/>
            <div className="flex items-start justify-center mt-4 w-full gap-2">
              <Loader className=" w-8 h-8 animate-spin"/>
              <div className="flex h-8 justify-start items-center w-full">
                <p className="text-gray-600">{progressText}</p>
              </div>
            </div>
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
    ? renderLoadChartView()
    : renderErrorView()
}


