"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  );
}

type SheetSide = "responsive" | "right" | "bottom";

const SIDE_CLASSES: Record<SheetSide, string> = {
  responsive:
    "max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[88dvh] max-md:rounded-t-3xl max-md:border-t max-md:data-open:slide-in-from-bottom max-md:data-closed:slide-out-to-bottom md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-full md:max-w-[460px] md:rounded-l-3xl md:border-l md:data-open:slide-in-from-right md:data-closed:slide-out-to-right",
  right:
    "inset-y-0 right-0 left-auto h-full w-full max-w-[460px] rounded-l-3xl border-l data-open:slide-in-from-right data-closed:slide-out-to-right",
  bottom:
    "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl border-t data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
};

function SheetContent({
  className,
  children,
  side = "responsive",
  showCloseButton = true,
  style,
  ...props
}: DialogPrimitive.Popup.Props & {
  side?: SheetSide;
  showCloseButton?: boolean;
}) {
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState(0);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null) return;
    const currentY = e.touches[0]?.clientY ?? touchStartYRef.current;
    const delta = Math.max(0, currentY - touchStartYRef.current);
    setDragOffset(delta);
  };

  const handleTouchEnd = () => {
    if (dragOffset > 70) {
      setDragOffset(0);
      touchStartYRef.current = null;
      closeButtonRef.current?.click();
      return;
    }
    setDragOffset(0);
    touchStartYRef.current = null;
  };

  const showHandle = side === "responsive" || side === "bottom";

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        style={
          dragOffset > 0
            ? {
                ...style,
                transform: `translateY(${dragOffset}px)`,
                transition: "none",
              }
            : style
        }
        className={cn(
          "fixed z-[70] flex flex-col overflow-hidden bg-popover/95 backdrop-blur-xl text-popover-foreground border-border/80 shadow-2xl outline-none duration-300 data-open:animate-in data-closed:animate-out",
          SIDE_CLASSES[side],
          className
        )}
        {...props}
      >
        {showHandle && (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={cn(
              "w-full pt-2.5 pb-1 flex justify-center shrink-0 touch-none cursor-grab active:cursor-grabbing",
              side === "responsive" ? "md:hidden" : ""
            )}
            aria-hidden="true"
          >
            <div className="h-1.5 w-11 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        {children}

        {showCloseButton && (
          <DialogPrimitive.Close
            ref={closeButtonRef}
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fechar"
                className="absolute top-3 right-3 z-20 size-8 rounded-full bg-background/60 hover:bg-accent text-foreground/80 hover:text-foreground border border-border/60 backdrop-blur-md cursor-pointer touch-manipulation"
              />
            }
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-lg font-bold tracking-tight text-foreground leading-snug",
        className
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-xs text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
