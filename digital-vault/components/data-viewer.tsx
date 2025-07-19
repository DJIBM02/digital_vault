"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Copy, Database, Key, Users } from "lucide-react"
import CryptoJS from "crypto-js"

export default function DataViewer() {
  const [showRawData, setShowRawData] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [authData, setAuthData] = useState<any>(null)
  const [sharedData, setSharedData] = useState<any>(null)
  const [masterKey, setMasterKey] = useState("")

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = () => {
    const user = localStorage.getItem("vault_user")
    const key = localStorage.getItem("vault_master_key")

    if (user && key) {
      setMasterKey(key)

      // Données utilisateur chiffrées
      const rawUserData = localStorage.getItem(`vault_data_${user}`)
      if (rawUserData) {
        setUserData(JSON.parse(rawUserData))
      }

      // Données d'authentification
      const users = localStorage.getItem("vault_users")
      if (users) {
        setAuthData(JSON.parse(users))
      }

      // Données partagées
      const shared = localStorage.getItem(`vault_shared_${user}`)
      if (shared) {
        setSharedData(JSON.parse(shared))
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatJSON = (data: any) => {
    return JSON.stringify(data, null, 2)
  }

  const decryptData = (encryptedData: string, key: string) => {
    try {
      return CryptoJS.AES.decrypt(encryptedData, key).toString(CryptoJS.enc.Utf8)
    } catch (error) {
      return "Erreur de déchiffrement"
    }
  }

  const getDataSize = (data: any) => {
    const jsonString = JSON.stringify(data)
    const bytes = new Blob([jsonString]).size
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(2)} KB`
  }

  const getEncryptionInfo = () => {
    return {
      algorithm: "AES-256",
      mode: "CBC",
      keyDerivation: "SHA-256(password + email)",
      storage: "LocalStorage (navigateur)",
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Visualiseur de données chiffrées</h3>
          <p className="text-sm text-gray-600">Explorez comment vos données sont stockées et chiffrées</p>
        </div>
        <Button variant="outline" onClick={() => setShowRawData(!showRawData)}>
          {showRawData ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showRawData ? "Masquer" : "Afficher"} données brutes
        </Button>
      </div>

      {/* Informations de chiffrement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Informations de chiffrement
          </CardTitle>
          <CardDescription>Détails techniques sur la sécurité de vos données</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(getEncryptionInfo()).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                </span>
                <Badge variant="outline">{value}</Badge>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              🔒 <strong>Clé maître actuelle :</strong> {showRawData ? masterKey : "••••••••••••••••"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="user-data" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="user-data">
            <Database className="w-4 h-4 mr-2" />
            Données utilisateur
          </TabsTrigger>
          <TabsTrigger value="auth-data">
            <Key className="w-4 h-4 mr-2" />
            Authentification
          </TabsTrigger>
          <TabsTrigger value="shared-data">
            <Users className="w-4 h-4 mr-2" />
            Données partagées
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-data">
          <Card>
            <CardHeader>
              <CardTitle>Données utilisateur chiffrées</CardTitle>
              <CardDescription>Mots de passe, notes et documents stockés de manière chiffrée</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userData && (
                <>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">{userData.passwords?.length || 0}</div>
                      <div className="text-sm text-gray-600">Mots de passe</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{userData.notes?.length || 0}</div>
                      <div className="text-sm text-gray-600">Notes</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{userData.documents?.length || 0}</div>
                      <div className="text-sm text-gray-600">Documents</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Taille des données :</span>
                      <Badge>{getDataSize(userData)}</Badge>
                    </div>
                  </div>

                  {showRawData && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Données brutes (JSON chiffré)</h4>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(formatJSON(userData))}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copier
                        </Button>
                      </div>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-96">
                        {formatJSON(userData)}
                      </pre>

                      {/* Exemple de déchiffrement */}
                      {userData.passwords && userData.passwords.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold">Exemple de déchiffrement (premier mot de passe)</h4>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                            <p className="text-sm">
                              <strong>Chiffré :</strong> {userData.passwords[0].password}
                            </p>
                            <p className="text-sm mt-2">
                              <strong>Déchiffré :</strong> {decryptData(userData.passwords[0].password, masterKey)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth-data">
          <Card>
            <CardHeader>
              <CardTitle>Données d'authentification</CardTitle>
              <CardDescription>Comptes utilisateurs et mots de passe hachés</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authData && (
                <>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Comptes enregistrés :</strong> {Object.keys(authData).length}
                    </p>
                  </div>

                  {showRawData && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Données d'authentification</h4>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(formatJSON(authData))}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copier
                        </Button>
                      </div>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-96">
                        {formatJSON(authData)}
                      </pre>
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          ⚠️ Les mots de passe sont hachés avec SHA-256 et ne peuvent pas être récupérés.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared-data">
          <Card>
            <CardHeader>
              <CardTitle>Données de partage</CardTitle>
              <CardDescription>Liens de partage temporaires et métadonnées</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sharedData && sharedData.length > 0 ? (
                <>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      <strong>Partages actifs :</strong> {sharedData.length}
                    </p>
                  </div>

                  {showRawData && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Métadonnées de partage</h4>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(formatJSON(sharedData))}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copier
                        </Button>
                      </div>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-96">
                        {formatJSON(sharedData)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune donnée de partage</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
