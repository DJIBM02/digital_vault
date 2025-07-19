"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Copy, RefreshCw, Shield } from "lucide-react"

export default function PasswordGenerator() {
  const [password, setPassword] = useState("")
  const [length, setLength] = useState([16])
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [excludeSimilar, setExcludeSimilar] = useState(false)

  const generatePassword = () => {
    let charset = ""
    const similar = "il1Lo0O"

    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz"
    if (includeNumbers) charset += "0123456789"
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?"

    if (excludeSimilar) {
      charset = charset
        .split("")
        .filter((char) => !similar.includes(char))
        .join("")
    }

    if (charset === "") {
      setPassword("Veuillez sélectionner au moins un type de caractère")
      return
    }

    let result = ""
    for (let i = 0; i < length[0]; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    setPassword(result)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password)
  }

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length < 8)
      return {
        level: "Faible",
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-900/20",
      }
    if (pwd.length < 12)
      return {
        level: "Moyen",
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-100 dark:bg-yellow-900/20",
      }
    if (pwd.length < 16)
      return {
        level: "Fort",
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/20",
      }
    return {
      level: "Très fort",
      color: "text-green-700 dark:text-green-300",
      bg: "bg-green-200 dark:bg-green-900/30",
    }
  }

  const strength = password ? getPasswordStrength(password) : null

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Générateur de mots de passe</h3>
        <p className="text-sm text-gray-600">Créez des mots de passe sécurisés et uniques</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Paramètres
            </CardTitle>
            <CardDescription>Configurez votre mot de passe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Longueur: {length[0]} caractères</Label>
              <Slider value={length} onValueChange={setLength} max={50} min={4} step={1} className="w-full" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="uppercase">Majuscules (A-Z)</Label>
                <Switch id="uppercase" checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="lowercase">Minuscules (a-z)</Label>
                <Switch id="lowercase" checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="numbers">Chiffres (0-9)</Label>
                <Switch id="numbers" checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="symbols">Symboles (!@#$...)</Label>
                <Switch id="symbols" checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="similar">Exclure caractères similaires</Label>
                <Switch id="similar" checked={excludeSimilar} onCheckedChange={setExcludeSimilar} />
              </div>
            </div>

            <Button onClick={generatePassword} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Générer un mot de passe
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mot de passe généré</CardTitle>
            <CardDescription>Votre nouveau mot de passe sécurisé</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="generated-password">Mot de passe</Label>
              <div className="flex space-x-2">
                <Input
                  id="generated-password"
                  value={password}
                  readOnly
                  className="font-mono"
                  placeholder="Cliquez sur 'Générer' pour créer un mot de passe"
                />
                <Button variant="outline" size="icon" onClick={copyToClipboard} disabled={!password}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {strength && (
              <div className="space-y-2">
                <Label>Force du mot de passe</Label>
                <div className={`px-3 py-2 rounded-lg ${strength.bg}`}>
                  <span className={`font-semibold ${strength.color}`}>{strength.level}</span>
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Conseils de sécurité</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Utilisez un mot de passe unique pour chaque compte</li>
                <li>• Préférez des mots de passe de 16+ caractères</li>
                <li>• Activez l'authentification à deux facteurs</li>
                <li>• Ne partagez jamais vos mots de passe</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
