import { type AutomergeUrl } from "@automerge/automerge-repo";
import { MyDoc } from "../../utils/shared-data";
import "./styles.css";
import { repo } from "../../utils/repo";
import { AutomergeMonacoBinding } from "../../utils/automerge-monaco-binding/";
import Editor from "@monaco-editor/react";
import "./styles.css";
import { memo } from "react";

type AutomergeMonacoBinderProps = {
  docUrl: AutomergeUrl;
};

export const AutomergeMonacoBinder = memo(
  ({ docUrl }: AutomergeMonacoBinderProps) => (
    <Editor
      height="100vh"
      width="100vw"
      onMount={(editor) => {
        const handle = repo.find<MyDoc>(docUrl);
        const model = editor.getModel();

        if (!handle || !model) {
          throw new Error("Missing handle or model");
        }

        handle.whenReady().then(() => {
          new AutomergeMonacoBinding(handle, model, editor);
        });
      }}
    />
  ),
);
