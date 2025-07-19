"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Share, Copy, Trash2, LinkIcon, AlertTriangle, Eye } from "lucide-react"
import CryptoJS from "crypto-js"

interface SharedItem {
  id: string
  type: "password" | "note" | "document"
  itemId: string
  title: string
  shareKey: string
  expiresAt: string
  maxViews: number
  currentViews: number
  createdAt: string
  lastAccessedAt?: string
  fileType?: string
}

interface ShareableItem {
  id: string
  title: string
  type: "password" | "note" | "document"
}

export default function SharingManager() {
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([])
  const [shareableItems, setShareableItems] = useState<ShareableItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState("")
  const [expirationHours, setExpirationHours] = useState("24")
  const [maxViews, setMaxViews] = useState("1")
  const [generatedLink, setGeneratedLink] = useState("")
  const [showGeneratedLink, setShowGeneratedLink] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSharedItems()
    loadShareableItems()
  }, [])

  const loadShareableItems = () => {
    const user = localStorage.getItem("vault_user")
    const masterKey = localStorage.getItem("vault_master_key")
    if (!user || !masterKey) return

    const userData = JSON.parse(
      localStorage.getItem(`vault_data_${user}`) || '{"passwords":[],"notes":[],"documents":[]}',
    )

    const items: ShareableItem[] = [
      ...userData.passwords.map((p: any) => ({
        id: p.id,
        title: p.title,
        type: "password" as const,
      })),
      ...userData.notes.map((n: any) => ({
        id: n.id,
        title: n.title,
        type: "note" as const,
      })),
      ...userData.documents.map((d: any) => ({
        id: d.id,
        title: d.name,
        type: "document" as const,
      })),
    ]

    setShareableItems(items)
  }

  const loadSharedItems = () => {
    const user = localStorage.getItem("vault_user")
    if (!user) return

    const sharedData = localStorage.getItem(`vault_shared_${user}`)
    if (sharedData) {
      const items = JSON.parse(sharedData)
      // Filter expired items and items that exceeded max views
      const validItems = items.filter((item: SharedItem) => {
        const isNotExpired = new Date(item.expiresAt) > new Date()
        const hasViewsLeft = item.currentViews < item.maxViews || item.maxViews === 999
        return isNotExpired && hasViewsLeft
      })
      setSharedItems(validItems)

      // Save valid items back if any were filtered out
      if (validItems.length !== items.length) {
        localStorage.setItem(`vault_shared_${user}`, JSON.stringify(validItems))
        // Clean up expired share data
        items.forEach((item: SharedItem) => {
          if (!validItems.find((v: SharedItem) => v.id === item.id)) {
            localStorage.removeItem(`vault_share_${item.id}`)
          }
        })
      }
    }
  }

  const generateShareLink = () => {
    if (!selectedItem) return

    const user = localStorage.getItem("vault_user")
    const masterKey = localStorage.getItem("vault_master_key")
    if (!user || !masterKey) return

    // Generate unique share key
    const shareKey = CryptoJS.lib.WordArray.random(32).toString()
    const shareId = CryptoJS.lib.WordArray.random(16).toString()

    // Get item to share
    const userData = JSON.parse(
      localStorage.getItem(`vault_data_${user}`) || '{"passwords":[],"notes":[],"documents":[]}',
    )

    let itemData = null
    let itemType = ""
    let itemTitle = ""
    let fileType = ""

    // Find the item in data
    const passwordItem = userData.passwords.find((p: any) => p.id === selectedItem)
    const noteItem = userData.notes.find((n: any) => n.id === selectedItem)
    const documentItem = userData.documents.find((d: any) => d.id === selectedItem)

    if (passwordItem) {
      // Decrypt password for sharing
      const decryptedPassword = CryptoJS.AES.decrypt(passwordItem.password, masterKey).toString(CryptoJS.enc.Utf8)
      itemData = { ...passwordItem, password: decryptedPassword }
      itemType = "password"
      itemTitle = passwordItem.title
    } else if (noteItem) {
      // Decrypt note content for sharing
      const decryptedContent = CryptoJS.AES.decrypt(noteItem.content, masterKey).toString(CryptoJS.enc.Utf8)
      itemData = { ...noteItem, content: decryptedContent }
      itemType = "note"
      itemTitle = noteItem.title
    } else if (documentItem) {
      itemData = documentItem
      itemType = "document"
      itemTitle = documentItem.name
      fileType = documentItem.fileType
    }

    if (!itemData) return

    // Encrypt data with share key
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(itemData), shareKey).toString()

    // Create shared item
    const sharedItem: SharedItem = {
      id: shareId,
      type: itemType as "password" | "note" | "document",
      itemId: selectedItem,
      title: itemTitle,
      shareKey,
      expiresAt: new Date(Date.now() + Number.parseInt(expirationHours) * 60 * 60 * 1000).toISOString(),
      maxViews: Number.parseInt(maxViews),
      currentViews: 0,
      createdAt: new Date().toISOString(),
      fileType: fileType,
    }

    // Save shared item
    const updatedSharedItems = [...sharedItems, sharedItem]
    setSharedItems(updatedSharedItems)
    localStorage.setItem(`vault_shared_${user}`, JSON.stringify(updatedSharedItems))

    // Save encrypted data for sharing
    localStorage.setItem(`vault_share_${shareId}`, encryptedData)

    // Generate share URL
    const shareUrl = `${window.location.origin}/share/${shareId}?key=${shareKey}`
    setGeneratedLink(shareUrl)
    setShowGeneratedLink(true)

    toast({
      title: "Lien de partage créé",
      description: "Le lien sécurisé a été généré avec succès",
    })
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(generatedLink).then(() => {
      toast({
        title: "Lien copié",
        description: "Le lien de partage a été copié dans le presse-papiers",
      })
    })
  }

  const deleteSharedItem = (id: string) => {
    const updatedItems = sharedItems.filter((item) => item.id !== id)
    setSharedItems(updatedItems)

    const user = localStorage.getItem("vault_user")
    if (user) {
      localStorage.setItem(`vault_shared_${user}`, JSON.stringify(updatedItems))
      localStorage.removeItem(`vault_share_${id}`)
    }

    toast({
      title: "Partage supprimé",
      description: "Le lien de partage a été supprimé avec succès",
    })
  }

  const getExpirationStatus = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const hoursLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60))

    if (hoursLeft <= 0)
      return {
        status: "expired",
        text: "Expiré",
        color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200",
      }
    if (hoursLeft <= 1)
      return {
        status: "critical",
        text: `${hoursLeft}h restante`,
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200",
      }
    if (hoursLeft <= 24)
      return {
        status: "warning",
        text: `${hoursLeft}h restantes`,
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
      }
    return {
      status: "active",
      text: `${Math.ceil(hoursLeft / 24)}j restants`,
      color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200",
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "password":
        return "🔑"
      case "note":
        return "📝"
      case "document":
        // Return specific icons based on file type if available
        return "📄"
      default:
        return "📁"
    }
  }

  // Add this new function for detailed document icons
  const getDocumentTypeIcon = (fileType: string) => {
    if (fileType?.includes("pdf")) return "📄"
    if (fileType?.includes("word") || fileType?.includes("document")) return "📝"
    if (fileType?.includes("excel") || fileType?.includes("spreadsheet")) return "📊"
    if (fileType?.includes("powerpoint") || fileType?.includes("presentation")) return "📊"
    if (fileType?.startsWith("image/")) return "🖼️"
    if (fileType?.includes("text")) return "📃"
    if (fileType?.includes("zip") || fileType?.includes("rar")) return "🗜️"
    return "📁"
  }

  const refreshSharedItems = () => {
    loadSharedItems()
    toast({
      title: "Données actualisées",
      description: "Les statistiques de partage ont été mises à jour",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Partage temporaire sécurisé</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Partagez vos données de manière sécurisée avec des liens chiffrés
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refreshSharedItems}>
            <Eye className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowGeneratedLink(false)}>
                <Share className="w-4 h-4 mr-2" />
                Créer un partage
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Partager un élément</DialogTitle>
                <DialogDescription>Créez un lien sécurisé et temporaire pour partager vos données</DialogDescription>
              </DialogHeader>

              {!showGeneratedLink ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-select">Élément à partager</Label>
                    <Select value={selectedItem} onValueChange={setSelectedItem}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un élément" />
                      </SelectTrigger>
                      <SelectContent>
                        {shareableItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {getTypeIcon(item.type)} {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiration">Expiration (heures)</Label>
                      <Select value={expirationHours} onValueChange={setExpirationHours}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 heure</SelectItem>
                          <SelectItem value="6">6 heures</SelectItem>
                          <SelectItem value="24">24 heures</SelectItem>
                          <SelectItem value="72">3 jours</SelectItem>
                          <SelectItem value="168">1 semaine</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-views">Vues maximum</Label>
                      <Select value={maxViews} onValueChange={setMaxViews}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 vue</SelectItem>
                          <SelectItem value="3">3 vues</SelectItem>
                          <SelectItem value="5">5 vues</SelectItem>
                          <SelectItem value="10">10 vues</SelectItem>
                          <SelectItem value="999">Illimité</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-semibold">Attention :</p>
                        <p>Le lien sera automatiquement supprimé après expiration ou épuisement des vues.</p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={generateShareLink} className="w-full" disabled={!selectedItem}>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Générer le lien de partage
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Lien de partage généré</Label>
                    <div className="flex space-x-2">
                      <Input value={generatedLink} readOnly className="font-mono text-xs" />
                      <Button variant="outline" size="icon" onClick={copyShareLink}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      ✅ Lien créé avec succès ! Partagez-le de manière sécurisée.
                    </p>
                  </div>

                  <Button onClick={() => setIsDialogOpen(false)} className="w-full">
                    Fermer
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Liste des éléments partagés */}
      <div className="grid gap-4">
        {sharedItems.map((item) => {
          const expiration = getExpirationStatus(item.expiresAt)
          return (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <span className="text-lg">
                        {item.type === "document" ? getDocumentTypeIcon(item.fileType) : getTypeIcon(item.type)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription>Créé le {new Date(item.createdAt).toLocaleDateString("fr-FR")}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={expiration.color}>{expiration.text}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => deleteSharedItem(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Vues :</span>
                  <span
                    className={
                      item.currentViews >= item.maxViews && item.maxViews !== 999 ? "text-red-600 font-semibold" : ""
                    }
                  >
                    {item.currentViews} / {item.maxViews === 999 ? "∞" : item.maxViews}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Type :</span>
                  <span className="capitalize">{item.type}</span>
                </div>
                {item.lastAccessedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Dernier accès :</span>
                    <span className="text-xs">{new Date(item.lastAccessedAt).toLocaleString("fr-FR")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {sharedItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Share className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun partage actif</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Créez votre premier lien de partage sécurisé</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Share className="w-4 h-4 mr-2" />
              Créer un partage
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
