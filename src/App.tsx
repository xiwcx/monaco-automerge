import { Editor } from "./components/Editor";
import "./App.css";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { type AutomergeUrl } from "@automerge/automerge-repo";
import * as A from "@automerge/automerge/next";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef } from "react";

type BetterProp = [string, number];

/**
 * make this real
 */
const isBetterProp = (prop: any): prop is BetterProp => true;

type AppProps = {
  docUrl: AutomergeUrl;
};

const sortEvents = (
  firstChange: monaco.editor.IModelContentChange,
  secondChange: monaco.editor.IModelContentChange,
): number => secondChange.rangeOffset - firstChange.rangeOffset;

function App({ docUrl }: AppProps) {
  const handle = useHandle(docUrl);
  const isUpdatingRef = useRef(false);
  const [, changeDoc] = useDocument<{
    text: string;
  }>(docUrl);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!handle || !editorRef) return;

    handle.on("change", (e) => {
      const model = editorRef.current?.getModel();

      // @ts-expect-error -- working on it
      if (!model || model.getValue() === e.doc.text) return;

      e.patches.forEach((patch) => {
        isUpdatingRef.current = true;

        if (["splice", "put"].includes(patch.action)) {
          // @ts-expect-error -- working on it
          const { value, path, length } = patch;
          const [, index] = path as BetterProp;
          const startPosition = model.getPositionAt(index);
          const endPosition = model.getPositionAt(index + (length || 0));
          const range = new monaco.Selection(
            startPosition.lineNumber,
            startPosition.column,
            endPosition.lineNumber,
            endPosition.column,
          );

          model.applyEdits([
            {
              range,
              text: value,
            },
          ]);
        } else if (patch.action === "del") {
          // @ts-expect-error -- working on it
          const { value, path, length } = patch;
          const [, index] = path as BetterProp;
          const startPosition = model.getPositionAt(index);
          const endPosition = model.getPositionAt(index + (length || 1));
          const range = new monaco.Selection(
            startPosition.lineNumber,
            startPosition.column,
            endPosition.lineNumber,
            endPosition.column,
          );

          model.applyEdits([
            {
              range,
              text: value,
            },
          ]);
        } else {
          throw new Error(`Unsupported patch action: ${patch.action}`);
        }

        isUpdatingRef.current = false;
      });
    });

    return () => {
      handle?.off("change");
    };
  }, [handle]);

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
  }, [changeDoc, editorRef]);

  return (
    <main>
      <Editor
        divProps={{ className: "editor" }}
        onCreate={(editor) => (editorRef.current = editor)}
      />
    </main>
  );
}

export default App;
