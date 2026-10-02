# Phase 2 live validation guide

Manual checklist for page-local navigation. Work top to bottom. Check each box before moving on.

Record your final results in [compatibility-matrix.md](./compatibility-matrix.md) under scenario **`phase2-navigation`**.

**Use a test account only.** Do not commit personal names, phone numbers, or message text.

Step 3 uses the **compose field** only for the editable-target guard.

---

## macOS shortcut key (read this first)

On Mac keyboards, every **`Alt+…`** shortcut in this guide means **`Option+…`**.

| This guide says | Press on Mac |
| --------------- | ------------ |
| `Alt+ArrowDown` | **Option** + Down Arrow |
| `Alt+ArrowUp` | **Option** + Up Arrow |
| `Alt+Enter` | **Option** + Enter |
| `Alt+[` | **Option** + `[` |
| `Alt+U` | **Option** + U |
| `Alt+Shift+U` | **Option** + Shift + U |
| `Alt+M` | **Option** + M |
| `Ctrl+Shift+P` | **Command** + Shift + P |

Windows/Linux: use **Alt** and **Ctrl** instead of Option and Command.

---

## Where to press shortcuts (Steps 4–9)

Unless a step says otherwise:

1. Stay on `https://messages.google.com/web/`.
2. You should see the **conversation list on the left** (inbox).
3. **Click once** on a conversation row in that list (not the message compose box on the right).
4. Then press the shortcut.

When you first load the inbox list view (`/web/conversations` with no conversation open), the extension should focus the **first loaded row**, show shortcut pills on that row, and leave the right pane empty until you press **Option+Enter** or click a row.

If no row looks focused after a refresh, wait about one second for the list to finish rendering, then reload the extension and refresh the tab once before continuing.

---

## Setup (do once)

- [ ] Run `npm run build` in the repo.
- [ ] Open `chrome://extensions` and click **Reload** on Messages Shortcut Actions.
- [ ] Open `https://messages.google.com/web/` and confirm the conversation list loads.
- [ ] Confirm the extension popup does **not** have **Pause shortcut actions and pills** checked.
- [ ] Confirm your inbox shows at least **3 conversations** and **1 unread** row.

---

## Step 1: Write down your session info

- [ ] Browser version (example: `Chrome 154.0.0.0`)
- [ ] Extension version (example: `1.13.0`)
- [ ] Locale (example: `en`)

---

## Step 2: Run the capability self-test

1. Open the **Google Messages tab** (not the extension popup).
2. Open DevTools → **Console**.
3. Paste this **entire line** and press Enter:

   ```javascript
   await globalThis.MessagesShortcuts.runCapabilitySelfTest()
   ```

   **Wrong:** `runCapabilitySelfTest()` alone (that causes `ReferenceError`).

4. Expand the returned object in the console.

- [ ] **Pass:** `ok` is `true`
- [ ] **Pass:** `mutated` is `false`
- [ ] **Pass:** No capability is marked `unsafe`

**If `MessagesShortcuts is not defined`:** reload the extension at `chrome://extensions`, refresh the Google Messages tab, try again.

---

## Step 3: Confirm shortcuts do not fire when they should not

### 3a. While typing in the compose field

1. Open any conversation (click a row).
2. Click the **Type a message** / compose box on the right.
3. Type a few letters (example: `test`).
4. Press **Option+ArrowDown** once.
5. Press **Command+Shift+P** once.

**You should see:**

