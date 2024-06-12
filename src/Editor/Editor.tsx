import { useEffect, useRef } from "react";
import { defaultMonacoOptions } from "./data";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

type EditorProps = {
  divProps?: React.HTMLProps<HTMLDivElement>;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
};

export const Editor = ({ divProps, options }: EditorProps) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!elRef.current) return;

    editorRef.current = monaco.editor.create(
      elRef.current,
      Object.assign(defaultMonacoOptions, options),
    );

    return () => {
      editorRef.current?.dispose();
    };
  });

  return <div ref={elRef} {...divProps} />;
};
