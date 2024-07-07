// @vitest-environment jsdom

import { afterEach, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Editor } from "./Editor";
import { defaultMonacoOptions } from "./data";
import { vi } from "vitest";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

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

it("initializes editor", async () => {
  render(<Editor />);

  expect(monaco.editor.create).toHaveBeenCalledOnce();
});

it("uses default options", async () => {
  render(<Editor />);

  expect(vi.mocked(monaco.editor.create).mock.calls[0][1]).toEqual(
    defaultMonacoOptions,
  );
});

it("prefers passed in options", async () => {
  const options = {
    theme: "vs-light",
  };

  render(<Editor options={options} />);

  expect(vi.mocked(monaco.editor.create).mock.calls[0][1]).toEqual(options);
});
