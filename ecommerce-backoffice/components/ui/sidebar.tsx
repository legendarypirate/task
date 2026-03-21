// components/ui/sidebar.tsx
"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "./button";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Sidebar({ open, onClose, children, title, className }: SidebarProps) {
  if (!open) return null;

  return (
    <>
      {/* Transparent overlay - allows interaction with background */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Sidebar */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg border-l z-50 transform transition-transform duration-300",
        "overflow-y-auto",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </>
  );
}