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
import { Clock, Save, User, GitCompare } from "lucide-react";

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DocumentVersion[];
  onRestore: (version: DocumentVersion) => void;
  onDelete?: (versionId: string) => void;
  onCompare?: (version1: DocumentVersion, version2: DocumentVersion) => void;
}

export default function VersionHistoryModal({
  isOpen,
  onClose,
  versions,
  onRestore,
  onDelete,
  onCompare,
}: VersionHistoryModalProps) {
  // Use lazy initializer to avoid calling Date.now() during render
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  // Update time periodically when modal is open
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset selection when modal opens/closes using the onOpenChange callback
  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedVersions([]);
      onClose();
    }
  };

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length >= 2) {
        // Replace the first selected version
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompare) {
      const version1 = versions.find(v => v.id === selectedVersions[0]);
      const version2 = versions.find(v => v.id === selectedVersions[1]);
      if (version1 && version2) {
        onCompare(version1, version2);
      }
    }
  };

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
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[#00ff00] text-xl">Version History</DialogTitle>
          <DialogDescription>
            {selectedVersions.length === 0 
              ? "Select a version to restore, or select two versions to compare."
              : selectedVersions.length === 1
              ? "Select one more version to compare."
              : "Two versions selected. Click Compare to view differences."}
          </DialogDescription>
        </DialogHeader>

        {onCompare && selectedVersions.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-[#002000] border border-[#00ff00]/30 rounded-lg">
            <span className="text-sm text-[#00ff00]">
              {selectedVersions.length} version{selectedVersions.length > 1 ? 's' : ''} selected
            </span>
            {selectedVersions.length === 2 && (
              <button
                onClick={handleCompare}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-[#004000] text-[#00ff00] border border-[#00ff00]/30 rounded hover:bg-[#006000] transition-colors"
              >
                <GitCompare className="w-4 h-4" />
                Compare Versions
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-[#00ff00]/50">
              <Save className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No versions saved yet</p>
              <p className="text-xs mt-1">Versions are auto-saved every 5 minutes or on significant changes</p>
            </div>
          ) : (
            versions.map((version, index) => (
              <div
                key={version.id}
                className={`border rounded-lg p-4 transition-colors ${
                  selectedVersions.includes(version.id)
                    ? 'border-[#00ff00] bg-[#003000]'
                    : 'border-[#00ff00]/20 hover:bg-[#002000]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {onCompare && (
                      <input
                        type="checkbox"
                        checked={selectedVersions.includes(version.id)}
                        onChange={() => handleVersionSelect(version.id)}
                        className="mt-1 w-4 h-4 accent-[#00ff00] cursor-pointer"
                      />
                    )}
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
