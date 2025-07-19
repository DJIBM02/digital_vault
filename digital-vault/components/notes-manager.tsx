"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Plus, FileText, Edit, Trash2, Eye, Clock } from "lucide-react"
import CryptoJS from "crypto-js"

interface Note {
  id: string
  title: string
  content: string
  isDestructible: boolean
  hasBeenViewed: boolean
  createdAt: string
}

export default function NotesManager() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isDestructible: false,
  })

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = () => {
    const user = localStorage.getItem("vault_user")
    const masterKey = localStorage.getItem("vault_master_key")
    if (!user || !masterKey) return

    const encryptedData = localStorage.getItem(`vault_data_${user}`)
    if (encryptedData) {
      try {
        const decryptedData = JSON.parse(encryptedData)
        const decryptedNotes = decryptedData.notes.map((n: any) => ({
          ...n,
          content: CryptoJS.AES.decrypt(n.content, masterKey).toString(CryptoJS.enc.Utf8),
        }))
        setNotes(decryptedNotes)
      } catch (error) {
        console.error("Erreur lors du déchiffrement:", error)
      }
    }
  }

  const saveNotes = (updatedNotes: Note[]) => {
    const user = localStorage.getItem("vault_user")
    const masterKey = localStorage.getItem("vault_master_key")
    if (!user || !masterKey) return

    const encryptedNotes = updatedNotes.map((n) => ({
      ...n,
      content: CryptoJS.AES.encrypt(n.content, masterKey).toString(),
    }))

    const userData = JSON.parse(
      localStorage.getItem(`vault_data_${user}`) || '{"passwords":[],"notes":[],"documents":[]}',
    )
    userData.notes = encryptedNotes
    localStorage.setItem(`vault_data_${user}`, JSON.stringify(userData))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingNote) {
      const updatedNotes = notes.map((n) =>
        n.id === editingNote.id ? { ...formData, id: n.id, createdAt: n.createdAt, hasBeenViewed: n.hasBeenViewed } : n,
      )
      setNotes(updatedNotes)
      saveNotes(updatedNotes)
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        ...formData,
        hasBeenViewed: false,
        createdAt: new Date().toISOString(),
      }
      const updatedNotes = [...notes, newNote]
      setNotes(updatedNotes)
      saveNotes(updatedNotes)
    }

    setFormData({ title: "", content: "", isDestructible: false })
    setEditingNote(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (note: Note) => {
    setFormData({
      title: note.title,
      content: note.content,
      isDestructible: note.isDestructible,
    })
    setEditingNote(note)
    setIsDialogOpen(true)
  }

  const handleView = (note: Note) => {
    setViewingNote(note)
    setIsViewDialogOpen(true)

    if (note.isDestructible && !note.hasBeenViewed) {
      // Marquer comme vue et supprimer après fermeture
      const updatedNotes = notes.map((n) => (n.id === note.id ? { ...n, hasBeenViewed: true } : n))
      setNotes(updatedNotes)
      saveNotes(updatedNotes)
    }
  }

  const handleViewDialogClose = () => {
    setIsViewDialogOpen(false)

    if (viewingNote?.isDestructible && viewingNote.hasBeenViewed) {
      // Supprimer la note auto-destructrice après visualisation
      setTimeout(() => {
        const updatedNotes = notes.filter((n) => n.id !== viewingNote.id)
        setNotes(updatedNotes)
        saveNotes(updatedNotes)
      }, 500)
    }

    setViewingNote(null)
  }

  const handleDelete = (id: string) => {
    const updatedNotes = notes.filter((n) => n.id !== id)
    setNotes(updatedNotes)
    saveNotes(updatedNotes)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Notes privées</h3>
          <p className="text-sm text-gray-600">{notes.length} note(s) stockée(s)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({ title: "", content: "", isDestructible: false })
                setEditingNote(null)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Modifier la note" : "Nouvelle note"}</DialogTitle>
              <DialogDescription>Créez une note privée chiffrée</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de la note"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Contenu</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Contenu de votre note privée..."
                  rows={6}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="destructible"
                  checked={formData.isDestructible}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDestructible: checked })}
                />
                <Label htmlFor="destructible" className="text-sm">
                  Note auto-destructrice (supprimée après lecture)
                </Label>
              </div>
              <Button type="submit" className="w-full">
                {editingNote ? "Mettre à jour" : "Créer la note"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog de visualisation */}
      <Dialog open={isViewDialogOpen} onOpenChange={handleViewDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {viewingNote?.title}
              {viewingNote?.isDestructible && (
                <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full">
                  Auto-destructrice
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm dark:text-gray-200">{viewingNote?.content}</pre>
            </div>
            {viewingNote?.isDestructible && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  ⚠️ Cette note sera automatiquement supprimée après fermeture
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {notes.map((note) => (
          <Card key={note.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center">
                      {note.title}
                      {note.isDestructible && (
                        <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Auto-destructrice
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>Créée le {new Date(note.createdAt).toLocaleDateString("fr-FR")}</CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleView(note)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {!note.isDestructible && (
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(note)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(note.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 line-clamp-2">{note.content.substring(0, 100)}...</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {notes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucune note</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Créez votre première note privée chiffrée</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle note
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
