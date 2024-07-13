// @vitest-environment jsdom

import { expect, it } from "vitest";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { handleCursorChange } from "./handle-cursor-change";

/**
 * TODO
 *
 * functionality:
 * - add heartbeats
 *
 * acceptance:
 * - test that cursor exists
 * - test that cursor moves
 */
it("correctly handles cursor change", () => {
  const peerStates = new Map<
    string,
    { color: string; decoration: monaco.editor.IModelDeltaDecoration }
  >();
  const userId = "user1";
  const position = new monaco.Position(1, 1);
  const expectedDecoration = {
    range: new monaco.Range(1, 1, 1, 1),
    options: {
      className: `peer-cursor peer-cursor--yellow`,
    },
  };

  expect(peerStates.get(userId)).toBeUndefined();

  const result = handleCursorChange({
    peerStates,
    position: position,
    userId: userId,
  });

  expect(peerStates.get(userId)).toEqual({
    color: "yellow",
    decoration: expectedDecoration,
  });

  expect(result).toEqual([expectedDecoration]);
});

it("correctly adds a new user", () => {
  const peerStates = new Map<
    string,
    { color: string; decoration: monaco.editor.IModelDeltaDecoration }
  >();
  const userId = "user1";
  const position = new monaco.Position(3, 10);

  expect(peerStates.size).toBe(0);

  handleCursorChange({
    peerStates,
    position: position,
    userId: userId,
  });

  expect(peerStates.size).toBe(1);

  const userId2 = "user2";
  const position2 = new monaco.Position(2, 7);

  handleCursorChange({
    peerStates,
    position: position2,
    userId: userId2,
  });

  expect(peerStates.size).toBe(2);

  expect(peerStates.get(userId2)).toEqual({
    color: "blue",
    decoration: {
      range: new monaco.Range(2, 7, 2, 7),
      options: {
        className: "peer-cursor peer-cursor--blue",
      },
    },
  });
});
