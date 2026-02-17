/** @format */

"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function DownloadAllButton() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      toast.info("Preparing download... This may take a few minutes.");

      const response = await fetch("/api/admin/download-submissions");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to download submissions");
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all-submissions-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Downloaded all submissions successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to download submissions",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      variant="outline"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isDownloading ? "Downloading..." : "Download All Submissions"}
    </Button>
  );
}
