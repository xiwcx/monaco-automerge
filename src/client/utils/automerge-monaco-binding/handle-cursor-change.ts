import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { Color, CursorStates, COLORS } from "./common";

type CursorPositionChangedEventToDecoration = (args: {
  position: monaco.Position;
  color: Color;
}) => monaco.editor.IModelDeltaDecoration;
const cursorPositionChangedEventToDecoration: CursorPositionChangedEventToDecoration =
  ({ position, color }): monaco.editor.IModelDeltaDecoration => ({
    range: new monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column,
    ),
    options: {
      className: `peer-cursor peer-cursor--${color}`,
    },
  });

export const getDecorationsFromCursorStates = (
  peerStates: CursorStates,
): monaco.editor.IModelDeltaDecoration[] =>
  Array.from(peerStates.values()).map(({ decoration }) => decoration);

/**
 * normalize between new and existing peers
 */
type HandleCursorChange = (args: {
  peerStates: CursorStates;
  position: monaco.Position;
  userId: string;
}) => monaco.editor.IModelDeltaDecoration[];
export const handleCursorChange: HandleCursorChange = ({
  peerStates,
  position,
  userId,
}) => {
  const isNewPeer = !peerStates.has(userId);
  let color: Color;

  if (isNewPeer) {
    color = COLORS[peerStates.size % COLORS.length];
  } else {
    color = peerStates.get(userId)!.color;
  }

  peerStates.set(userId, {
    color,
    decoration: cursorPositionChangedEventToDecoration({
      position,
      color,
    }),
  });

  return getDecorationsFromCursorStates(peerStates);
};
