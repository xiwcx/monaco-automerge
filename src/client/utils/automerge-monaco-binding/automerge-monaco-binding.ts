import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import * as A from "@automerge/automerge/next";
import type {
  DocHandle,
  DocHandleChangePayload,
  DocHandleEphemeralMessagePayload,
} from "@automerge/automerge-repo";
import { MonacoDoc } from "../shared-data";
import { handlePatch } from "./handle-patch";
import {
  Color,
  isCursorChangeMessage,
  CursorStates,
  isHeartbeatMessage,
  isBaseMessage,
} from "./common";
import {
  getDecorationsFromCursorStates,
  handleCursorChange,
} from "./handle-cursor-change";

const heartbeatEmitRate = 15 * 1000;
const hearbeatCheckRate = 30 * 1000;

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
  #cursorStates: CursorStates;
  #peerHeartbeats: Map<string, number>;
  #heartbeatInterval: NodeJS.Timeout;
  #removeDisconnectedPeersInterval: NodeJS.Timeout;
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
    if (!isBaseMessage(message) || message.userId === this.#userId) return;

    if (isCursorChangeMessage(message)) {
      this.#monacoEditorDecorationsCollection.set(
        handleCursorChange({
          peerStates: this.#cursorStates,
          position: message.position,
          userId: message.userId,
        }),
      );
    }

    if (isHeartbeatMessage(message)) {
      this.#peerHeartbeats.set(message.userId, message.time);
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

  #emitHeartbeat = () => {
    this.#automergeHandle.broadcast({ userId: this.#userId, time: Date.now() });
  };

  #removeDisconnectedPeers = () => {
    const now = Date.now();
    const initialSize = this.#peerHeartbeats.size;

    this.#peerHeartbeats.forEach((time, userId) => {
      if (now - time > hearbeatCheckRate) {
        this.#peerHeartbeats.delete(userId);
        this.#cursorStates.delete(userId);
      }
    });

    if (initialSize !== this.#peerHeartbeats.size) {
      this.#monacoEditorDecorationsCollection.set(
        getDecorationsFromCursorStates(this.#cursorStates),
      );
    }
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
    this.#cursorStates = new Map<
      string,
      { color: Color; decoration: monaco.editor.IModelDeltaDecoration }
    >();
    this.#peerHeartbeats = new Map<string, number>();

    this.#initialSync();

    this.#emitHeartbeat();
    this.#heartbeatInterval = setInterval(
      this.#emitHeartbeat,
      heartbeatEmitRate,
    );

    this.#removeDisconnectedPeersInterval = setInterval(
      this.#removeDisconnectedPeers,
      hearbeatCheckRate,
    );

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
    clearInterval(this.#heartbeatInterval);
    clearInterval(this.#removeDisconnectedPeersInterval);
    this.#automergeHandle.off("change");
    this.#automergeHandle.off("ephemeral-message");
    this.#modelChangeListener.dispose();
    this.#editorCursorChangeListener.dispose();
  }
}
