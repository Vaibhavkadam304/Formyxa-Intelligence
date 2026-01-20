"use client"

import { useState, useRef } from "react"
import { OfferLetterCanvas } from "@/components/OfferLetterCanvas"
import { UploadCloud, FileText, Trash2, CheckCircle, FileIcon } from "lucide-react"
import { OfferLetterForm } from "@/components/OfferLetterForm"

/* ================= TYPES ================= */

type DetectedPlaceholder = {
  key: string
  label: string
  paragraphIndex: number
  runStart: number
  runEnd: number
  confidence?: "high" | "medium" | "low"
  enabled?: boolean
}


/* ================= PAGE ================= */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const res = reader.result as string
      resolve(res.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}


export default function UploadOfferLetterPage() {
  const [file, setFile] = useState<File | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [originalHtml, setOriginalHtml] = useState<string>("")

  const [placeholders, setPlaceholders] = useState<DetectedPlaceholder[]>([])
  const [values, setValues] = useState<Record<string, string>>({})

  // UI State for Drag & Drop
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [templateType, setTemplateType] = useState<
    "SMART" | "SEMI_STRUCTURED" | "BLANK_LINE" | "MIXED" | null
  >(null)

  /* ---------- DRAG & DROP HANDLERS ---------- */

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  function handleFileSelect(f: File) {
    setFile(f)
  }
  function isValidDocx(file: File) {
    return (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    )
  }
  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    
    if (droppedFile) {
        // Simple check for docx extension
        if (!isValidDocx(droppedFile)) {
          alert("Please upload a valid .docx file")
          return
        }
        handleFileSelect(droppedFile)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  /* ---------- ANALYZE DOCUMENT ---------- */


  async function handleConvertToTemplate() {
    if (!file) throw new Error("Original DOCX missing")

    const formData = new FormData()
    formData.append("file", file)

    formData.append(
      "placeholders",
      JSON.stringify(
        placeholders
          .filter((p) => p.enabled)
          .map((p) => ({
            key: p.key,
            paragraphIndex: p.paragraphIndex,
            runStart: p.runStart,
            runEnd: p.runEnd,
          }))
      )
    )

    const res = await fetch("/api/convert-to-template", {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      throw new Error("Template conversion failed")
    }

    return await res.blob()
  }



  async function handleUpload() {
    if (!file) return

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/parse-docx", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Failed to parse document")

      const data = await res.json()
      console.log("PARSE RESULT:", data)

      setOriginalHtml(data.html || "")
      setTemplateType(data.templateType || null)
      const mapped: DetectedPlaceholder[] = (data.placeholders || []).map(
        (p: any) => ({
          ...p,
          enabled: p.confidence !== "low",
        })
      )

      const initialValues: Record<string, string> = {}
      mapped.forEach((p) => {
        initialValues[p.key] = ""
      })

      setPlaceholders(mapped)
      setValues(initialValues)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  /* ---------- FINAL GENERATION (ONLY MUTATION POINT) ---------- */

  async function handleGenerateFinal() {
    try {
      // STEP 1 — Convert original DOCX → template.docx
      const templateBlob = await handleConvertToTemplate()

      // STEP 2 — Inject values into template
      const formData = new FormData()
      formData.append("template", templateBlob)
      formData.append("values", JSON.stringify(values))

      const res = await fetch("/api/generate-docx", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error("Failed to generate offer letter")
      }

      const finalBlob = await res.blob()
      const url = URL.createObjectURL(finalBlob)

      const a = document.createElement("a")
      a.href = url
      a.download = "offer-letter.docx"
      a.click()
    } catch (err: any) {
      alert(err.message || "Export failed")
    }
  }


  return (
    <div className="w-full px-6 py-16 space-y-6 bg-gray-50 min-h-screen flex flex-col items-center">
      
      {/* Title only shows when not analyzing to keep UI clean, or keep it always: */}
      <h1 className="text-2xl font-semibold text-gray-800">
        Upload your existing offer letter
      </h1>
      {templateType && (
        <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Detected template type: <strong>{templateType}</strong>
        </div>
      )}

      {/* ================= NEW UPLOAD UI ================= */}
      {(!placeholders.length && !loading) && (
        <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-8 shadow-sm border border-gray-100 mt-8">
          
          <div className="flex flex-col md:flex-row gap-8 min-h-[320px]">
            
            {/* --- LEFT SIDE: UPLOADED FILES LIST --- */}
            <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-gray-100 pr-0 md:pr-8 pb-6 md:pb-0">
              <h3 className="mb-4 text-sm font-bold text-gray-700">Uploaded Files</h3>
              
              <div className="flex-1 space-y-3">
                {/* Empty State for List */}
                {!file && (
                  <div className="flex h-full flex-col items-center justify-center text-xs text-gray-400 italic">
                    <div className="mb-2 rounded-full bg-gray-50 p-3">
                        <FileIcon className="text-gray-300" size={24} />
                    </div>
                    No files selected yet
                  </div>
                )}

                {/* Selected File Item */}
                {file && (
                  <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <FileText size={18} />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="truncate text-sm font-medium text-blue-900">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-blue-400">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (loading) return
                        setFile(null)
                      }}
                      className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-auto pt-4">
                 <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className={`w-full rounded-lg py-3 text-sm font-medium transition-all duration-200 ${
                    !file || loading 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-[0.98]"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                      Analyzing document...
                    </span>
                  ) : "Upload & Analyze"}
                </button>
                {error && <p className="mt-2 text-center text-xs text-red-500">{error}</p>}
              </div>
            </div>


            {/* --- RIGHT SIDE: DROP ZONE --- */}
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative w-full md:w-1/2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 
                ${isDragging 
                  ? "border-blue-500 bg-blue-50 scale-[0.99]" 
                  : "border-gray-200 bg-gray-50/30 hover:bg-gray-50"
                }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  if (!isValidDocx(f)) {
                    alert("Only .docx files are supported")
                    return
                  }
                  handleFileSelect(f)
                }}
              />

              <div className={`flex h-20 w-20 items-center justify-center rounded-full mb-6 transition-colors duration-200 ${isDragging ? "bg-blue-100" : "bg-blue-50"}`}>
                <UploadCloud size={40} className="text-blue-500" />
              </div>

              <p className="mb-2 text-center text-base font-semibold text-gray-700">
                Drag and Drop files to upload
              </p>
              
              <span className="mb-6 text-xs text-gray-400 uppercase tracking-wide font-medium">or</span>

              <button
                onClick={triggerFileInput}
                className="rounded-full bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105 hover:bg-blue-700 active:scale-95 shadow-sm"
              >
                Browse Files
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= WORKSPACE (Post-Upload) ================= */}
      {placeholders.length > 0 && (
        <div className="w-full grid grid-cols-[420px_1fr] gap-8 pl-2">
          <OfferLetterForm
            placeholders={placeholders}
            setPlaceholders={setPlaceholders}
            values={values}
            setValues={setValues}
            onGenerate={handleGenerateFinal}
          />

          <OfferLetterCanvas
            html={originalHtml}
            placeholders={placeholders}
            values={values}
          />
        </div>
      )}

    </div>
  )
}

/* ================= CONFIRM UI ================= */

function ConfirmPlaceholders({
  placeholders,
  setPlaceholders,
  values,
  setValues,
}: {
  placeholders: DetectedPlaceholder[]
  setPlaceholders: (p: DetectedPlaceholder[]) => void
  values: Record<string, string>
  setValues: (v: Record<string, string>) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Confirm detected fields</h2>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{placeholders.length} fields found</span>
      </div>

      <div className="space-y-4">
        {placeholders.map((p, idx) => (
          <div key={idx} className={`rounded-lg border p-3 space-y-2 transition-all duration-200 ${p.enabled ? "bg-white border-gray-200 shadow-sm" : "bg-gray-50 border-gray-100 opacity-75"}`}>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={p.enabled}
                onChange={(e) => {
                  const next = [...placeholders]
                  next[idx].enabled = e.target.checked
                  setPlaceholders(next)
                }}
              />
              <span className="font-semibold text-gray-700">{p.label}</span>

              {p.confidence !== "high" && (
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  Check me
                </span>
              )}
            </label>

            {p.enabled && (
                <div className="pl-6 space-y-3 animate-in slide-in-from-top-1">
                    <div className="text-xs text-gray-500">
                      Anchor: paragraph <b>{p.paragraphIndex}</b>, runs{" "}
                      <b>{p.runStart}</b> – <b>{p.runEnd}</b>
                    </div>

                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                        Value
                        </div>
                        <input
                        placeholder={`Enter ${p.label}...`}
                        value={values[p.key] || ""}
                        onChange={(e) =>
                            setValues({
                            ...values,
                            [p.key]: e.target.value,
                            })
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}