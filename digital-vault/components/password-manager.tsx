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
import { Plus, Eye, EyeOff, Copy, Edit, Trash2, Globe, Key } from "lucide-react"
import CryptoJS from "crypto-js"

interface Password {
  id: string
  title: string
  username: string
  password: string
  website: string
  notes: string
  createdAt: string
}

export default function PasswordManager() {
  const [passwords, setPasswords] = useState<Password[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPassword, setEditingPassword] = useState<Password | null>(null)
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})
  const [formData, setFormData] = useState({
    title: "",
    username: "",
    password: "",
    website: "",
    notes: "",
  })

  useEffect(() => {
    loadPasswords()
  }, [])

  const loadPasswords = () => {
    const user = localStorage.getItem("vault_user")
    const masterKey = localStorage.getItem("vault_master_key")
    if (!user || !masterKey) return

    const encryptedData = localStorage.getItem(`vault_data_${user}`)
    if (encryptedData) {
      try {
        const decryptedData = JSON.parse(encryptedData)
        const decryptedPasswords = decryptedData.passwords.map((p: any) => ({
          ...p,
          password: CryptoJS.AES.decrypt(p.password, masterKey).toString(CryptoJS.enc.Utf8),
        }))
        setPasswords(decryptedPasswords)
      } catch (error) {
        console.error("Erreur lors du déchiffrement:", error)
      }
    }
  }

  const savePasswords = (updatedPasswords: Password[]) => {
    const user = localStorage.getItem("vault_user")
    const masterKey = localStorage.getItem("vault_master_key")
    if (!user || !masterKey) return

    const encryptedPasswords = updatedPasswords.map((p) => ({
      ...p,
      password: CryptoJS.AES.encrypt(p.password, masterKey).toString(),
    }))

    const userData = JSON.parse(
      localStorage.getItem(`vault_data_${user}`) || '{"passwords":[],"notes":[],"documents":[]}',
    )
    userData.passwords = encryptedPasswords
    localStorage.setItem(`vault_data_${user}`, JSON.stringify(userData))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingPassword) {
      const updatedPasswords = passwords.map((p) =>
        p.id === editingPassword.id ? { ...formData, id: p.id, createdAt: p.createdAt } : p,
      )
      setPasswords(updatedPasswords)
      savePasswords(updatedPasswords)
    } else {
      const newPassword: Password = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
      }
      const updatedPasswords = [...passwords, newPassword]
      setPasswords(updatedPasswords)
      savePasswords(updatedPasswords)
    }

    setFormData({ title: "", username: "", password: "", website: "", notes: "" })
    setEditingPassword(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (password: Password) => {
    setFormData({
      title: password.title,
      username: password.username,
      password: password.password,
      website: password.website,
      notes: password.notes,
    })
    setEditingPassword(password)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    const updatedPasswords = passwords.filter((p) => p.id !== id)
    setPasswords(updatedPasswords)
    savePasswords(updatedPasswords)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestionnaire de mots de passe</h3>
          <p className="text-sm text-gray-600">{passwords.length} mot(s) de passe stocké(s)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({ title: "", username: "", password: "", website: "", notes: "" })
                setEditingPassword(null)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un mot de passe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPassword ? "Modifier le mot de passe" : "Nouveau mot de passe"}</DialogTitle>
              <DialogDescription>Ajoutez vos informations de connexion de manière sécurisée</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Gmail, Facebook..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur/Email</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="votre@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mot de passe sécurisé"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes supplémentaires..."
                />
              </div>
              <Button type="submit" className="w-full">
                {editingPassword ? "Mettre à jour" : "Ajouter"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {passwords.map((password) => (
          <Card key={password.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{password.title}</CardTitle>
                    <CardDescription>{password.website}</CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(password)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(password.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Utilisateur:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{password.username}</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(password.username)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Mot de passe:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">
                    {showPasswords[password.id] ? password.password : "••••••••"}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => togglePasswordVisibility(password.id)}>
                    {showPasswords[password.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(password.password)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {password.notes && (
                <div className="pt-2 border-t">
                  <span className="text-sm text-gray-600">Notes: {password.notes}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {passwords.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Key className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun mot de passe</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Commencez par ajouter votre premier mot de passe</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un mot de passe
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
