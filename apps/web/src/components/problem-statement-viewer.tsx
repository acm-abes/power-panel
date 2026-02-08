/** @format */

"use client";

interface ProblemStatementViewerProps {
  content: string;
  title: string;
  provider: string;
}

/**
 * Component to safely render problem statement HTML content
 * The content includes Tailwind classes for styling
 */
export function ProblemStatementViewer({
  content,
  title,
  provider,
}: ProblemStatementViewerProps) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: content }}
      suppressHydrationWarning
    />
  );
}
