"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "./button";
export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, action = "Delete session" }: {
  open: boolean; onOpenChange: (value: boolean) => void; title: string; description: string; onConfirm: () => void; action?: string;
}) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal>
    <Dialog.Overlay className="dialog-overlay" />
    <Dialog.Content className="dialog-content">
      <Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description>
      <Dialog.Close className="dialog-close" aria-label="Close confirmation"><X size={18} /></Dialog.Close>
      <div className="dialog-actions"><Dialog.Close asChild><Button variant="outline">Cancel</Button></Dialog.Close><Button variant="destructive" onClick={onConfirm}>{action}</Button></div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
