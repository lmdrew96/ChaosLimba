"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
    Settings as SettingsIcon,
    User,
    Book,
    Shield,
    Bell,
    Loader2,
    ExternalLink,
    Save,
    CheckCircle2,
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import type { UserPreferences } from "@/lib/db/schema"

const CEFR_LEVELS = [
    { value: "A1", label: "A1", description: "Beginner" },
    { value: "A2", label: "A2", description: "Elementary" },
    { value: "B1", label: "B1", description: "Intermediate" },
    { value: "B2", label: "B2", description: "Upper Intermediate" },
    { value: "C1", label: "C1", description: "Advanced" },
    { value: "C2", label: "C2", description: "Proficient" },
]

export default function SettingsPage() {
    const { user, isLoaded: isUserLoaded } = useUser()
    const [preferences, setPreferences] = useState<UserPreferences | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch preferences on mount
    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const response = await fetch("/api/user/preferences")
                if (!response.ok) throw new Error("Failed to fetch preferences")
                const data = await response.json()
                setPreferences(data.preferences)
            } catch (err) {
                console.error("Failed to load preferences:", err)
                setError("Failed to load your settings")
            } finally {
                setLoading(false)
            }
        }

        fetchPreferences()
    }, [])

    const updatePreference = async (field: string, value: any) => {
        if (!preferences) return

        try {
            setSaving(true)
            setSaved(false)

            const response = await fetch("/api/user/preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: value }),
            })

            if (!response.ok) throw new Error("Failed to update preference")

            const data = await response.json()
            setPreferences(data.preferences)
            setSaved(true)

            // Clear saved indicator after 2 seconds
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            console.error("Failed to update preference:", err)
            setError("Failed to save changes")
        } finally {
            setSaving(false)
        }
    }

    if (loading || !isUserLoaded) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
        )
    }

    if (error && !preferences) {
        return (
            <div className="max-w-4xl mx-auto">
                <Card className="rounded-xl border-red-500/30 bg-red-500/5">
                    <CardContent className="p-8 text-center text-red-400">
                        {error}
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
                        <SettingsIcon className="h-10 w-10 text-purple-400" />
                        Settings
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your account and learning preferences
                    </p>
                </div>
                {saved && (
                    <div className="flex items-center gap-2 text-green-400 animate-in fade-in slide-in-from-right-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Saved!</span>
                    </div>
                )}
            </div>

            {/* Account Section */}
            <Card className="rounded-2xl border-border/40 bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-purple-400" />
                        Account
                    </CardTitle>
                    <CardDescription>Your ChaosLimbă account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold">
                            {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || "C"}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-lg">
                                {user?.firstName && user?.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user?.firstName || "Chaos Learner"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {user?.emailAddresses?.[0]?.emailAddress}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-xl border-purple-500/30 hover:bg-purple-500/10"
                            onClick={() => window.open("https://accounts.clerk.dev/user", "_blank")}
                        >
                            Manage Account
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Learning Preferences */}
            <Card className="rounded-2xl border-border/40 bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Book className="h-5 w-5 text-purple-400" />
                        Learning Preferences
                    </CardTitle>
                    <CardDescription>Customize your learning experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Language Level (Read-only) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-base">Current Language Level</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Calculated from your proficiency test
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
                                    <span className="text-xl font-bold text-purple-300">
                                        {preferences?.languageLevel || "A1"}
                                    </span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                        {CEFR_LEVELS.find((l) => l.value === preferences?.languageLevel)?.description}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>

            {/* Privacy & Data */}
            <Card className="rounded-2xl border-border/40 bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-purple-400" />
                        Privacy & Data
                    </CardTitle>
                    <CardDescription>Control how your data is used</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Analytics */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1 pr-4">
                            <Label htmlFor="analytics" className="text-base cursor-pointer">
                                Anonymous Analytics
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Help improve ChaosLimbă by sharing anonymous usage data
                            </p>
                        </div>
                        <Switch
                            id="analytics"
                            checked={preferences?.analyticsEnabled || false}
                            onCheckedChange={(checked) => updatePreference("analyticsEnabled", checked)}
                            disabled={saving}
                            className="data-[state=checked]:bg-purple-600"
                        />
                    </div>

                    {/* Data Collection for Research */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1 pr-4">
                            <Label htmlFor="data-collection" className="text-base cursor-pointer">
                                Contribute to Research
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Allow your error patterns to be used for language learning research (anonymized)
                            </p>
                        </div>
                        <Switch
                            id="data-collection"
                            checked={preferences?.dataCollectionEnabled || false}
                            onCheckedChange={(checked) => updatePreference("dataCollectionEnabled", checked)}
                            disabled={saving}
                            className="data-[state=checked]:bg-purple-600"
                        />
                    </div>

                    <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-4">
                        <p className="text-sm text-purple-200/80">
                            <strong className="text-purple-300">Privacy Promise:</strong> We never track your Romanian text or audio content.
                            Only error patterns and usage statistics are collected, and only with your explicit consent.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="rounded-2xl border-border/40 bg-card/50 backdrop-blur">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bell className="h-5 w-5 text-purple-400" />
                        Notifications
                    </CardTitle>
                    <CardDescription>Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1 pr-4">
                            <Label htmlFor="email-notifications" className="text-base cursor-pointer">
                                Weekly Learning Summary
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Get a gentle weekly email with your progress – no streaks, no guilt
                            </p>
                        </div>
                        <Switch
                            id="email-notifications"
                            checked={preferences?.emailNotifications || false}
                            onCheckedChange={(checked) => updatePreference("emailNotifications", checked)}
                            disabled={saving}
                            className="data-[state=checked]:bg-purple-600"
                        />
                    </div>

                    <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
                        <p className="text-sm text-amber-200/80 italic">
                            "We provide the method. You provide the mess." <br />
                            No streak pressure. Just optional gentle reminders when you want them.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
