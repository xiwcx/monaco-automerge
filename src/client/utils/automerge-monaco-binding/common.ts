import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { G } from "@mobily/ts-belt";

/**
 * yes, this won't allow us to differentiate between more than six
 * users, but what are more than six collabarorators really doing?
 */
export const COLORS = ["yellow", "blue", "green", "orange", "purple", "red"];

export type Color = (typeof COLORS)[number];

export type CursorStates = Map<
  string,
  { color: Color; decoration: monaco.editor.IModelDeltaDecoration }
>;

type BaseMessage = {
  userId: string;
};

export const isBaseMessage = (message: unknown): message is BaseMessage =>
  G.isObject(message) && "userId" in message;

export type CursorChangeMessage = BaseMessage & {
  position: monaco.Position;
};

export const isCursorChangeMessage = (
  message: unknown,
): message is CursorChangeMessage =>
  G.isObject(message) && "userId" in message && "position" in message;

export type PeerHeartbeats = Map<string, number>;

export type HeartbeatMessage = BaseMessage & {
  time: number;
};

export const isHeartbeatMessage = (
  message: unknown,
): message is HeartbeatMessage =>
  G.isObject(message) && "userId" in message && "time" in message;
