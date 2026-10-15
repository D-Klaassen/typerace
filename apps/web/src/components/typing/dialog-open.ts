/**
 * Whether a dialog, such as the one confirming a quit, is open over the game.
 * Keystrokes then belong to the dialog, wherever the focus happens to be.
 */
export function isDialogOpen(): boolean {
  return (
    document.querySelector('[role="dialog"], [role="alertdialog"]') !== null
  );
}
