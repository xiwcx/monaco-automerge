// @vitest-environment jsdom

import { afterEach, expect, it, vi } from "vitest";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import * as A from "@automerge/automerge/next";
import { handlePatch } from "./handle-patch";

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

it("handles a slice patch", async () => {
  const model = monaco.editor.createModel("");

  vi.spyOn(model, "applyEdits");
  const slicePatch: A.SpliceTextPatch = {
    action: "splice",
    path: ["text"],
    value: "foo",
  };

  handlePatch({ model, patch: slicePatch });

  expect(vi.mocked(model.applyEdits).mock.calls[0][0].length).toEqual(1);

  vi.mocked(model.applyEdits).mock.calls[0][0].forEach((edit) => {
    expect(edit.range.startLineNumber).toEqual(1);
    expect(edit.range.endLineNumber).toEqual(1);
    expect(edit.range.startColumn).toEqual(1);
    expect(edit.range.endColumn).toEqual(1);
    expect(edit.text).toEqual("foo");
  });
});

it("handles a put patch", async () => {
  const model = monaco.editor.createModel("const foo = 'bar';");

  vi.spyOn(model, "applyEdits");
  const putPatch: A.PutPatch = {
    action: "put",
    path: ["text", 2],
    value: "foo",
  };

  handlePatch({ model, patch: putPatch });

  expect(vi.mocked(model.applyEdits).mock.calls[0][0].length).toEqual(1);

  vi.mocked(model.applyEdits).mock.calls[0][0].forEach((edit) => {
    expect(edit.range.startLineNumber).toEqual(1);
    expect(edit.range.endLineNumber).toEqual(1);
    expect(edit.range.startColumn).toEqual(3);
    expect(edit.range.endColumn).toEqual(3);
    expect(edit.text).toEqual("foo");
  });
});

it("handles a delete patch without length", async () => {
  const model = monaco.editor.createModel("const foo = 'bar';");

  vi.spyOn(model, "applyEdits");
  const deletePatch: A.DelPatch = {
    action: "del",
    path: ["text", 2],
  };

  handlePatch({ model, patch: deletePatch });

  expect(vi.mocked(model.applyEdits).mock.calls[0][0].length).toEqual(1);

  vi.mocked(model.applyEdits).mock.calls[0][0].forEach((edit) => {
    expect(edit.range.startLineNumber).toEqual(1);
    expect(edit.range.endLineNumber).toEqual(1);
    expect(edit.range.startColumn).toEqual(3);
    expect(edit.range.endColumn).toEqual(4);
    expect(edit.text).toEqual("");
  });
});

it("handles a delete patch with length", async () => {
  const model = monaco.editor.createModel("const foo = 'bar';");

  vi.spyOn(model, "applyEdits");
  const deletePatch: A.DelPatch = {
    action: "del",
    path: ["text", 2],
    length: 2,
  };

  handlePatch({ model, patch: deletePatch });

  expect(vi.mocked(model.applyEdits).mock.calls[0][0].length).toEqual(1);

  vi.mocked(model.applyEdits).mock.calls[0][0].forEach((edit) => {
    expect(edit.range.startLineNumber).toEqual(1);
    expect(edit.range.endLineNumber).toEqual(1);
    expect(edit.range.startColumn).toEqual(3);
    expect(edit.range.endColumn).toEqual(5);
    expect(edit.text).toEqual("");
  });
});