- [ ] Your typed letters stay in the compose box
- [ ] The conversation list does not jump
- [ ] No navigation toast appears
- [ ] The command palette (Step 7) does **not** open
- [ ] **Shift+/** may still type **`?`** in compose; that is expected. The shortcut help overlay should **not** open
- [ ] **Command+Shift+P** may still open Google Messages **Select photos** in compose. That native collision is expected; record it in Step 9

### 3b. While a native dialog is open

1. Open any native Google Messages dialog (Archived modal, Move to trash confirm, or block dialog).
2. Press **Option+ArrowDown** once.
3. Press **Command+Shift+P** once.

**You should see:**

- [ ] The dialog stays open
- [ ] The list does not move and the palette does not open

Close the dialog before continuing.

### 3c. While the extension is paused

1. Extension popup → check **Pause shortcut actions and pills**.
2. On Google Messages, click the conversation list, then press **Option+ArrowDown** once.
3. Press **Shift+/** once.

**You should see:**

- [ ] Nothing happens (no toast, no overlays)

Uncheck pause before continuing.

---

## Step 4: Move through the conversation list

1. Click the **conversation list** on the left (inbox view).
2. Press **Option+ArrowDown** once.

   - [ ] **Pass:** The target row shows a **blue outline** (extension list cursor). The message pane does **not** open yet.

3. Press **Option+ArrowUp** once.

   - [ ] **Pass:** Focus moves back.

4. Press **Option+ArrowUp** until you are on the **first** row, then **Option+ArrowUp** once more.

   - [ ] **Pass:** Error toast. You stay on the first row.

5. Press **Option+ArrowDown** until you are on the **last visible** row, then **Option+ArrowDown** once more.

   - [ ] **Pass:** Error toast. You stay on the last row.

6. Press **Option+Enter** once.

   - [ ] **Pass:** That conversation opens in the message pane.

7. Press **Escape** once.

   - [ ] **Pass:** Focus moves back to the **list side** (list container or a list row). It is OK if Google Messages scrolls the list or lands on the first row; the pass condition is that focus is no longer stuck in the message/compose area.

---

## Step 5: Move through unread conversations

Need **2+ unread rows** visible. Scroll the list if needed.

1. Click the conversation list (inbox).
2. Press **Option+U** once → focus jumps to an unread row.
3. Press **Option+U** again → next unread row.
4. Press **Option+Shift+U** once → previous unread row.
5. Press **Option+U** until you hit the last loaded unread, then **Option+U** once more.

   - [ ] **Pass:** Error toast about loaded unread rows
   - [ ] **Pass:** Full list still visible (not filtered)

6. Scroll to load more rows, repeat 2–5 once.

---

## Step 6: Return to the previous conversation

Return navigation keeps an in-memory stack of conversations you opened with **Option+Enter**. Moving the list cursor with **Option+ArrowDown/Up** alone does **not** add to that stack.

You need **two extension-opens** before **Option+[** can go back:

1. **Option+Enter** on conversation **A**
2. **Option+Enter** on a different conversation **B**
3. **Option+[** returns to **A**

Pick conversation **A** and a different row **B**.

**Happy path:**

1. Focus **A** with **Option+ArrowDown/Up**.
2. **Option+Enter** to open **A**.

   - [ ] **Pass:** **A** opens in the message pane.

3. **Option+ArrowDown** (or **Option+ArrowUp**) to focus **B** in the list.

   - [ ] **Pass:** List cursor moves to **B**. The pane may still show **A** until step 4.

4. **Option+Enter** to open **B**.

   - [ ] **Pass:** **B** opens in the message pane.

5. **Option+[** once.

   - [ ] **Pass:** Success toast: **"Returned to the previous conversation."**
   - [ ] **Pass:** **A** opens again.

**Optional console checks** (paste [phase2-live-validation-console.js](../../output/phase2-live-validation-console.js) first):

```javascript
Phase2ValidationHelpers.conversationPaneSnapshot() // after steps 2, 4, and 5
Phase2ValidationHelpers.readToast() // immediately after step 5
```

### No history

1. Refresh tab → open one conversation with **Option+Enter** only → **Option+[** once.

- [x] **Pass:** Info toast: **"No previous extension-opened conversation is available to return to."**
- [x] **Pass:** The same conversation stays open.

### Row scrolled away

1. Open **A** with **Option+Enter**.
2. Focus **B** and open **B** with **Option+Enter**.
3. Scroll the list until **A** is no longer in the loaded rows.
4. **Option+[** once.

- [x] **Pass:** Info toast: **"The previous conversation is not uniquely available in the loaded list."**
- [x] **Pass:** **A** does not open.

---

## Step 7: Command palette

The **command palette** is an extension popup panel: a white box over the page with a filter field and a list of **extension commands** (not your conversations).

1. Click the conversation list.
2. Press **Command+Shift+P**.

   - [ ] **Pass:** White modal appears; cursor is in the filter field.

3. Type `unread`.

   - [ ] **Pass:** List shows only unread-related **commands**
   - [ ] **Pass:** No conversation names in the list

4. **ArrowDown** twice, **ArrowUp** once → highlight moves.

5. **Escape** → palette closes, focus returns.

---

## Step 8: Shortcut help overlay

1. Click the conversation list.
2. **Shift+/** → overlay lists shortcuts.
3. **Tab** / **Shift+Tab** → focus stays inside overlay.
4. **Escape** → overlay closes.

---

## Step 9: Check for shortcut collisions

**Where:** inbox view, conversation list focused (click a list row first), compose box **not** focused.

Press each shortcut **once**. Write **works**, **collision**, or **nothing**:

- [ ] **Option+ArrowDown**
- [ ] **Option+ArrowUp**
- [ ] **Option+Enter**
- [ ] **Option+[**
- [ ] **Option+U**
- [ ] **Option+Shift+U**
- [ ] **Escape** (with a conversation open on the right)
- [ ] **Command+Shift+P**
- [ ] **Shift+/**
- [ ] **Option+M** (expect **unavailable** toast in 1.13.0)

---

## Step 10: Composer discovery probe

**What it is:** a one-time script you paste in the console. It prints JSON about compose-box selectors. It does **not** focus the composer or send messages.

**Where to find it:**

```text
/Users/ravidor/personal-dev/google-messages-shortcuts/output/composer-discovery-console.js
```

In Cursor: open that file from the repo → Select All → Copy.

**How to run:**

1. Open any conversation (compose box visible on the right).
2. DevTools → Console on the Google Messages tab.
3. Paste the **entire file** → Enter.
4. Copy the JSON printed below.

- [ ] **Pass:** `selfTest.mutated` is `false`
- [ ] **Pass:** `editorCandidates` shows `matchCount` values
- [ ] **Pass:** No message was sent

---

## Step 11: Save your results

Add one row to [compatibility-matrix.md](./compatibility-matrix.md):

| Date | Browser | Extension | Locale | Direction | Scenario | Capability self-test | Notes |
| ---- | ------- | --------- | ------ | --------- | -------- | -------------------- | ----- |
| 2026-10-02 | Chrome 154.0.0.0 | 1.13.0 | en | LTR | phase2-navigation | pass | _(your summary)_ |

---

## You are done when

- [ ] All checkboxes above are checked
- [ ] Collisions or failures noted in the matrix
- [ ] Composer focus **not** approved unless you separately verified draft preservation
