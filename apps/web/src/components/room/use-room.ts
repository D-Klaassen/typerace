"use client";

import type { RoomSettings, Vote } from "@typerace/game";
import {
  parseServerMessage,
  ROOMS_PARTY,
  type ClientMessage,
  type RoomError,
  type ServerMessage,
} from "@typerace/protocol";
import usePartySocket from "partysocket/react";
import { useRef, useState } from "react";

const ROOMS_HOST = process.env.NEXT_PUBLIC_ROOMS_HOST ?? "localhost:8787";

export type RoomState = Extract<ServerMessage, { type: "state" }>;

/** Connects to a Room and exposes its state and the actions a Player can take. */
export function useRoom(code: string, intent: "create" | "join") {
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState<RoomError | null>(null);
  /** The nickname we joined with, to rejoin after a reconnect. */
  const nicknameRef = useRef<string | null>(null);
  /** Room clock minus our clock, to show the countdown. */
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  /** Every nickname seen, so results can name Players who already left. */
  const [nicknames, setNicknames] = useState<Record<string, string>>({});

  const socket = usePartySocket({
    host: ROOMS_HOST,
    party: ROOMS_PARTY,
    room: code,
    onOpen() {
      if (nicknameRef.current !== null) {
        send({ type: "join", nickname: nicknameRef.current, intent: "join" });
      }
    },
    onMessage(event: MessageEvent<string>) {
      const message = parseServerMessage(event.data);
      if (message?.type === "state") {
        setState(message);
        setError(null);
        setClockOffsetMs(message.serverNowMs - Date.now());
        setNicknames((known) => ({
          ...known,
          ...Object.fromEntries(
            message.room.players.map((player) => [player.id, player.nickname]),
          ),
        }));
      } else if (message?.type === "error") {
        nicknameRef.current = null;
        setError(message.reason);
      }
    },
  });

  function send(message: ClientMessage) {
    socket.send(JSON.stringify(message));
  }

  return {
    state,
    error,
    clockOffsetMs,
    nicknames,
    join(nickname: string) {
      nicknameRef.current = nickname;
      send({ type: "join", nickname, intent });
    },
    updateSettings(changes: Partial<RoomSettings>) {
      send({ type: "updateSettings", changes });
    },
    vote(vote: Vote) {
      send({ type: "vote", vote });
    },
    start() {
      send({ type: "start" });
    },
    key(key: string) {
      send({ type: "key", key });
    },
    backToLobby() {
      send({ type: "backToLobby" });
    },
  };
}
