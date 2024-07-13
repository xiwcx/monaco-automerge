// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, Mock } from "vitest";
import { vi } from "vitest";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import {
  AutomergeMonacoBinding,
  handlePatch,
} from "./automerge-monaco-binding";
import * as A from "@automerge/automerge/next";

describe("handlePatch utility", () => {
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
});

describe("AutomergeMonacoBinding class", () => {
  let mockHandle: {
    on: Mock;
    off: Mock;
    docSync: Mock;
  };
  let model: monaco.editor.ITextModel;

  beforeEach(() => {
    model = monaco.editor.createModel("");

    mockHandle = {
      docSync: vi.fn().mockReturnValue({ text: "// comment" }),
      off: vi.fn(),
      on: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("constructor functions as expected", async () => {
    const onDidChangeContentSpy = vi.spyOn(model, "onDidChangeContent");
    const setValueSpy = vi.spyOn(model, "setValue");
    // @ts-expect-error -- mocking in a test environment
    new AutomergeMonacoBinding(mockHandle, model);

    // initial sync
    expect(mockHandle.docSync).toHaveBeenCalledTimes(1);
    expect(setValueSpy).toHaveBeenCalledTimes(1);
    expect(setValueSpy).toHaveBeenCalledWith("// comment");

    // event handlers are set
    expect(mockHandle.on).toHaveBeenCalledTimes(1);
    expect(mockHandle.on).toHaveBeenCalledWith("change", expect.any(Function));
    expect(onDidChangeContentSpy).toHaveBeenCalledTimes(1);
    expect(onDidChangeContentSpy).toHaveBeenCalledWith(expect.any(Function));
  });

  it("destroys functions as expected", async () => {
    const onModelDisposeMock = vi.fn();
    vi.spyOn(model, "onDidChangeContent").mockReturnValue({
      dispose: onModelDisposeMock,
    });
    // @ts-expect-error -- mocking in a test environment
    const binding = new AutomergeMonacoBinding(mockHandle, model);

    binding.destroy();

    expect(mockHandle.off).toHaveBeenCalledTimes(1);
    expect(mockHandle.off).toHaveBeenCalledWith("change");

    expect(onModelDisposeMock).toHaveBeenCalledTimes(1);
  });
});
