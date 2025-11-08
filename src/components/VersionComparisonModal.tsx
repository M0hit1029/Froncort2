"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DocumentVersion } from "@/store/versionStore";
import { Clock, User } from "lucide-react";
import * as Y from "yjs";
import { yDocToProsemirrorJSON } from "y-prosemirror";

interface VersionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  version1: DocumentVersion;
  version2: DocumentVersion;
}

interface DiffResult {
  type: "added" | "removed" | "unchanged";
  text: string;
}

export default function VersionComparisonModal({
  isOpen,
  onClose,
  version1,
  version2,
}: VersionComparisonModalProps) {
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

  const extractTextFromVersion = (version: DocumentVersion): string => {
    try {
      const tempDoc = new Y.Doc();
      Y.applyUpdate(tempDoc, version.content);
      const contentJSON = yDocToProsemirrorJSON(tempDoc, "content");
      tempDoc.destroy();

      // Extract text from ProseMirror JSON structure
      const extractText = (node: { type?: string; text?: string; content?: unknown[] }): string => {
        if (node.type === "text") {
          return node.text || "";
        }
        if (node.content && Array.isArray(node.content)) {
          return node.content.map(extractText).join("");
        }
        return "";
      };

      return extractText(contentJSON);
    } catch (error) {
      console.error("Error extracting text:", error);
      return "";
    }
  };

  const computeDiff = (text1: string, text2: string): DiffResult[] => {
    // Simple word-based diff algorithm
    const words1 = text1.split(/(\s+)/);
    const words2 = text2.split(/(\s+)/);

    const diff: DiffResult[] = [];
    let i = 0;
    let j = 0;

    while (i < words1.length || j < words2.length) {
      if (i >= words1.length) {
        // All remaining words in text2 are additions
        diff.push({ type: "added", text: words2[j] });
        j++;
      } else if (j >= words2.length) {
        // All remaining words in text1 are removals
        diff.push({ type: "removed", text: words1[i] });
        i++;
      } else if (words1[i] === words2[j]) {
        // Words match
        diff.push({ type: "unchanged", text: words1[i] });
        i++;
        j++;
      } else {
        // Find if the word appears later in the other sequence
        const foundInText2 = words2.slice(j).indexOf(words1[i]);
        const foundInText1 = words1.slice(i).indexOf(words2[j]);

        if (foundInText2 !== -1 && (foundInText1 === -1 || foundInText2 < foundInText1)) {
          // Word from text1 appears later in text2, so text2[j] is an addition
          diff.push({ type: "added", text: words2[j] });
          j++;
        } else if (foundInText1 !== -1) {
          // Word from text2 appears later in text1, so text1[i] is a removal
          diff.push({ type: "removed", text: words1[i] });
          i++;
        } else {
          // Neither word appears later, treat as removal and addition
          diff.push({ type: "removed", text: words1[i] });
          diff.push({ type: "added", text: words2[j] });
          i++;
          j++;
        }
      }
    }

    return diff;
  };

  const text1 = extractTextFromVersion(version1);
  const text2 = extractTextFromVersion(version2);
  const diff = computeDiff(text1, text2);

  // Determine which version is older
  const olderVersion = version1.timestamp < version2.timestamp ? version1 : version2;
  const newerVersion = version1.timestamp < version2.timestamp ? version2 : version1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[#00ff00] text-xl">Version Comparison</DialogTitle>
          <DialogDescription>
            Comparing two versions. Green = added, Red = removed
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-[#002000] border border-[#00ff00]/30 rounded-lg">
            <h3 className="text-sm font-medium text-[#00ff00] mb-2">Older Version</h3>
            <div className="text-xs text-[#00ff00]/60 space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimestamp(olderVersion.timestamp)}
              </div>
              {olderVersion.createdBy && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {olderVersion.createdBy}
                </div>
              )}
              <div className="text-[#00ff00]/40">{olderVersion.title}</div>
            </div>
          </div>

          <div className="p-3 bg-[#002000] border border-[#00ff00]/30 rounded-lg">
            <h3 className="text-sm font-medium text-[#00ff00] mb-2">Newer Version</h3>
            <div className="text-xs text-[#00ff00]/60 space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimestamp(newerVersion.timestamp)}
              </div>
              {newerVersion.createdBy && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {newerVersion.createdBy}
                </div>
              )}
              <div className="text-[#00ff00]/40">{newerVersion.title}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border border-[#00ff00]/20 rounded-lg bg-black p-4">
          <div className="text-sm leading-relaxed font-mono">
            {diff.length === 0 ? (
              <p className="text-[#00ff00]/50">No differences found</p>
            ) : (
              diff.map((item, index) => (
                <span
                  key={index}
                  className={
                    item.type === "added"
                      ? "bg-[#004000] text-[#00ff00]"
                      : item.type === "removed"
                      ? "bg-[#400000] text-[#ff0000] line-through"
                      : "text-[#00ff00]/80"
                  }
                >
                  {item.text}
                </span>
              ))
            )}
          </div>
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
