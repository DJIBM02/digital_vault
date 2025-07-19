"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Key, FileText, Upload, LogOut, Settings, Share, Database } from "lucide-react"
import PasswordManager from "@/components/password-manager"
import NotesManager from "@/components/notes-manager"
import DocumentsManager from "@/components/documents-manager"
import PasswordGenerator from "@/components/password-generator"
import { ThemeToggle } from "@/components/theme-toggle"
import SharingManager from "@/components/sharing-manager"
import DataViewer from "@/components/data-viewer"

export default function Dashboard() {
  const [user, setUser] = useState("")
  const [activeTab, setActiveTab] = useState("passwords")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("vault_token")
    const userEmail = localStorage.getItem("vault_user")

    if (!token || !userEmail) {
      router.push("/")
      return
    }

    setUser(userEmail)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("vault_token")
    localStorage.removeItem("vault_user")
    localStorage.removeItem("vault_master_key")
    router.push("/")
  }

  if (!user) {
    return <div>Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Coffre-Fort Numérique</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">Connecté: {user}</span>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tableau de bord</h2>
          <p className="text-gray-600 dark:text-gray-300">Gérez vos données sensibles en toute sécurité</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="passwords" className="flex items-center">
              <Key className="w-4 h-4 mr-2" />
              Mots de passe
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Notes privées
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Générateur
            </TabsTrigger>
            <TabsTrigger value="sharing" className="flex items-center">
              <Share className="w-4 h-4 mr-2" />
              Partage
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Données
            </TabsTrigger>
          </TabsList>

          <TabsContent value="passwords">
            <PasswordManager />
          </TabsContent>

          <TabsContent value="notes">
            <NotesManager />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsManager />
          </TabsContent>

          <TabsContent value="generator">
            <PasswordGenerator />
          </TabsContent>

          <TabsContent value="sharing">
            <SharingManager />
          </TabsContent>

          <TabsContent value="data">
            <DataViewer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
