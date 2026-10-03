# Compact navigation FABs

## Goal

Keep the Start chat, Archived, and Spam & blocked navigation controls visible
within the Google Messages sidebar without horizontal overflow, and expose
assigned Chrome shortcuts as compact visual badges.

## Layout

The extension-owned FAB row contains the native Start chat control plus injected
Archived and Spam & blocked controls. It remains a single horizontal row that
uses the sidebar's available width. All three controls use compact padding,
font sizing, and gaps so their labels remain visible without overflowing.

Each control is a positioned badge host. When Chrome reports an assigned
shortcut for its command, the control renders a small, non-interactive
shortcut badge at its top-right corner. The native Start chat button receives
the same treatment. A command without an assigned shortcut renders no badge.

## Icons

The three controls use distinct icons:

- Start chat keeps its native chat icon.
- Archived keeps the archive icon.
- Spam & blocked uses a shield icon, replacing the current duplicate archive
  icon.

## Accessibility and behavior

The controls keep their accessible names and existing mouse and keyboard
activation behavior. Shortcut badges are decorative because the accessible name
already includes the control purpose, and the assigned keyboard shortcut
remains configurable through Chrome.

## Implementation and testing

The navigation FAB module will load shortcut labels once and keep badge state
in sync with the rendered controls. Tests will cover compact-row styling
injection, badge presence for assigned shortcuts, badge omission for
unassigned shortcuts, and the distinct Spam & blocked icon. Existing FAB
activation and teardown coverage remains intact.
