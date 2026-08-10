/**
 * Editor command protocol.
 *
 * Every mutation goes through a command so undo/redo (and later multiplayer)
 * share one op format. Commands close over the store's imperative API.
 */

export interface EditorCommand {
  readonly name: string;
  readonly label: string;
  do(): void;
  undo(): void;
}

export class CommandStack {
  private undoStack: EditorCommand[] = [];
  private redoStack: EditorCommand[] = [];
  private listeners = new Set<() => void>();

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoLabel(): string | null {
    return this.undoStack.at(-1)?.label ?? null;
  }

  get redoLabel(): string | null {
    return this.redoStack.at(-1)?.label ?? null;
  }

  execute(command: EditorCommand): void {
    command.do();
    this.undoStack.push(command);
    this.redoStack = [];
    this.emit();
  }

  /**
   * Push a command whose `do()` already ran (e.g. live drag preview).
   * Undo/redo still call undo/do as usual.
   */
  record(command: EditorCommand): void {
    this.undoStack.push(command);
    this.redoStack = [];
    this.emit();
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (!command) return;
    command.undo();
    this.redoStack.push(command);
    this.emit();
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;
    command.do();
    this.undoStack.push(command);
    this.emit();
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.emit();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
