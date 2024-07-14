import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import * as A from "@automerge/automerge/next";

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
