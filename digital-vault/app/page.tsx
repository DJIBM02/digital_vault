"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Lock, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import CryptoJS from "crypto-js"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const token = localStorage.getItem("vault_token")
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  const generateJWT = (email: string) => {
    const header = {
      alg: "HS256",
      typ: "JWT",
    }

    const payload = {
      email: email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 heures
    }

    const secret = "vault_secret_key_2024"
    const encodedHeader = btoa(JSON.stringify(header))
    const encodedPayload = btoa(JSON.stringify(payload))
    const signature = CryptoJS.HmacSHA256(`${encodedHeader}.${encodedPayload}`, secret).toString()

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Veuillez remplir tous les champs")
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (!isLogin && password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    try {
      if (isLogin) {
        // Connexion
        const users = JSON.parse(localStorage.getItem("vault_users") || "{}")
        const hashedPassword = CryptoJS.SHA256(password).toString()

        if (users[email] && users[email] === hashedPassword) {
          const token = generateJWT(email)
          localStorage.setItem("vault_token", token)
          localStorage.setItem("vault_user", email)
          localStorage.setItem("vault_master_key", CryptoJS.SHA256(password + email).toString())
          router.push("/dashboard")
        } else {
          setError("Email ou mot de passe incorrect")
        }
      } else {
        // Inscription
        const users = JSON.parse(localStorage.getItem("vault_users") || "{}")

        if (users[email]) {
          setError("Un compte existe déjà avec cet email")
          return
        }

        const hashedPassword = CryptoJS.SHA256(password).toString()
        users[email] = hashedPassword
        localStorage.setItem("vault_users", JSON.stringify(users))

        const token = generateJWT(email)
        localStorage.setItem("vault_token", token)
        localStorage.setItem("vault_user", email)
        localStorage.setItem("vault_master_key", CryptoJS.SHA256(password + email).toString())

        // Initialiser les données utilisateur
        localStorage.setItem(
          `vault_data_${email}`,
          JSON.stringify({
            passwords: [],
            notes: [],
            documents: [],
          }),
        )

        router.push("/dashboard")
      }
    } catch (error) {
      setError("Une erreur est survenue")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <div className="mx-auto mb-4 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Coffre-Fort Numérique</CardTitle>
          <CardDescription>Stockage sécurisé et chiffré de vos données sensibles</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "register"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" onClick={() => setIsLogin(true)}>
                Connexion
              </TabsTrigger>
              <TabsTrigger value="register" onClick={() => setIsLogin(false)}>
                Inscription
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe maître</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe sécurisé"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmer le mot de passe"
                    required
                  />
                </div>
              )}

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}

              <Button type="submit" className="w-full">
                <Lock className="w-4 h-4 mr-2" />
                {isLogin ? "Se connecter" : "Créer le compte"}
              </Button>
            </form>
          </Tabs>

          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>🔒 Chiffrement AES-256 • Stockage local sécurisé</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
