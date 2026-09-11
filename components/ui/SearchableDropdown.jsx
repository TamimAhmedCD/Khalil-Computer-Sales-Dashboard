"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchableDropdown({
  value,
  onChange,
  items = [],
  loading = false,
  disabled = false,
  displayValue,
  displayLabel,
  error,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found",
  icon: Icon,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const selected = items.find((i) => String(i.id || i._id) === String(value));

  // Filter items by search term
  const filtered = search.trim()
    ? items.filter((item) =>
        (item.name || "").toLowerCase().includes(search.toLowerCase())
      )
    : items;

  // Open → trigger animation
  const handleOpen = () => {
    if (disabled || loading) return;
    setOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMounted(true);
      });
    });
  };

  // Close → animate out first, then remove from DOM
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
    onChange(String(item.id || item._id));
    handleClose();
  };

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
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

  return (
    <div ref={containerRef} className="relative w-full text-left">
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent/40",
          error ? "border-destructive" : "border-input",
          open && "ring-2 ring-ring ring-offset-2",
          (loading || disabled) && "opacity-60 cursor-not-allowed"
        )}
        disabled={loading || disabled}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
          {selected ? (
            <span className="truncate">
              {displayLabel ? displayLabel(selected) : selected.name}
            </span>
          ) : (
            <span className="text-muted-foreground truncate">
              {loading ? "Loading..." : placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown panel - Using React Portal to body */}
      {open && (
        <div
          role="listbox"
          className={cn(
            "fixed z-[9999] mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md ring-1 ring-black/5",
            "transition-all duration-200 ease-out origin-top",
            mounted
              ? "opacity-100 scale-y-100 translate-y-0"
              : "opacity-0 scale-y-95 -translate-y-1"
          )}
          style={{
            top: containerRef.current?.getBoundingClientRect().bottom + 4,
            left: containerRef.current?.getBoundingClientRect().left,
            width: containerRef.current?.getBoundingClientRect().width,
          }}
        >
          {/* Search input */}
          <div className="sticky top-0 z-10 border-b bg-popover px-2 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-sm border border-input bg-background py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filtered.map((item) => {
                const itemId = String(item.id || item._id);
                const isSelected = itemId === String(value);
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
                    {displayValue ? (
                      displayValue(item)
                    ) : (
                      <span className="flex-1 truncate">{item.name}</span>
                    )}
                    {isSelected && (
                      <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
