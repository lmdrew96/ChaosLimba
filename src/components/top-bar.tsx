"use client"

import { User, Settings, LogOut, BookOpen, Volume2, MessageCircle, Sparkles } from "lucide-react"
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
import { useClerk, useUser } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import Link from "next/link"

export function TopBar() {
  const { signOut, openUserProfile } = useClerk()
  const { user } = useUser()
  const pathname = usePathname()
  const showQuickTools = pathname !== "/"

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user) return "CL"
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user.firstName) return user.firstName[0].toUpperCase()
    if (user.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress[0].toUpperCase()
    }
    return "CL"
  }

  // Get display name
  const getDisplayName = () => {
    if (!user) return "Chaos Learner"
    if (user.firstName) {
      return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName
    }
    return user.emailAddresses?.[0]?.emailAddress || "Chaos Learner"
  }

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
        {showQuickTools && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-primary/10 transition-colors"
              >
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 rounded-xl" align="end">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Quick Tools</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/ce-inseamna">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Ce înseamnă?
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/cum-se-pronunta">
                  <Volume2 className="mr-2 h-4 w-4" />
                  Cum se pronunță?
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/ask-tutor">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Ask Tutor
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.imageUrl || ""} alt={getDisplayName()} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm">
                  {getInitials()}
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
                <p className="text-sm font-medium">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.emailAddresses?.[0]?.emailAddress || "Chaos Learner"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => openUserProfile()}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
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
