import { type AutomergeUrl } from "@automerge/automerge-repo";
import { MonacoDoc } from "../../../../utils/shared-data";
import { repo } from "../../../../utils/repo";
import { AutomergeMonacoBinding } from "../../../../utils/automerge-monaco-binding";
import Editor from "@monaco-editor/react";
import cookies from "browser-cookies";
import { memo } from "react";
import { G, S } from "@mobily/ts-belt";

type AutomergeMonacoBinderProps = {
  docUrl: AutomergeUrl;
};

const isNonEmptyString = (value: string | null): value is string =>
  G.isString(value) && S.isNotEmpty(value);

export const AutomergeMonacoBinder = memo(
  ({ docUrl }: AutomergeMonacoBinderProps) => (
    <Editor
      height="calc(100dvh - var(--header-height))"
      width="100dvw"
      theme="vs-dark"
      onMount={(editor) => {
        const handle = repo.find<MonacoDoc>(docUrl);
        const model = editor.getModel();
        const userId = cookies.get("userId");

        if (!handle || !model || !isNonEmptyString(userId)) {
          throw new Error("Missing something important");
        }

        handle.whenReady().then(() => {
          new AutomergeMonacoBinding(handle, userId, model, editor);
        });
      }}
      options={{
        automaticLayout: true,
      }}
    />
  ),
);
