"use client"

import { useState, useMemo } from "react"
import { useProjectStore } from "@/store/projectStore"
import { useUserStore } from "@/store/userStore"
import { useNotificationStore } from "@/store/notificationStore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProjectShareModalProps {
  projectId: string
}

export function ProjectShareModal({ projectId }: ProjectShareModalProps) {
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [role, setRole] = useState<"viewer" | "editor" | "admin">("viewer")
  const { addShare } = useProjectStore()
  const { users, currentUser } = useUserStore()
  const { addNotification } = useNotificationStore()

  // Filter users based on search input, excluding current user
  const filteredUsers = useMemo(() => {
    if (!searchInput.trim()) return []
    
    const searchLower = searchInput.toLowerCase()
    return users
      .filter((user) => user.id !== currentUser.id) // Don't show current user
      .filter((user) => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      )
  }, [searchInput, users, currentUser.id])

  const handleInputChange = (value: string) => {
    setSearchInput(value)
    setSelectedUserId(null)
    setShowSuggestions(true)
  }

  const handleSelectUser = (userId: string, userName: string, userEmail: string) => {
    setSelectedUserId(userId)
    setSearchInput(`${userName} (${userEmail})`)
    setShowSuggestions(false)
  }

  const handleInputBlur = () => {
    // Delay hiding to allow click event on suggestions to fire
    setTimeout(() => setShowSuggestions(false), 200)
  }

  const handleShare = () => {
    if (selectedUserId) {
      try {
        addShare(projectId, selectedUserId, role)
        
        // Show success toast
        addNotification({
          userId: currentUser.id,
          type: 'success',
          message: `Project shared successfully with ${role} access`,
        })
        
        // Reset form
        setSearchInput("")
        setSelectedUserId(null)
        setRole("viewer")
        setOpen(false)
      } catch (error) {
        // Show error toast
        addNotification({
          userId: currentUser.id,
          type: 'error',
          message: 'Failed to share project',
        })
        console.error("Error sharing project:", error)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Share Project</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            Invite someone to collaborate on this project by searching for their name or email.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="user-search">Search User</Label>
            <div className="relative">
              <Input
                id="user-search"
                placeholder="Type name or email..."
                value={searchInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={handleInputBlur}
                autoComplete="off"
              />
              {showSuggestions && filteredUsers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-black border border-[#00ff00]/30 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-[#00ff00]/10 focus:bg-[#00ff00]/10 focus:outline-none transition-colors"
                      onClick={() => handleSelectUser(user.id, user.name, user.email)}
                    >
                      <div className="text-[#00ff00] font-medium">{user.name}</div>
                      <div className="text-[#00ff00]/70 text-sm">{user.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as "viewer" | "editor" | "admin")}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            onClick={handleShare}
            disabled={!selectedUserId}
          >
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}