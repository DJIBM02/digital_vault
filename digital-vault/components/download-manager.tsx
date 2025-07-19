"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Download, CheckCircle, XCircle, FileText, Loader2 } from "lucide-react"

interface DownloadItem {
  id: string
  filename: string
  fileType: string
  size: number
  progress: number
  status: "pending" | "downloading" | "completed" | "error"
  startTime?: Date
}

interface DownloadManagerProps {
  data: string
  filename: string
  fileType: string
  size: number
  onDownloadComplete?: () => void
}

export default function DownloadManager({ data, filename, fileType, size, onDownloadComplete }: DownloadManagerProps) {
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "completed" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileTypeColor = (type: string) => {
    if (type?.includes("pdf")) return "text-red-500"
    if (type?.includes("word")) return "text-blue-500"
    if (type?.includes("excel")) return "text-green-500"
    if (type?.includes("powerpoint")) return "text-orange-500"
    if (type?.startsWith("image/")) return "text-purple-500"
    return "text-gray-500"
  }

  const simulateDownloadProgress = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 100)
    return interval
  }

  const downloadFile = async () => {
    try {
      setDownloadStatus("downloading")
      const progressInterval = simulateDownloadProgress()

      // Convert data URL to blob for better handling
      const response = await fetch(data)
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement("a")
      link.href = url
      link.download = filename

      // Trigger download
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)

      // Cleanup
      window.URL.revokeObjectURL(url)
      clearInterval(progressInterval)

      setProgress(100)
      setDownloadStatus("completed")

      toast({
        title: "Téléchargement réussi",
        description: `${filename} a été téléchargé avec succès`,
      })

      onDownloadComplete?.()
    } catch (error) {
      setDownloadStatus("error")
      setProgress(0)

      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = () => {
    switch (downloadStatus) {
      case "downloading":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Download className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (downloadStatus) {
      case "downloading":
        return "Téléchargement en cours..."
      case "completed":
        return "Téléchargement terminé"
      case "error":
        return "Erreur de téléchargement"
      default:
        return "Prêt à télécharger"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <FileText className={`w-8 h-8 ${getFileTypeColor(fileType)}`} />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{filename}</CardTitle>
            <CardDescription className="flex items-center space-x-2">
              <span>{formatFileSize(size)}</span>
              <Badge variant="outline" className="text-xs">
                {fileType?.split("/")[1]?.toUpperCase() || "FILE"}
              </Badge>
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">{getStatusIcon()}</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {downloadStatus === "downloading" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Progression</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">Statut :</span>
          <span
            className={`font-medium ${
              downloadStatus === "completed"
                ? "text-green-600"
                : downloadStatus === "error"
                  ? "text-red-600"
                  : downloadStatus === "downloading"
                    ? "text-blue-600"
                    : "text-gray-600"
            }`}
          >
            {getStatusText()}
          </span>
        </div>

        {/* Download Button */}
        <Button
          onClick={downloadFile}
          disabled={downloadStatus === "downloading"}
          className="w-full"
          variant={downloadStatus === "completed" ? "outline" : "default"}
        >
          {downloadStatus === "downloading" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Téléchargement...
            </>
          ) : downloadStatus === "completed" ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Télécharger à nouveau
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Télécharger le fichier
            </>
          )}
        </Button>

        {/* Security Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full mt-0.5 flex-shrink-0"></div>
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-semibold">Téléchargement sécurisé</p>
              <p>Le fichier est téléchargé directement depuis le stockage chiffré local</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
