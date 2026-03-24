"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  children: React.ReactNode;
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, containerRef }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}>({
  isOpen: false,
  setIsOpen: () => {},
  containerRef: { current: null },
});

const DropdownMenuTrigger = React.forwardRef<
  HTMLDivElement,
  { asChild?: boolean; children: React.ReactNode }
>(({ asChild, children }, ref) => {
  const { setIsOpen } = React.useContext(DropdownMenuContext);

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      onClick?: React.MouseEventHandler<HTMLElement>;
    }>;

    return React.cloneElement(child, {
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        child.props.onClick?.(event);
        setIsOpen((prev) => !prev);
      },
    });
  }

  return (
    <div ref={ref} onClick={() => setIsOpen((prev) => !prev)}>
      {children}
    </div>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = ({
  align = "start",
  className,
  children,
}: {
  align?: "start" | "end";
  className?: string;
  children: React.ReactNode;
}) => {
  const { isOpen, setIsOpen, containerRef } =
    React.useContext(DropdownMenuContext);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, setIsOpen, containerRef]);

  if (!isOpen) return null;

  return (
    <div
      role="menu"
      className={cn(
        "absolute z-50 mt-2 w-56 rounded-md border border-slate-200 bg-white p-1 shadow-lg",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
};

const DropdownMenuItem = ({
  variant = "default",
  className,
  onClick,
  onSelect,
  disabled = false,
  children,
}: {
  variant?: "default" | "destructive";
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onSelect?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) => {
  const { setIsOpen } = React.useContext(DropdownMenuContext);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    onClick?.(event);
    onSelect?.();
    setIsOpen(false);
  };

  return (
    <div
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled}
      onClick={handleClick}
      className={cn(
        "relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        disabled && "pointer-events-none opacity-50",
        !disabled &&
          variant === "default" &&
          "cursor-pointer hover:bg-slate-100 focus:bg-slate-100",
        !disabled &&
          variant === "destructive" &&
          "cursor-pointer text-danger-600 hover:bg-danger-50 focus:bg-danger-50",
        className,
      )}
    >
      {children}
    </div>
  );
};

const DropdownMenuSeparator = ({ className }: { className?: string }) => (
  <div className={cn("-mx-1 my-1 h-px bg-slate-200", className)} />
);

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
