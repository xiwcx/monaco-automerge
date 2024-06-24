import { Editor } from "./components/Editor";
import "./App.css";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { type AutomergeUrl } from "@automerge/automerge-repo";
import * as A from "@automerge/automerge/next";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef, useState } from "react";
import { i } from "vitest/dist/reporters-yx5ZTtEV.js";

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
  const [doc, changeDoc] = useDocument<{
    text: string;
  }>(docUrl);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!handle || !editorRef) return;

    handle.on("change", (e) => {
      const model = editorRef.current?.getModel();
      console.log(e, model);

      // @ts-expect-error -- working on it
      if (!model || model.getValue() === e.doc.text) return;

      e.patches.forEach((patch) => {
        if (!isBetterProp(patch.path)) return;

        const [, index] = patch.path;
        const position = model.getPositionAt(index);
        const range = new monaco.Selection(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column,
        );

        console.log({ index, position, range });

        isUpdatingRef.current = true;

        switch (patch.action) {
          case "put":
            break;
          case "splice":
            model.applyEdits([
              {
                range,
                text: patch.value,
              },
            ]);
            break;
          case "del":
            model.applyEdits([
              {
                range,
                text: "",
              },
            ]);
            break;
          default:
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

          A.splice(doc, ["text"], rangeOffset, rangeLength, ...text);
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
