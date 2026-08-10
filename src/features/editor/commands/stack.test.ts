import { describe, expect, it } from "vitest";

import { CommandStack } from "@/features/editor/commands/stack";

describe("CommandStack", () => {
  it("undoes and redoes mutations", () => {
    let value = 0;
    const stack = new CommandStack();

    stack.execute({
      name: "inc",
      label: "Increment",
      do: () => {
        value += 1;
      },
      undo: () => {
        value -= 1;
      },
    });

    expect(value).toBe(1);
    expect(stack.canUndo).toBe(true);
    stack.undo();
    expect(value).toBe(0);
    expect(stack.canRedo).toBe(true);
    stack.redo();
    expect(value).toBe(1);
  });

  it("clears redo when a new command is executed", () => {
    const stack = new CommandStack();
    stack.execute({
      name: "a",
      label: "A",
      do: () => undefined,
      undo: () => undefined,
    });
    stack.undo();
    stack.execute({
      name: "b",
      label: "B",
      do: () => undefined,
      undo: () => undefined,
    });
    expect(stack.canRedo).toBe(false);
  });

  it("record pushes without re-running do (drag commit)", () => {
    let value = 5;
    const stack = new CommandStack();
    stack.record({
      name: "move",
      label: "Move artwork",
      do: () => {
        value = 10;
      },
      undo: () => {
        value = 0;
      },
    });
    expect(value).toBe(5);
    expect(stack.canUndo).toBe(true);
    stack.undo();
    expect(value).toBe(0);
    stack.redo();
    expect(value).toBe(10);
  });
});
