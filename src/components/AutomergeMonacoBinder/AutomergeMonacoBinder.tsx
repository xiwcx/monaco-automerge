import { type AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import * as A from "@automerge/automerge/next";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef } from "react";
import { MyDoc } from "../../utils/shared-data";
import { Editor } from "../Editor";
import "./styles.css";

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
const handlePatch: HandlePatch = ({ model, patch }) => {
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

type AppProps = {
  docUrl: AutomergeUrl;
};

const sortEvents = (
  firstChange: monaco.editor.IModelContentChange,
  secondChange: monaco.editor.IModelContentChange,
): number => secondChange.rangeOffset - firstChange.rangeOffset;

/**
 * The monaco editor cannot be treated as a controlled component
 */
export function AutomergeMonacoBinder({ docUrl }: AppProps) {
  const handle = useHandle<MyDoc>(docUrl);
  /**
   * This value is used to prevent an infinite loop where updates bounce
   * between different users.
   */
  const isUpdatingRef = useRef(false);
  const [, changeDoc] = useDocument<{
    text: string;
  }>(docUrl);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Handle input from automerge
  useEffect(() => {
    if (!handle || !editorRef) return;

    handle.on("change", (e) => {
      const model = editorRef.current?.getModel();

      // do nothing if automerge and editor are in sync, this allows us to
      // distinguish between local and remote changes, only acting
      // on remote changes.
      if (!model || model.getValue() === e.doc.text) return;

      isUpdatingRef.current = true;
      e.patches.forEach((patch) => handlePatch({ model, patch }));
      isUpdatingRef.current = false;
    });

    return () => {
      handle.off("change");
    };
  }, [handle]);

  // Handle output from the editor
  useEffect(() => {
    if (!editorRef.current) return;

    const listener = editorRef.current.onDidChangeModelContent((event) => {
      if (isUpdatingRef.current) return;

      changeDoc((doc) => {
        event.changes.sort(sortEvents).forEach((change) => {
          const { rangeOffset, rangeLength, text } = change;

          A.splice(doc, ["text"], rangeOffset, rangeLength, text);
        });
      });
    });

    return () => {
      listener.dispose();
    };
  }, [changeDoc]);

  return (
    <main>
      <Editor
        divProps={{ className: "editor" }}
        onCreate={(editor) => (editorRef.current = editor)}
      />
    </main>
  );
}
