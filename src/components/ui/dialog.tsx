'use client'

import * as React from 'react'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-all duration-200" />
        <BaseDialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}

function DialogContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative w-full max-w-lg rounded-2xl border-0 bg-white shadow-[0_20px_70px_-40px_rgba(15,23,42,0.5)] ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function DialogHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1.5 px-6 pt-6 pb-4', className)} {...props}>
      {children}
    </div>
  )
}

function DialogTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <BaseDialog.Title
      className={cn('text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50', className)}
      {...props}
    >
      {children}
    </BaseDialog.Title>
  )
}

function DialogDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <BaseDialog.Description
      className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
      {...props}
    >
      {children}
    </BaseDialog.Description>
  )
}

function DialogFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col-reverse gap-3 px-6 pb-6 pt-2 sm:flex-row sm:justify-end', className)} {...props}>
      {children}
    </div>
  )
}

function DialogClose({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <BaseDialog.Close
      className={cn(
        'absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300',
        className
      )}
      {...props}
    >
      {children}
    </BaseDialog.Close>
  )
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose }
