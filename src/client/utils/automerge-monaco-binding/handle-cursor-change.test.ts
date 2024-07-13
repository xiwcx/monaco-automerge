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
 * unit:
 * - add each to cursor change update
 * - test adding users when there are existing users
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

  const result = handleCursorChange({
    peerStates,
    position: position,
    userId: userId,
  });

  expect(result).toEqual([
    {
      range: new monaco.Range(1, 1, 1, 1),
      options: {
        className: `peer-cursor peer-cursor--yellow`,
      },
    },
  ]);
});
