"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Copy, Download, AlertTriangle, CheckCircle, XCircle, FileText } from "lucide-react"
import CryptoJS from "crypto-js"

export default function SharePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [sharedData, setSharedData] = useState<any>(null)
  const [shareMetadata, setShareMetadata] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [hasViewed, setHasViewed] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSharedData()
  }, [])

  const updateViewCount = (shareId: string) => {
    // Find all users and update the view count for this share
    const allUsers = JSON.parse(localStorage.getItem("vault_users") || "{}")

    Object.keys(allUsers).forEach((userEmail) => {
      const userSharedData = localStorage.getItem(`vault_shared_${userEmail}`)
      if (userSharedData) {
        const sharedItems = JSON.parse(userSharedData)
        const updatedItems = sharedItems.map((item: any) => {
          if (item.id === shareId) {
            return {
              ...item,
              currentViews: item.currentViews + 1,
              lastAccessedAt: new Date().toISOString(),
            }
          }
          return item
        })

        // Check if any item was updated
        if (JSON.stringify(updatedItems) !== JSON.stringify(sharedItems)) {
          localStorage.setItem(`vault_shared_${userEmail}`, JSON.stringify(updatedItems))

          // Find the updated item to check if it should be deleted
          const updatedItem = updatedItems.find((item: any) => item.id === shareId)
          if (updatedItem && updatedItem.currentViews >= updatedItem.maxViews && updatedItem.maxViews !== 999) {
            // Remove the item if max views reached
            const finalItems = updatedItems.filter((item: any) => item.id !== shareId)
            localStorage.setItem(`vault_shared_${userEmail}`, JSON.stringify(finalItems))
            localStorage.removeItem(`vault_share_${shareId}`)
            setIsExpired(true)
          }
        }
      }
    })
  }

  const loadSharedData = async () => {
    try {
      const shareId = params.id as string
      const shareKey = searchParams.get("key")

      if (!shareId || !shareKey) {
        setError("Lien de partage invalide")
        setIsLoading(false)
        return
      }

      // Get encrypted data
      const encryptedData = localStorage.getItem(`vault_share_${shareId}`)
      if (!encryptedData) {
        setError("Ce lien de partage a expiré ou n'existe pas")
        setIsLoading(false)
        return
      }

      // Find share metadata from all users
      const allUsers = JSON.parse(localStorage.getItem("vault_users") || "{}")
      let foundMetadata = null

      Object.keys(allUsers).forEach((userEmail) => {
        const userSharedData = localStorage.getItem(`vault_shared_${userEmail}`)
        if (userSharedData) {
          const sharedItems = JSON.parse(userSharedData)
          const metadata = sharedItems.find((item: any) => item.id === shareId)
          if (metadata) {
            foundMetadata = metadata
          }
        }
      })

      if (!foundMetadata) {
        setError("Métadonnées de partage introuvables")
        setIsLoading(false)
        return
      }

      // Check if expired
      if (new Date(foundMetadata.expiresAt) <= new Date()) {
        setError("Ce lien de partage a expiré")
        setIsLoading(false)
        return
      }

      // Check if max views reached
      if (foundMetadata.currentViews >= foundMetadata.maxViews && foundMetadata.maxViews !== 999) {
        setError("Ce lien de partage a atteint le nombre maximum de vues")
        setIsLoading(false)
        return
      }

      setShareMetadata(foundMetadata)

      // Decrypt data
      try {
        const decryptedData = CryptoJS.AES.decrypt(encryptedData, shareKey).toString(CryptoJS.enc.Utf8)
        const parsedData = JSON.parse(decryptedData)
        setSharedData(parsedData)
        setHasViewed(true)

        // Update view count
        updateViewCount(shareId)

        toast({
          title: "Données chargées",
          description: "Les données partagées ont été déchiffrées avec succès",
        })
      } catch (decryptError) {
        setError("Impossible de déchiffrer les données. Clé invalide.")
      }
    } catch (error) {
      setError("Erreur lors du chargement des données partagées")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: "Copié avec succès",
          description: `${label} copié dans le presse-papiers`,
        })
      })
      .catch(() => {
        toast({
          title: "Erreur de copie",
          description: "Impossible de copier dans le presse-papiers",
          variant: "destructive",
        })
      })
  }

  const downloadDocument = (data: string, filename: string, fileType: string) => {
    try {
      // Create a blob from the data URL
      const response = fetch(data)
      response
        .then((res) => res.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob)
          const link = window.document.createElement("a")
          link.href = url
          link.download = filename

          // Add the link to the document and trigger download
          window.document.body.appendChild(link)
          link.click()

          // Clean up
          window.document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          toast({
            title: "Téléchargement réussi",
            description: `Le fichier ${filename} a été téléchargé avec succès`,
          })
        })
        .catch(() => {
          // Fallback to direct download
          const link = window.document.createElement("a")
          link.href = data
          link.download = filename
          window.document.body.appendChild(link)
          link.click()
          window.document.body.removeChild(link)

          toast({
            title: "Téléchargement démarré",
            description: `Le fichier ${filename} est en cours de téléchargement`,
          })
        })
    } catch (error) {
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      })
    }
  }

  // Add this new function for getting file type icon
  const getFileTypeIcon = (type: string, size: "sm" | "md" | "lg" = "md") => {
    const iconSize = size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : "w-8 h-8"

    if (type?.includes("pdf")) return <FileText className={`${iconSize} text-red-500`} />
    if (type?.includes("word") || type?.includes("document"))
      return <FileText className={`${iconSize} text-blue-500`} />
    if (type?.includes("excel") || type?.includes("spreadsheet"))
      return <FileText className={`${iconSize} text-green-500`} />
    if (type?.includes("powerpoint") || type?.includes("presentation"))
      return <FileText className={`${iconSize} text-orange-500`} />
    if (type?.startsWith("image/")) return <FileText className={`${iconSize} text-purple-500`} />
    if (type?.includes("text")) return <FileText className={`${iconSize} text-gray-500`} />
    if (type?.includes("zip") || type?.includes("rar")) return <FileText className={`${iconSize} text-yellow-500`} />
    return <FileText className={`${iconSize} text-gray-400`} />
  }

  // Add this function to get file type description
  const getFileTypeDescription = (type: string) => {
    if (type?.includes("pdf")) return "Document PDF"
    if (type?.includes("word") || type?.includes("document")) return "Document Word"
    if (type?.includes("excel") || type?.includes("spreadsheet")) return "Feuille de calcul Excel"
    if (type?.includes("powerpoint") || type?.includes("presentation")) return "Présentation PowerPoint"
    if (type?.startsWith("image/")) return "Image"
    if (type?.includes("text")) return "Fichier texte"
    if (type?.includes("zip")) return "Archive ZIP"
    if (type?.includes("rar")) return "Archive RAR"
    return "Fichier"
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "password":
        return "🔑"
      case "note":
        return "📝"
      case "document":
        return "📄"
      default:
        return "📁"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p>Chargement des données partagées...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Erreur</h3>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">{getTypeIcon(sharedData?.type || shareMetadata?.type || "")}</span>
            </div>
            <CardTitle className="flex items-center justify-center">
              Données partagées
              <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                Sécurisé
              </Badge>
            </CardTitle>
            <CardDescription>Ces données ont été partagées de manière sécurisée et chiffrée</CardDescription>
          </CardHeader>
        </Card>

        {/* Share metadata */}
        {shareMetadata && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Vues :</span>
                  <span className="font-semibold">
                    {shareMetadata.currentViews + 1} / {shareMetadata.maxViews === 999 ? "∞" : shareMetadata.maxViews}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Expire :</span>
                  <span className="font-semibold">{new Date(shareMetadata.expiresAt).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security warning */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">Attention :</p>
                <ul className="space-y-1">
                  <li>• Ces données sont temporaires et seront supprimées automatiquement</li>
                  <li>• Ne partagez pas ce lien avec des personnes non autorisées</li>
                  <li>• Copiez les informations nécessaires maintenant</li>
                  {isExpired && <li className="text-red-600 font-semibold">• Ce lien a atteint sa limite de vues</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shared content */}
        {sharedData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="text-lg mr-2">{getTypeIcon(sharedData.type || shareMetadata?.type)}</span>
                {sharedData.title || sharedData.name}
              </CardTitle>
              <CardDescription>
                Type:{" "}
                {(sharedData.type || shareMetadata?.type) === "password"
                  ? "Mot de passe"
                  : (sharedData.type || shareMetadata?.type) === "note"
                    ? "Note privée"
                    : "Document"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Password */}
              {(sharedData.type || shareMetadata?.type) === "password" && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Site web:</span>
                      <span className="text-sm">{sharedData.website || "Non spécifié"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Utilisateur:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono">{sharedData.username}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(sharedData.username, "Nom d'utilisateur")}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Mot de passe:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono">{showPassword ? sharedData.password : "••••••••"}</span>
                        <Button variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(sharedData.password, "Mot de passe")}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {sharedData.notes && (
                      <div className="pt-2 border-t">
                        <span className="text-sm font-medium">Notes:</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{sharedData.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Note */}
              {(sharedData.type || shareMetadata?.type) === "note" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                    <div className="flex items-start space-x-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-500 mt-1" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Contenu de la note :</span>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                      {sharedData.content}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(sharedData.content, "Contenu de la note")}
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copier le contenu
                  </Button>
                </div>
              )}

              {/* Document */}
              {(sharedData.type || shareMetadata?.type) === "document" && (
                <div className="space-y-6">
                  {/* File Information Card */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">{getFileTypeIcon(sharedData.type, "lg")}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {sharedData.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {getFileTypeDescription(sharedData.type)}
                        </p>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            {formatFileSize(sharedData.size)}
                          </span>
                          <span className="flex items-center">
                            <Badge variant="outline" className="text-xs">
                              {sharedData.type?.split("/")[1]?.toUpperCase() || "FILE"}
                            </Badge>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview Section for Images */}
                  {sharedData.type?.startsWith("image/") && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Aperçu :</h5>
                      <div className="border rounded-lg p-3 bg-white dark:bg-gray-800">
                        <img
                          src={sharedData.data || "/placeholder.svg"}
                          alt={sharedData.name}
                          className="max-w-full h-auto rounded border shadow-sm"
                          style={{ maxHeight: "400px" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Document Preview for PDFs */}
                  {sharedData.type?.includes("pdf") && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Aperçu PDF :</h5>
                      <div className="border rounded-lg p-3 bg-white dark:bg-gray-800">
                        <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-700 rounded">
                          <div className="text-center">
                            <FileText className="w-12 h-12 text-red-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-300">Aperçu PDF non disponible</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Téléchargez le fichier pour le visualiser
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Text File Preview */}
                  {sharedData.type?.includes("text") && sharedData.size < 10000 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Contenu :</h5>
                      <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                        <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap overflow-auto max-h-64">
                          {/* Note: In a real implementation, you'd need to extract text content from the data URL */}
                          Aperçu du contenu textuel...
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Download Actions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Actions :</h5>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Téléchargement sécurisé</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {/* Primary Download Button */}
                      <Button
                        onClick={() => downloadDocument(sharedData.data, sharedData.name, sharedData.type)}
                        className="w-full h-12 text-base"
                        size="lg"
                      >
                        <Download className="w-5 h-5 mr-3" />
                        Télécharger {sharedData.name}
                      </Button>

                      {/* Secondary Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => copyToClipboard(sharedData.name, "Nom du fichier")}
                          className="text-sm"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copier le nom
                        </Button>

                        {sharedData.type?.startsWith("image/") && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              const link = window.document.createElement("a")
                              link.href = sharedData.data
                              link.target = "_blank"
                              link.click()
                              toast({
                                title: "Image ouverte",
                                description: "L'image s'ouvre dans un nouvel onglet",
                              })
                            }}
                            className="text-sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ouvrir
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* File Security Info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-semibold mb-1">Téléchargement sécurisé</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Le fichier est téléchargé directement depuis le stockage chiffré</li>
                          <li>• Aucune donnée n'est transmise à des serveurs externes</li>
                          <li>• Le téléchargement est comptabilisé dans les statistiques de partage</li>
                          {shareMetadata?.maxViews !== 999 && (
                            <li>• Ce lien sera supprimé après {shareMetadata?.maxViews} vue(s) au total</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* View confirmation */}
        {hasViewed && (
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="text-sm text-green-800 dark:text-green-200">
                  <p className="font-semibold">Données consultées avec succès</p>
                  <p>Cette consultation a été enregistrée et le compteur de vues a été mis à jour.</p>
                  {isExpired && (
                    <p className="text-red-600 dark:text-red-400 font-semibold mt-1">
                      Ce lien a atteint sa limite de vues et sera supprimé.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
