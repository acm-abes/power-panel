/** @format */

"use client";

import { useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Paperclip, Image } from "lucide-react";
import { toast } from "sonner";

interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
  cid: string;
}

interface AttachmentUploadProps {
  attachments: EmailAttachment[];
  onAdd: (attachment: EmailAttachment) => void;
  onRemove: (cid: string) => void;
  disabled?: boolean;
}

export function AttachmentUpload({
  attachments,
  onAdd,
  onRemove,
  disabled = false,
}: AttachmentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 10MB.`);
        continue;
      }

      try {
        // Read file as base64
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/png;base64,")
          const content = base64.split(",")[1];

          // Generate a unique CID for the attachment
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(7);
          const cid = `attachment_${timestamp}_${random}`;

          onAdd({
            filename: file.name,
            content,
            contentType: file.type,
            cid,
          });

          toast.success(`Added ${file.name}. CID: ${cid}`);
        };

        reader.onerror = () => {
          toast.error(`Failed to read ${file.name}`);
        };

        reader.readAsDataURL(file);
      } catch (error) {
        toast.error(`Failed to process ${file.name}`);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileSizeFromBase64 = (base64: string) => {
    // Approximate size: base64 is roughly 4/3 the size of original
    return Math.round((base64.length * 3) / 4);
  };

  const isImage = (contentType: string) => {
    return contentType.startsWith("image/");
  };

  return (
    <div className="space-y-3">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="w-4 h-4" />
          Add Attachments
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          Max 10MB per file. Supports images, PDF, Word docs
        </p>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.cid}
              className="flex items-start gap-2 p-3 bg-muted rounded-lg border"
            >
              <div className="shrink-0 mt-0.5">
                {isImage(att.contentType) ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <Image className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium truncate">{att.filename}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-mono">
                    cid:{att.cid}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(getFileSizeFromBase64(att.content))}
                  </span>
                </div>
                {isImage(att.contentType) && (
                  <p className="text-xs text-muted-foreground">
                    Use in HTML:{" "}
                    <code className="bg-background px-1 py-0.5 rounded">
                      {`<img src="cid:${att.cid}" />`}
                    </code>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(att.cid)}
                disabled={disabled}
                className="shrink-0 hover:bg-background p-1 rounded-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
