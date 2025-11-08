'use client';

import { useState } from 'react';
import { Task } from '@/store/kanbanStore';
import { useUserStore } from '@/store/userStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { X, Trash2, ExternalLink } from 'lucide-react';

interface TaskDetailsModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  canEdit: boolean;
}

export function TaskDetailsModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  canEdit,
}: TaskDetailsModalProps) {
  const { users } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedLink, setEditedLink] = useState(task.link || '');
  const [selectedUsers, setSelectedUsers] = useState<string[]>(task.assignedUsers || []);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const creator = users.find((u) => u.id === task.createdBy);
  const assignedUserNames = task.assignedUsers
    ?.map((userId) => users.find((u) => u.id === userId))
    .filter(Boolean);

  const handleSave = () => {
    onUpdate(task.id, {
      title: editedTitle.trim(),
      description: editedDescription.trim() || undefined,
      link: editedLink.trim() || undefined,
      assignedUsers: selectedUsers.length > 0 ? selectedUsers : undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(task.title);
    setEditedDescription(task.description || '');
    setEditedLink(task.link || '');
    setSelectedUsers(task.assignedUsers || []);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onClose();
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-2 py-1 bg-black border border-[#00ff00]/30 text-[#00ff00] rounded focus:outline-none focus:ring-2 focus:ring-[#00ff00]"
                autoFocus
              />
            ) : (
              task.title
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Created By */}
          <div>
            <label className="text-sm text-[#00ff00]/70 block mb-1">Created by</label>
            <div className="text-[#00ff00]">
              {creator ? `${creator.name} (${creator.email})` : 'Unknown'}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-[#00ff00]/70 block mb-1">Description</label>
            {isEditing ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Add a description..."
                className="w-full px-3 py-2 bg-black border border-[#00ff00]/30 text-[#00ff00] rounded focus:outline-none focus:ring-2 focus:ring-[#00ff00] placeholder-[#00ff00]/50"
                rows={4}
              />
            ) : (
              <div className="text-[#00ff00] whitespace-pre-wrap">
                {task.description || 'No description provided'}
              </div>
            )}
          </div>

          {/* Link */}
          <div>
            <label className="text-sm text-[#00ff00]/70 block mb-1">Link</label>
            {isEditing ? (
              <input
                type="url"
                value={editedLink}
                onChange={(e) => setEditedLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-black border border-[#00ff00]/30 text-[#00ff00] rounded focus:outline-none focus:ring-2 focus:ring-[#00ff00] placeholder-[#00ff00]/50"
              />
            ) : task.link ? (
              <a
                href={task.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00ff00] hover:text-[#00ff00]/80 flex items-center gap-2 underline"
              >
                {task.link}
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <div className="text-[#00ff00]/50">No link provided</div>
            )}
          </div>

          {/* Assigned Users */}
          <div>
            <label className="text-sm text-[#00ff00]/70 block mb-1">Assigned to</label>
            {isEditing ? (
              <div className="space-y-2">
                {/* Selected Users Display */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((userId) => {
                      const user = users.find((u) => u.id === userId);
                      return user ? (
                        <div
                          key={userId}
                          className="flex items-center gap-2 px-3 py-1 bg-[#004000] border border-[#00ff00]/50 rounded text-[#00ff00]"
                        >
                          <span>{user.name}</span>
                          <button
                            onClick={() => removeUser(userId)}
                            className="hover:text-[#00ff00] text-[#00ff00]/70"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="w-full px-3 py-2 bg-black border border-[#00ff00]/30 text-[#00ff00] rounded text-left hover:border-[#00ff00]/50"
                  >
                    {selectedUsers.length === 0
                      ? 'Select users...'
                      : `${selectedUsers.length} user(s) selected`}
                  </button>

                  {showUserDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-black border border-[#00ff00]/50 rounded shadow-lg max-h-40 overflow-y-auto">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => toggleUserSelection(user.id)}
                          className={`px-3 py-2 cursor-pointer hover:bg-[#002000] ${
                            selectedUsers.includes(user.id)
                              ? 'bg-[#004000] text-[#00ff00]'
                              : 'text-[#00ff00]/70'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => {}}
                              className="accent-[#00ff00]"
                            />
                            <span>{user.name}</span>
                            <span className="text-xs text-[#00ff00]/50">({user.email})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : assignedUserNames && assignedUserNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignedUserNames.map((user) => (
                  <div
                    key={user!.id}
                    className="px-3 py-1 bg-[#004000] border border-[#00ff00]/30 rounded text-[#00ff00]"
                  >
                    {user!.name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[#00ff00]/50">Not assigned</div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between mt-6">
          <div>
            {canEdit && !isEditing && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-900/20 text-red-400 border border-red-400/50 rounded hover:bg-red-900/40 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-black text-[#00ff00]/70 border border-[#00ff00]/30 rounded hover:bg-[#002000]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-[#004000] text-[#00ff00] border border-[#00ff00]/50 rounded hover:bg-[#006000]"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-black text-[#00ff00]/70 border border-[#00ff00]/30 rounded hover:bg-[#002000]"
                >
                  Close
                </button>
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-[#004000] text-[#00ff00] border border-[#00ff00]/50 rounded hover:bg-[#006000]"
                  >
                    Edit
                  </button>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
