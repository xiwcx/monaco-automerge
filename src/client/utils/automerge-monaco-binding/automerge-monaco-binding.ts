import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import * as A from "@automerge/automerge/next";
import type {
  DocHandle,
  DocHandleChangePayload,
  DocHandleEphemeralMessagePayload,
} from "@automerge/automerge-repo";
import { MonacoDoc } from "../shared-data";
import { handlePatch } from "./handle-patch";
import { Color, isCursorChangeMessage, PeerStates } from "./common";
import { handleCursorChange } from "./handle-cursor-change";

const sortEvents = (
  firstChange: monaco.editor.IModelContentChange,
  secondChange: monaco.editor.IModelContentChange,
): number => secondChange.rangeOffset - firstChange.rangeOffset;

export class AutomergeMonacoBinding {
  #automergeHandle: DocHandle<MonacoDoc>;
  #editorCursorChangeListener: monaco.IDisposable;
  #monacoEditor: monaco.editor.IStandaloneCodeEditor;
  #monacoEditorDecorationsCollection: monaco.editor.IEditorDecorationsCollection;
  #monacoModel: monaco.editor.ITextModel;
  #modelChangeListener: monaco.IDisposable;
  #peerStates: PeerStates;
  #userId: string;
  #isAutomergeDocUpdating: boolean;

  #initialSync() {
    const doc = this.#automergeHandle.docSync();

    if (doc) {
      this.#isAutomergeDocUpdating = true;
      this.#monacoModel.setValue(doc.text);
      this.#isAutomergeDocUpdating = false;
    }
  }

  #docChangeHandler = (event: DocHandleChangePayload<MonacoDoc>) => {
    /**
     * this allows us to distinguish between changes made by the user in the
     * editor and changes made by the automerge doc.
     */
    const isNotInSync = this.#monacoModel.getValue() !== event.doc.text;

    if (isNotInSync) {
      this.#isAutomergeDocUpdating = true;
      event.patches.forEach((patch) =>
        handlePatch({ model: this.#monacoModel, patch }),
      );
      this.#isAutomergeDocUpdating = false;
    }
  };

  #docEphemeralMessageHandler = ({
    message,
  }: DocHandleEphemeralMessagePayload<MonacoDoc>) => {
    if (isCursorChangeMessage(message)) {
      this.#monacoEditorDecorationsCollection.set(
        handleCursorChange({
          peerStates: this.#peerStates,
          position: message.position,
          userId: message.userId,
        }),
      );
    }
  };

  #monacoModelChangeHandler = (e: monaco.editor.IModelContentChangedEvent) => {
    if (!this.#isAutomergeDocUpdating) {
      this.#automergeHandle.change((doc) => {
        e.changes.sort(sortEvents).forEach((change) => {
          const { rangeOffset, rangeLength, text } = change;

          A.splice(doc, ["text"], rangeOffset, rangeLength, text);
        });
      });
    }
  };

  #monacoCursorChangeHandler = (
    cursorPositionChangedEvent: monaco.editor.ICursorPositionChangedEvent,
  ) => {
    this.#automergeHandle.broadcast({
      position: cursorPositionChangedEvent.position,
      userId: this.#userId,
    });
  };

  constructor(
    handle: DocHandle<MonacoDoc>,
    userId: string,
    monacoModel: monaco.editor.ITextModel,
    editor: monaco.editor.IStandaloneCodeEditor,
  ) {
    this.#automergeHandle = handle;
    this.#monacoModel = monacoModel;
    this.#monacoEditor = editor;
    this.#userId = userId;
    this.#isAutomergeDocUpdating = false;
    this.#peerStates = new Map<
      string,
      { color: Color; decoration: monaco.editor.IModelDeltaDecoration }
    >();

    this.#initialSync();

    this.#monacoEditorDecorationsCollection =
      this.#monacoEditor.createDecorationsCollection();

    // set up event listeners
    this.#automergeHandle.on("change", this.#docChangeHandler);

    this.#automergeHandle.on(
      "ephemeral-message",
      this.#docEphemeralMessageHandler,
    );

    this.#modelChangeListener = this.#monacoModel.onDidChangeContent(
      this.#monacoModelChangeHandler,
    );

    this.#editorCursorChangeListener =
      this.#monacoEditor.onDidChangeCursorPosition(
        this.#monacoCursorChangeHandler,
      );
  }

  destroy() {
    this.#automergeHandle.off("change");
    this.#automergeHandle.off("ephemeral-message");
    this.#modelChangeListener.dispose();
    this.#editorCursorChangeListener.dispose();
  }
}
