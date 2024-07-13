import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { G } from "@mobily/ts-belt";

export const COLORS = ["yellow", "blue", "green", "orange", "purple", "red"];

export type Color = (typeof COLORS)[number];

export type PeerStates = Map<
  string,
  { color: Color; decoration: monaco.editor.IModelDeltaDecoration }
>;

export type CursorChangeMessage = {
  userId: string;
  position: monaco.Position;
};

export const isCursorChangeMessage = (
  message: unknown,
): message is CursorChangeMessage =>
  G.isObject(message) && "userId" in message && "position" in message;
