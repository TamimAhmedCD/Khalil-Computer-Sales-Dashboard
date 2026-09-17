"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * UnifiedSelect - A flexible select component that supports both searchable and non-searchable modes
 *
 * @param {string} value - Selected value
 * @param {function} onChange - Change handler
 * @param {array} items - Array of items (objects with _id/id/name or plain strings)
 * @param {boolean} searchable - Enable search functionality (default: true)
 * @param {boolean} loading - Loading state
 * @param {boolean} disabled - Disabled state
 * @param {boolean} error - Error state
 * @param {string} placeholder - Placeholder text
 * @param {string} searchPlaceholder - Search input placeholder
 * @param {string} emptyMessage - Message when no items found
 * @param {boolean} includeAllOption - Show "All" option (default: false)
 * @param {string} allOptionLabel - Label for "All" option
 * @param {function} displayValue - Custom render function for selected value in dropdown
 * @param {function} displayLabel - Custom render function for selected value in trigger
 * @param {function} renderItem - Custom render function for each item in list
 * @param {string} className - Additional CSS classes
 */
export function UnifiedSelect({
  value,
  onChange,
  items = [],
  searchable = true,
  loading = false,
  disabled = false,
  error,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found",
  includeAllOption = false,
  allOptionLabel = "All",
  displayValue,
  displayLabel,
  renderItem,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure portal only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Find selected item
  const selected = items.find((item) => {
    const itemId = typeof item === 'object' ? item._id || item.id : item;
    return itemId === value;
  });

  // Filter items by search term
  const filtered = search.trim() && searchable
    ? items.filter((item) => {
        if (typeof item === 'string') {
          return item.toLowerCase().includes(search.toLowerCase());
        }
        const searchIn = [
          item.name,
          item.label,
          item.type,
          item.description
        ].filter(Boolean).join(' ').toLowerCase();
        return searchIn.includes(search.toLowerCase());
      })
    : items;

  // Update dropdown position
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  // Open dropdown with fixed positioning
  const handleOpen = () => {
    if (disabled || loading) return;
    updatePosition();
    setOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMounted(true);
      });
    });
  };

  // Close dropdown
  const handleClose = () => {
    setMounted(false);
    setTimeout(() => {
      setOpen(false);
      setSearch("");
    }, 200);
  };

  const handleToggle = () => {
    if (disabled || loading) return;
    if (open) handleClose();
    else handleOpen();
  };

  const handleSelect = (item) => {
    const itemId = typeof item === 'object' ? item._id || item.id : item;
    onChange(itemId);
    handleClose();
  };

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      // Check if click is outside both the trigger container AND the portal dropdown
      const clickInTrigger = containerRef.current?.contains(e.target);
      const clickInDropdown = e.target.closest('[role="listbox"][data-portal="true"]');
      if (!clickInTrigger && !clickInDropdown) {
        handleClose();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  // Default render for trigger label
  const renderTriggerLabel = () => {
    if (selected) {
      if (displayLabel) {
        return displayLabel(selected);
      }
      if (typeof selected === 'object') {
        return (
          <div className="flex items-center gap-2 truncate min-w-0">
            {selected.type && (
              <Badge variant="outline" className="text-[10px] h-4 shrink-0">
                {selected.type}
              </Badge>
            )}
            <span className="truncate">{selected.name || selected.label}</span>
          </div>
        );
      }
      return <span className="truncate">{selected}</span>;
    }
    return (
      <span className="text-muted-foreground truncate">
        {loading ? "Loading..." : placeholder}
      </span>
    );
  };

  // Default render for dropdown item
  const defaultRenderItem = (item) => {
    if (displayValue) {
      return displayValue(item);
    }
    if (typeof item === 'string') {
      return <span className="flex-1 truncate">{item}</span>;
    }
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {item.type && (
            <Badge variant="outline" className="text-[10px] h-4 shrink-0">
              {item.type}
            </Badge>
          )}
          <span className="truncate">{item.name || item.label}</span>
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {item.description}
          </p>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm",
          "ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "hover:bg-accent/40",
          error ? "border-destructive" : "border-input",
          open && "ring-2 ring-ring ring-offset-2",
          (loading || disabled) && "opacity-60 cursor-not-allowed"
        )}
        disabled={loading || disabled}
      >
        {renderTriggerLabel()}
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown panel - portaled to document.body to escape all stacking contexts */}
      {open && isClient && createPortal(
        <div
          role="listbox"
          data-portal="true"
          style={dropdownStyle}
          className={cn(
            "z-[999999] overflow-hidden rounded-md border bg-popover shadow-md ring-1 ring-black/5",
            "transition-all duration-200 ease-out origin-top",
            mounted
              ? "opacity-100 scale-y-100 translate-y-0"
              : "opacity-0 scale-y-95 -translate-y-1"
          )}
        >
          {/* Search input (only if searchable) */}
          {searchable && (
            <div className="sticky top-0 z-10 border-b bg-popover px-2 py-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-sm border border-input bg-background py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* List */}
          <div className="max-h-60 overflow-y-auto overscroll-contain py-1">
            {/* "All" option */}
            {includeAllOption && (
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => {
                  onChange("");
                  handleClose();
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground",
                  !value && "bg-accent/60 font-medium"
                )}
              >
                <span className="flex-1 truncate">{allOptionLabel}</span>
                {!value && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            )}

            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filtered.map((item) => {
                const itemId = typeof item === 'object' ? item._id || item.id : item;
                const isSelected = itemId === value;
                return (
                  <button
                    key={itemId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent/60 font-medium"
                    )}
                  >
                    {renderItem ? renderItem(item) : defaultRenderItem(item)}
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}