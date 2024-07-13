import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import * as A from "@automerge/automerge/next";
import type {
  DocHandle,
  DocHandleChangePayload,
  DocHandleEphemeralMessagePayload,
} from "@automerge/automerge-repo";
import { MonacoDoc } from "../shared-data";

type AutomergeDeleteOrInsertPath = [string, number];
/**
 * Automerge's `Prop` type is an indescriminate union of string and number, so we
 * need to provide a type guard to treat it as a proper tuple.
 */
const isDeleteOrInsertPath = (
  props: A.Prop[],
): props is AutomergeDeleteOrInsertPath => {
  const [, secondProp] = props;

  return typeof secondProp === "number";
};

const isPutOrSplicePatch = (
  patch: A.Patch,
): patch is A.SpliceTextPatch | A.PutPatch => {
  return ["put", "splice"].includes(patch.action);
};

type GetIndexFromPath = (path: A.Prop[]) => number;
/**
 * Automerge has length as an optional property in the path tuple, so we need
 * to provide a fallback.
 */
const getIndexFromPath: GetIndexFromPath = (path) =>
  isDeleteOrInsertPath(path) ? path[1] : 0;

type GetMonacoSelection = (args: {
  start: number;
  end: number;
  model: monaco.editor.ITextModel;
}) => monaco.Selection;
const getMonacoSelection: GetMonacoSelection = ({ start, end, model }) => {
  const startPosition = model.getPositionAt(start);
  const endPosition = model.getPositionAt(end);

  return new monaco.Selection(
    startPosition.lineNumber,
    startPosition.column,
    endPosition.lineNumber,
    endPosition.column,
  );
};

type HandlePatch = (args: {
  model: monaco.editor.ITextModel;
  patch: A.Patch;
}) => void;
export const handlePatch: HandlePatch = ({ model, patch }) => {
  if (isPutOrSplicePatch(patch)) {
    const index = getIndexFromPath(patch.path);

    model.applyEdits([
      {
        range: getMonacoSelection({
          start: index,
          end: index,
          model,
        }),
        text: String(patch.value),
      },
    ]);
  } else if (patch.action === "del") {
    const { path, length = 1 } = patch;
    const index = getIndexFromPath(path);

    model.applyEdits([
      {
        range: getMonacoSelection({
          start: index,
          end: index + length,
          model,
        }),
        text: "",
      },
    ]);
  } else {
    throw new Error(`Unsupported patch action: ${patch.action}`);
  }
};

const cursorPositionChangedEventToDecoration = (
  cursorPositionChangedEvent: monaco.editor.ICursorPositionChangedEvent,
): monaco.editor.IModelDeltaDecoration => {
  const { position } = cursorPositionChangedEvent;

  return {
    range: new monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column,
    ),
    options: {
      stickiness:
        monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      className: "peer-cursor",
    },
  };
};

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
  #userId: string;

  #isAutomergeDocUpdating = false;
  #peerCursorPositions = new Map<string, monaco.editor.IModelDeltaDecoration>();

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
    senderId,
    message,
  }: DocHandleEphemeralMessagePayload<MonacoDoc>) => {
    this.#peerCursorPositions.set(senderId, message.cursorPositionChangedEvent);

    const newDecorations = Array.from(this.#peerCursorPositions.values()).map(
      cursorPositionChangedEventToDecoration,
    );

    this.#monacoEditorDecorationsCollection.set(newDecorations);
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
      cursorPositionChangedEvent,
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

    this.#initialSync();

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

    this.#monacoEditorDecorationsCollection =
      this.#monacoEditor.createDecorationsCollection();
  }

  destroy() {
    this.#automergeHandle.off("change");
    this.#automergeHandle.off("ephemeral-message");
    this.#modelChangeListener.dispose();
    this.#editorCursorChangeListener.dispose();
  }
}
