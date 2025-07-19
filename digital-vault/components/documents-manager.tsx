"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Upload, Download, Trash2, File } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Document {
  id: string
  name: string
  type: string
  size: number
  data: string
  createdAt: string
}

export default function DocumentsManager() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = () => {
    const user = localStorage.getItem("vault_user")
    if (!user) return

    const userData = JSON.parse(
      localStorage.getItem(`vault_data_${user}`) || '{"passwords":[],"notes":[],"documents":[]}',
    )
    setDocuments(userData.documents || [])
  }

  const saveDocuments = (updatedDocuments: Document[]) => {
    const user = localStorage.getItem("vault_user")
    if (!user) return

    const userData = JSON.parse(
      localStorage.getItem(`vault_data_${user}`) || '{"passwords":[],"notes":[],"documents":[]}',
    )
    userData.documents = updatedDocuments
    localStorage.setItem(`vault_data_${user}`, JSON.stringify(userData))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        // Increased to 10MB limit
        toast({
          title: "Fichier trop volumineux",
          description: `Le fichier ${file.name} dépasse la limite de 10MB`,
          variant: "destructive",
        })
        return
      }

      // Validate file types
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/zip",
        "application/x-rar-compressed",
      ]

      if (!allowedTypes.includes(file.type) && !file.type.startsWith("image/")) {
        toast({
          title: "Type de fichier non supporté",
          description: `Le type ${file.type} n'est pas autorisé`,
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const newDocument: Document = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target?.result as string,
          createdAt: new Date().toISOString(),
        }

        const updatedDocuments = [...documents, newDocument]
        setDocuments(updatedDocuments)
        saveDocuments(updatedDocuments)

        toast({
          title: "Fichier ajouté",
          description: `${file.name} a été ajouté avec succès`,
        })
      }

      reader.onerror = () => {
        toast({
          title: "Erreur de lecture",
          description: `Impossible de lire le fichier ${file.name}`,
          variant: "destructive",
        })
      }

      reader.readAsDataURL(file)
    })

    setIsDialogOpen(false)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleDownload = (document: Document) => {
    // Créer un lien de téléchargement
    const link = window.document.createElement("a")
    link.href = document.data
    link.download = document.name
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  const handleDelete = (id: string) => {
    const updatedDocuments = documents.filter((d) => d.id !== id)
    setDocuments(updatedDocuments)
    saveDocuments(updatedDocuments)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return "🖼️"
    if (type.includes("pdf")) return "📄"
    if (type.includes("word")) return "📝"
    if (type.includes("excel") || type.includes("spreadsheet")) return "📊"
    return "📁"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Documents sécurisés</h3>
          <p className="text-sm text-gray-600">{documents.length} document(s) stocké(s)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter un document</DialogTitle>
              <DialogDescription>Téléchargez vos documents sensibles (max 5MB par fichier)</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Glissez-déposez vos fichiers ici ou</p>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>Parcourir les fichiers</span>
                  </Button>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
                  />
                </Label>
                <p className="text-xs text-gray-500 mt-2">PDF, DOC, XLS, PPT, Images, TXT, ZIP (max 10MB)</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {documents.map((document) => (
          <Card key={document.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-lg">{getFileIcon(document.type)}</span>
                  </div>
                  <div>
                    <CardTitle className="text-base">{document.name}</CardTitle>
                    <CardDescription>
                      {formatFileSize(document.size)} • {new Date(document.createdAt).toLocaleDateString("fr-FR")}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(document)}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(document.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {document.type.startsWith("image/") && (
              <CardContent>
                <img
                  src={document.data || "/placeholder.svg"}
                  alt={document.name}
                  className="max-w-full h-32 object-cover rounded-lg"
                />
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <File className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun document</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Téléchargez vos premiers documents sécurisés</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un document
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
