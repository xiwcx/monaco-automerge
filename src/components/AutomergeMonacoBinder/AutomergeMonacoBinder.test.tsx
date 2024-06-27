// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { handlePatch } from "./utils";
import * as A from "@automerge/automerge/next";

vi.mock("monaco-editor/esm/vs/editor/editor.api", async (importOriginal) => {
  const monaco =
    await importOriginal<
      typeof import("monaco-editor/esm/vs/editor/editor.api")
    >();
  return {
    ...monaco,
    editor: { ...monaco.editor, create: vi.fn() },
  };
});

afterEach(() => {
  vi.mocked(monaco.editor.create).mockClear();
});

describe("handlePatch utility", () => {
  it("handles a slice patch", async () => {
    const model = monaco.editor.createModel("const foo = 'bar';");

    vi.spyOn(model, "applyEdits");
    const slicePatch: A.SpliceTextPatch = {
      action: "splice",
      path: ["text", 2],
      value: "foo",
    };

    handlePatch({ model, patch: slicePatch });

    expect(vi.mocked(model.applyEdits).mock.calls[0][0].length).toEqual(1);

    vi.mocked(model.applyEdits).mock.calls[0][0].forEach((edit) => {
      expect(edit.range.startLineNumber).toEqual(1);
      expect(edit.range.endLineNumber).toEqual(1);
      expect(edit.range.startColumn).toEqual(3);
      expect(edit.range.endColumn).toEqual(3);
      expect(edit.text).toEqual("foo");
    });
  });
});
