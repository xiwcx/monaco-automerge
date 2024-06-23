import { Editor } from "./components/Editor";
import "./App.css";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { type AutomergeUrl } from "@automerge/automerge-repo";
import * as A from "@automerge/automerge/next";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useState } from "react";

type AppProps = {
  docUrl: AutomergeUrl;
};

const sortEvents = (
  firstChange: monaco.editor.IModelContentChange,
  secondChange: monaco.editor.IModelContentChange,
): number => secondChange.rangeOffset - firstChange.rangeOffset;

function App({ docUrl }: AppProps) {
  const [doc, changeDoc] = useDocument<{
    text: string;
  }>(docUrl);
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!doc || !editor) return;

    const model = editor.getModel();

    if (!model) return;

    if (doc.text !== model.getValue()) {
      model.setValue(doc.text);
    }
  }, [editor, doc]);

  useEffect(() => {
    if (!editor) return;

    const listener = editor.onDidChangeModelContent((event) => {
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
  }, [changeDoc, editor]);

  return (
    <main>
      <Editor
        divProps={{ className: "editor" }}
        onCreate={(editor) => setEditor(editor)}
      />
    </main>
  );
}

export default App;
