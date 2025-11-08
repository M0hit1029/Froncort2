"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DocumentVersion } from "@/store/versionStore";
import { Clock, Save, User } from "lucide-react";

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DocumentVersion[];
  onRestore: (version: DocumentVersion) => void;
  onDelete?: (versionId: string) => void;
}

export default function VersionHistoryModal({
  isOpen,
  onClose,
  versions,
  onRestore,
  onDelete,
}: VersionHistoryModalProps) {
  // Use lazy initializer to avoid calling Date.now() during render
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update time periodically when modal is open
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = currentTime - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[#00ff00] text-xl">Version History</DialogTitle>
          <DialogDescription>
            Select a version to restore. Your current document will be replaced.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-[#00ff00]/50">
              <Save className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No versions saved yet</p>
              <p className="text-xs mt-1">Versions are auto-saved every 2 minutes</p>
            </div>
          ) : (
            versions.map((version, index) => (
              <div
                key={version.id}
                className="border border-[#00ff00]/20 rounded-lg p-4 hover:bg-[#002000] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-[#00ff00] font-medium">
                        {version.title}
                      </h3>
                      {version.isAutoSaved ? (
                        <span className="text-xs px-2 py-0.5 bg-[#004000] border border-[#00ff00]/30 rounded text-[#00ff00]/70">
                          Auto-saved
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-[#403000] border border-[#ffff00]/30 rounded text-[#ffff00]/70">
                          Manual
                        </span>
                      )}
                      {index === 0 && (
                        <span className="text-xs px-2 py-0.5 bg-[#000040] border border-[#0000ff]/30 rounded text-[#00ffff]/70">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#00ff00]/60">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(version.timestamp)}
                      </span>
                      <span className="text-[#00ff00]/40">
                        ({formatRelativeTime(version.timestamp)})
                      </span>
                      {version.createdBy && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {version.createdBy}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRestore(version)}
                      className="px-3 py-1 text-sm bg-[#004000] text-[#00ff00] border border-[#00ff00]/30 rounded hover:bg-[#006000] transition-colors"
                    >
                      Restore
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(version.id)}
                        className="px-3 py-1 text-sm bg-black text-[#ff0000] border border-[#ff0000]/30 rounded hover:bg-[#200000] transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black text-[#00ff00] border border-[#00ff00]/30 rounded hover:bg-[#002000] transition-colors"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
