"use client";

import type { Display, RoomSettings, Vote } from "@typerace/game";
import {
  parseServerMessage,
  ROOMS_PARTY,
  type ClientMessage,
  type RoomError,
  type ServerMessage,
} from "@typerace/protocol";
import usePartySocket from "partysocket/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

export type RoomState = Extract<ServerMessage, { type: "state" }>;

/**
 * Connects to a Room and exposes its state and the actions a Player can take.
 * Keeps the Room informed of this Player's `display`, so others can see it.
 */
export function useRoom(
  host: string,
  code: string,
  intent: "create" | "join",
  display: Display,
) {
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState<RoomError | null>(null);
  /** The nickname we joined with, to rejoin after a reconnect. */
  const nicknameRef = useRef<string | null>(null);
  /** The display to send with every (re)join. */
  const displayRef = useRef(display);
  /** Room clock minus our clock, to show the countdown. */
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  /** Every nickname seen, so results can name Players who already left. */
  const [nicknames, setNicknames] = useState<Record<string, string>>({});

  const socket = usePartySocket({
    host,
    party: ROOMS_PARTY,
    room: code,
    onOpen() {
      if (nicknameRef.current !== null) {
        send({ type: "join", nickname: nicknameRef.current, intent: "join" });
        send({ type: "display", display: displayRef.current });
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

  const syncDisplay = useEffectEvent((next: Display) => {
    displayRef.current = next;
    if (nicknameRef.current !== null) {
      send({ type: "display", display: next });
    }
  });

  const { fingerGuide, keyboard } = display;
  useEffect(() => {
    syncDisplay({ fingerGuide, keyboard });
  }, [fingerGuide, keyboard]);

  return {
    state,
    error,
    clockOffsetMs,
    nicknames,
    join(nickname: string) {
      nicknameRef.current = nickname;
      send({ type: "join", nickname, intent });
      send({ type: "display", display: displayRef.current });
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
    /** Closing the socket is leaving: the Room drops this Player. */
    leave() {
      nicknameRef.current = null;
      socket.close();
    },
  };
}
