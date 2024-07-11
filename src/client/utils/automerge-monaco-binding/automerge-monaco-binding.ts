import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import * as A from "@automerge/automerge/next";
import type { DocHandle } from "@automerge/automerge-repo";
import { MyDoc } from "../shared-data";

type AutomergeDeleteOrInsertPath = [string, number];
/**
 * Automerge's `Prop` type is an indescriminate union of string and number, so we
 * need to provide a type guard to treat it as a proper tuple.
 */
const isDeleteOrInsertPath = (
  props: A.Prop[],
): props is AutomergeDeleteOrInsertPath => {
  const [, secondProp] = props;

  return typeof secondProp === "number";
};

const isPutOrSplicePatch = (
  patch: A.Patch,
): patch is A.SpliceTextPatch | A.PutPatch => {
  return ["put", "splice"].includes(patch.action);
};

type GetIndexFromPath = (path: A.Prop[]) => number;
/**
 * Automerge has length as an optional property in the path tuple, so we need
 * to provide a fallback.
 */
const getIndexFromPath: GetIndexFromPath = (path) =>
  isDeleteOrInsertPath(path) ? path[1] : 0;

type GetMonacoSelection = (args: {
  start: number;
  end: number;
  model: monaco.editor.ITextModel;
}) => monaco.Selection;
const getMonacoSelection: GetMonacoSelection = ({ start, end, model }) => {
  const startPosition = model.getPositionAt(start);
  const endPosition = model.getPositionAt(end);

  return new monaco.Selection(
    startPosition.lineNumber,
    startPosition.column,
    endPosition.lineNumber,
    endPosition.column,
  );
};

type HandlePatch = (args: {
  model: monaco.editor.ITextModel;
  patch: A.Patch;
}) => void;
export const handlePatch: HandlePatch = ({ model, patch }) => {
  if (isPutOrSplicePatch(patch)) {
    const index = getIndexFromPath(patch.path);

    model.applyEdits([
      {
        range: getMonacoSelection({
          start: index,
          end: index,
          model,
        }),
        text: String(patch.value),
      },
    ]);
  } else if (patch.action === "del") {
    const { path, length = 1 } = patch;
    const index = getIndexFromPath(path);

    model.applyEdits([
      {
        range: getMonacoSelection({
          start: index,
          end: index + length,
          model,
        }),
        text: "",
      },
    ]);
  } else {
    throw new Error(`Unsupported patch action: ${patch.action}`);
  }
};

const sortEvents = (
  firstChange: monaco.editor.IModelContentChange,
  secondChange: monaco.editor.IModelContentChange,
): number => secondChange.rangeOffset - firstChange.rangeOffset;

export class AutomergeMonacoBinding {
  #handle: DocHandle<MyDoc>;
  #monacoModel: monaco.editor.ITextModel;
  #editor: monaco.editor.IStandaloneCodeEditor;
  #modelChangeListener: monaco.IDisposable;
  #editorDisposeListener: monaco.IDisposable;
  /**
   * initial value while document is syncing
   */
  #isUpdating = true;

  #initialSync() {
    const doc = this.#handle.docSync();

    if (doc) {
      this.#monacoModel.setValue(doc.text);
    }

    this.#isUpdating = false;
  }

  constructor(
    handle: DocHandle<MyDoc>,
    monacoModel: monaco.editor.ITextModel,
    editor: monaco.editor.IStandaloneCodeEditor,
  ) {
    this.#handle = handle;
    this.#monacoModel = monacoModel;
    this.#editor = editor;

    this.#initialSync();

    this.#handle.on("change", (e) => {
      const isNotInSync = this.#monacoModel.getValue() !== e.doc.text;

      if (isNotInSync) {
        this.#isUpdating = true;
        e.patches.forEach((patch) =>
          handlePatch({ model: this.#monacoModel, patch }),
        );
        this.#isUpdating = false;
      }
    });

    this.#modelChangeListener = this.#monacoModel.onDidChangeContent((e) => {
      if (!this.#isUpdating) {
        this.#handle.change((doc) => {
          e.changes.sort(sortEvents).forEach((change) => {
            const { rangeOffset, rangeLength, text } = change;

            A.splice(doc, ["text"], rangeOffset, rangeLength, text);
          });
        });
      }
    });

    this.#editorDisposeListener = this.#editor.onDidDispose(() => {
      this.destroy();
    });
  }

  destroy() {
    this.#handle.off("change");
    this.#modelChangeListener.dispose();
    this.#editorDisposeListener.dispose();
  }
}
