import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const altMatch = shortcut.alt === undefined || shortcut.alt === event.altKey;
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Desktop-specific keyboard shortcuts helper
export const getDefaultShortcuts = (callbacks: {
  onNewEstimate?: () => void;
  onDashboard?: () => void;
  onCustomers?: () => void;
  onWarehouse?: () => void;
  onSettings?: () => void;
  onSearch?: () => void;
  onSave?: () => void;
  onHelp?: () => void;
}): KeyboardShortcut[] => {
  return [
    {
      key: 'n',
      ctrl: true,
      action: callbacks.onNewEstimate || (() => {}),
      description: 'New Estimate'
    },
    {
      key: 'd',
      ctrl: true,
      action: callbacks.onDashboard || (() => {}),
      description: 'Dashboard'
    },
    {
      key: 'c',
      ctrl: true,
      shift: true,
      action: callbacks.onCustomers || (() => {}),
      description: 'Customers'
    },
    {
      key: 'w',
      ctrl: true,
      shift: true,
      action: callbacks.onWarehouse || (() => {}),
      description: 'Warehouse'
    },
    {
      key: ',',
      ctrl: true,
      action: callbacks.onSettings || (() => {}),
      description: 'Settings'
    },
    {
      key: 'k',
      ctrl: true,
      action: callbacks.onSearch || (() => {}),
      description: 'Quick Search'
    },
    {
      key: 's',
      ctrl: true,
      action: callbacks.onSave || (() => {}),
      description: 'Save'
    },
    {
      key: '?',
      shift: true,
      action: callbacks.onHelp || (() => {}),
      description: 'Help & Shortcuts'
    }
  ];
};
