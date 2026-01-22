"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, User, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"
import { useClerk } from "@clerk/nextjs"

export function TopBar() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { signOut } = useClerk()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await signOut(() => {
      window.location.href = "/"
    })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-lg px-6">
      <div className="flex items-center gap-4">
        <div className="md:hidden w-10" />
        <div className="hidden md:block">
          <h2 className="text-sm font-medium text-muted-foreground">
            Welcome back
          </h2>
          <p className="text-xs text-muted-foreground/60">
            Ready for some productive chaos?
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5">
          <Sun className="h-4 w-4 text-amber-500" />
          {mounted && (
            <Switch
              checked={resolvedTheme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              className="data-[state=checked]:bg-purple-600"
            />
          )}
          {!mounted && <div className="h-5 w-9" />}
          <Moon className="h-4 w-4 text-purple-400" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full ring-2 ring-purple-500/20 hover:ring-purple-500/40 transition-all"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white text-sm">
                  CL
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-xl"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Chaos Learner</p>
                <p className="text-xs text-muted-foreground">
                  Level: B1 Intermediate
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
