import { type AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import * as A from "@automerge/automerge/next";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef } from "react";
import { handlePatch } from "./utils";
import { MyDoc } from "../../utils/shared-data";
import { Editor } from "../Editor";
import "./styles.css";

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

    const contentListener = editorRef.current.onDidChangeModelContent(
      (event) => {
        if (isUpdatingRef.current) return;

        changeDoc((doc) => {
          event.changes.sort(sortEvents).forEach((change) => {
            const { rangeOffset, rangeLength, text } = change;

            A.splice(doc, ["text"], rangeOffset, rangeLength, text);
          });
        });
      },
    );

    const cursorListener = editorRef.current.onDidChangeCursorPosition(
      (event) => {
        console.log("cursor", event);
      },
    );

    return () => {
      contentListener.dispose();
      cursorListener.dispose();
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
