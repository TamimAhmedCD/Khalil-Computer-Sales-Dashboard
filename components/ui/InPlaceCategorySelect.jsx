"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * InPlaceCategorySelect — portaled dropdown for use inside dialogs / modals.
 * Uses createPortal so it is never clipped by overflow:hidden ancestors.
 */
export function InPlaceCategorySelect({
  value,
  onChange,
  categories = [],
  loading = false,
  disabled = false,
  error,
  placeholder = "Select category...",
  searchPlaceholder = "Search categories...",
  emptyMessage = "No categories found",
  includeAllCategories = false,
  allCategoriesLabel = "All Categories",
  className,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [isClient, setIsClient] = useState(false);

  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  // SSR guard
  useEffect(() => {
    setIsClient(true);
  }, []);

  const selected = categories.find((c) => {
    const id = typeof c === "object" ? c._id || c.id : c;
    return id === value;
  });

  const filtered = search.trim()
    ? categories.filter((c) => {
        if (typeof c === "string") {
          return c.toLowerCase().includes(search.toLowerCase());
        }
        return (
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.type && c.type.toLowerCase().includes(search.toLowerCase()))
        );
      })
    : categories;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
      pointerEvents: "auto",
    });
  }, []);

  const handleOpen = () => {
    if (disabled || loading) return;
    updatePosition();
    setOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
  };

  const handleClose = useCallback(() => {
    setMounted(false);
    setTimeout(() => {
      setOpen(false);
      setSearch("");
    }, 180);
  }, []);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (disabled || loading) return;
    if (open) handleClose();
    else handleOpen();
  };

  const handleSelect = (category) => {
    const id =
      typeof category === "object" ? category._id || category.id : category;
    onChange(id);
    handleClose();
  };

  // Click-outside detection
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      // Check if the click is inside the button or dropdown
      const inButton = buttonRef.current?.contains(e.target);
      const inDropdown = e.target.closest("[data-category-select-portal]");

      // If clicking on the button or inside the dropdown, don't close
      if (inButton || inDropdown) {
        return;
      }

      // Check if click is on the dialog content itself (to prevent dropdown closing)
      // Dialog content has specific data attributes we can check
      const dialogContent = e.target.closest("[data-slot='dialog-content'], [data-slot='alert-dialog-content']");

      // If clicking inside a dialog content area, don't close dropdown
      // This allows users to click other inputs in the form without closing the category select
      if (dialogContent) {
        return;
      }

      // Only close if clicking outside everything (button, dropdown, and dialog)
      handleClose();
    };

    // Use a small delay to ensure button click handlers run first
    const timeoutId = setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, handleClose]);

  // Reposition on scroll / resize
  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

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
        <div className="flex items-center gap-2 truncate min-w-0">
          {selected ? (
            <>
              {typeof selected === "object" && selected.type && (
                <Badge variant="outline" className="text-[10px] h-4 shrink-0">
                  {selected.type}
                </Badge>
              )}
              <span className="truncate">
                {typeof selected === "object"
                  ? selected.name || selected.label
                  : selected}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground truncate flex items-center gap-2">
              <Tag className="h-3 w-3" />
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

      {/* Portaled dropdown */}
      {open &&
        isClient &&
        createPortal(
          <div
            data-category-select-portal
            role="listbox"
            style={dropdownStyle}
            className={cn(
              "overflow-hidden rounded-md border bg-popover shadow-lg ring-1 ring-black/10",
              "transition-all duration-180 ease-out origin-top",
              mounted
                ? "opacity-100 scale-y-100 translate-y-0"
                : "opacity-0 scale-y-95 -translate-y-1"
            )}
          >
            {/* Search */}
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
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto overscroll-contain py-1">
              {includeAllCategories && (
                <button
                  type="button"
                  role="option"
                  aria-selected={!value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                    handleClose();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground",
                    !value && "bg-accent/60 font-medium"
                  )}
                >
                  <span className="flex-1 truncate">{allCategoriesLabel}</span>
                  {!value && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              )}

              {filtered.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                filtered.map((category) => {
                  const categoryId =
                    typeof category === "object"
                      ? category._id || category.id
                      : category;
                  const categoryName =
                    typeof category === "object"
                      ? category.name || category.label
                      : category;
                  const isSelected = categoryId === value;
                  return (
                    <button
                      key={categoryId}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(category);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent/60 font-medium"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {typeof category === "object" && category.type && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4 shrink-0"
                            >
                              {category.type}
                            </Badge>
                          )}
                          <span className="truncate">{categoryName}</span>
                        </div>
                        {typeof category === "object" &&
                          category.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {category.description}
                            </p>
                          )}
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      )}
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
