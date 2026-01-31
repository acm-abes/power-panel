/** @format */

"use client";

import { useState, KeyboardEvent, ClipboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface EmailTagInputProps {
  emails: string[];
  onAdd: (email: string) => void;
  onRemove: (email: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function EmailTagInput({
  emails,
  onAdd,
  onRemove,
  placeholder = "email@example.com",
  disabled = false,
}: EmailTagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Add email on Space or Enter
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed) {
        onAdd(trimmed);
        setInputValue("");
      }
    }

    // Remove last email on Backspace when input is empty
    if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      onRemove(emails[emails.length - 1]);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");

    // Split by space, comma, or semicolon
    const emailList = pastedText
      .split(/[\s,;]+/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    // Add all valid emails
    emailList.forEach((email) => {
      onAdd(email);
    });

    setInputValue("");
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-background min-h-10.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {emails.map((email, index) => (
        <Badge
          key={`${email}-${index}`}
          variant="secondary"
          className="gap-1 pr-1 pl-2 py-1"
        >
          <span className="text-xs font-mono">{email}</span>
          <button
            type="button"
            onClick={() => onRemove(email)}
            disabled={disabled}
            className="hover:bg-secondary-foreground/20 rounded-sm p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder={emails.length === 0 ? placeholder : ""}
        className="flex-1 min-w-30 outline-none bg-transparent text-sm placeholder:text-muted-foreground"
      />
    </div>
  );
}
