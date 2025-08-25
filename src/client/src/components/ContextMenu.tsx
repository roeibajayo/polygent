import { ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
  isVisible: boolean;
}

export default function ContextMenu({
  items,
  position,
  onClose,
  isVisible
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const menuElement = menuRef.current;

      // Check if click is outside both main menu and submenu
      const isOutsideMenu = menuElement && !menuElement.contains(target);

      // Find submenu element
      const submenuElement = document.querySelector(
        '[data-submenu="true"]'
      ) as HTMLElement;
      const isOutsideSubmenu =
        !submenuElement || !submenuElement.contains(target);

      if (isOutsideMenu && isOutsideSubmenu) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    } else {
      // Reset submenu state when menu is closed
      setOpenSubmenu(null);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  useEffect(() => {
    if (isVisible && menuRef.current) {
      // Adjust position if menu would go outside viewport
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (position.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [isVisible, position]);

  if (!isVisible) return null;

  const handleItemClick = (item: ContextMenuItem, event?: React.MouseEvent) => {
    if (item.disabled) return;

    if (item.submenu) {
      // Handle submenu toggle
      if (openSubmenu === item.id) {
        setOpenSubmenu(null);
      } else {
        setOpenSubmenu(item.id);
        if (event) {
          const rect = (
            event.currentTarget as HTMLElement
          ).getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          // Default position to the right of the menu item
          let x = rect.right;
          let y = rect.top;

          // If submenu would overflow right edge, position it to the left
          if (x + 200 > viewportWidth) {
            // Assume submenu width ~200px
            x = rect.left - 200;
          }

          // If submenu would overflow bottom, adjust upward
          if (y + 150 > viewportHeight) {
            // Assume submenu height ~150px
            y = Math.max(10, viewportHeight - 150);
          }

          setSubmenuPosition({ x, y });
        }
      }
    } else {
      // Handle regular item click
      item.onClick?.();
      onClose();
    }
  };

  const handleSubmenuItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick?.();
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-md shadow-lg py-1 min-w-48"
      style={{ left: position.x, top: position.y }}>
      {items.map((item, index) => (
        <div key={`${item.id}-${index}`}>
          {item.separator ? (
            <div className="border-t border-neutral-200 dark:border-neutral-600 my-1" />
          ) : (
            <button
              className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-2 ${
                item.disabled
                  ? 'text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                  : openSubmenu === item.id
                    ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                    : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
              onClick={(e) => handleItemClick(item, e)}
              onMouseEnter={(e) => {
                if (item.submenu && !item.disabled) {
                  handleItemClick(item, e);
                }
              }}
              disabled={item.disabled}>
              <span className="flex-1">{item.label}</span>
              {item.submenu && (
                <span className="flex-shrink-0">
                  <ChevronRight size={12} />
                </span>
              )}
            </button>
          )}
        </div>
      ))}

      {/* Render submenu */}
      {openSubmenu &&
        (() => {
          const submenuItem = items.find((item) => item.id === openSubmenu);
          if (!submenuItem?.submenu) return null;

          return (
            <div
              data-submenu="true"
              className="fixed z-60 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-md shadow-lg py-1 min-w-36"
              style={{ left: submenuPosition.x, top: submenuPosition.y }}>
              {submenuItem.submenu.map((subItem, index) => (
                <div key={`${subItem.id}-${index}`}>
                  {subItem.separator ? (
                    <div className="border-t border-neutral-200 dark:border-neutral-600 my-1" />
                  ) : (
                    <button
                      className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-2 ${
                        subItem.disabled
                          ? 'text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                          : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                      onClick={() => handleSubmenuItemClick(subItem)}
                      disabled={subItem.disabled}>
                      <span className="flex-1">{subItem.label}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
    </div>
  );
}
