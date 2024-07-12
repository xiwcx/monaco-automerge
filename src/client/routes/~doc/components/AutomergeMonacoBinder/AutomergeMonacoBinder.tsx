import { type AutomergeUrl } from "@automerge/automerge-repo";
import { MyDoc } from "../../../../utils/shared-data";
import { repo } from "../../../../utils/repo";
import { AutomergeMonacoBinding } from "../../../../utils/automerge-monaco-binding";
import Editor from "@monaco-editor/react";
import { memo } from "react";

type AutomergeMonacoBinderProps = {
  docUrl: AutomergeUrl;
};

export const AutomergeMonacoBinder = memo(
  ({ docUrl }: AutomergeMonacoBinderProps) => (
    <Editor
      height="calc(100dvh - var(--header-height))"
      width="100dvw"
      theme="vs-dark"
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
      options={{
        automaticLayout: true,
      }}
    />
  ),
);
