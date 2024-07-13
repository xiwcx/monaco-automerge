// @vitest-environment jsdom

import { afterEach, beforeEach, expect, it, Mock, vi } from "vitest";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { AutomergeMonacoBinding } from "./automerge-monaco-binding";

let mockHandle: {
  on: Mock;
  off: Mock;
  docSync: Mock;
};
let model: monaco.editor.ITextModel;
let editor: monaco.editor.IStandaloneCodeEditor;

vi.mock("monaco-editor/esm/vs/editor/editor.api", async (importOriginal) => {
  const monaco =
    await importOriginal<
      typeof import("monaco-editor/esm/vs/editor/editor.api")
    >();
  return {
    ...monaco,
    editor: {
      ...monaco.editor,
      create: vi.fn().mockReturnValue({
        createDecorationsCollection: vi.fn(),
        onDidChangeCursorPosition: vi
          .fn()
          .mockReturnValue({ dispose: vi.fn() }),
      }),
    },
  };
});

beforeEach(() => {
  model = monaco.editor.createModel("");
  editor = monaco.editor.create(document.createElement("div"), {
    model,
  });

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
  const onDidChangeCursorPositionSpy = vi.spyOn(
    editor,
    "onDidChangeCursorPosition",
  );
  const createDecorationsCollectionSpy = vi.spyOn(
    editor,
    "createDecorationsCollection",
  );
  const setValueSpy = vi.spyOn(model, "setValue");
  // @ts-expect-error -- mocking in a test environment
  new AutomergeMonacoBinding(mockHandle, "userId", model, editor);

  // initial sync
  expect(mockHandle.docSync).toHaveBeenCalledTimes(1);
  expect(setValueSpy).toHaveBeenCalledTimes(1);
  expect(setValueSpy).toHaveBeenCalledWith("// comment");

  // decorations collection is created
  expect(createDecorationsCollectionSpy).toHaveBeenCalledTimes(1);

  // event handlers are set
  expect(mockHandle.on).toHaveBeenCalledTimes(2);
  expect(mockHandle.on).toHaveBeenNthCalledWith(
    1,
    "change",
    expect.any(Function),
  );
  expect(mockHandle.on).toHaveBeenNthCalledWith(
    2,
    "ephemeral-message",
    expect.any(Function),
  );
  expect(onDidChangeContentSpy).toHaveBeenCalledTimes(1);
  expect(onDidChangeContentSpy).toHaveBeenCalledWith(expect.any(Function));
  expect(onDidChangeCursorPositionSpy).toHaveBeenCalledTimes(1);
  expect(onDidChangeCursorPositionSpy).toHaveBeenCalledWith(
    expect.any(Function),
  );
});

it("destroys functions as expected", async () => {
  const onModelDisposeMock = vi.fn();
  vi.spyOn(model, "onDidChangeContent").mockReturnValue({
    dispose: onModelDisposeMock,
  });
  const binding = new AutomergeMonacoBinding(
    // @ts-expect-error -- mocking in a test environment
    mockHandle,
    "userId",
    model,
    editor,
  );

  binding.destroy();

  expect(mockHandle.off).toHaveBeenCalledTimes(2);
  expect(mockHandle.off).toHaveBeenNthCalledWith(1, "change");
  expect(mockHandle.off).toHaveBeenNthCalledWith(2, "ephemeral-message");

  expect(onModelDisposeMock).toHaveBeenCalledTimes(1);
});
