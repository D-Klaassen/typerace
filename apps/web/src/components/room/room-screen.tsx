"use client";

import { MAX_NICKNAME_LENGTH } from "@typerace/game";
import { isRoomCode } from "@typerace/protocol";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lobby } from "./lobby";
import {
  Countdown,
  OnlineResults,
  RaceTyping,
  Spectating,
} from "./match-screens";
import { CrazyDartsMatch } from "./crazy-darts-screens";
import { OnlineTimeTrial } from "./time-trial-screens";
import { useDisplayPreferences } from "@/components/finger-guide/use-display-preferences";
import { ROOMS_HOST, useRoom } from "./use-room";

export function RoomScreen() {
  const { code } = useParams<{ code: string }>();
  const t = useTranslations("Room");

  if (ROOMS_HOST === null) {
    return <p role="alert">{t("notConfigured")}</p>;
  }
  if (!isRoomCode(code)) {
    return <RoomNotFound />;
  }

  return <ValidRoom host={ROOMS_HOST} code={code} />;
}

function ValidRoom({ host, code }: { host: string; code: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const intent = searchParams.has("create") ? "create" : "join";
  const room = useRoom(host, code, intent);
  const [display, setDisplay] = useDisplayPreferences();
  const joined = room.state !== null;

  // Once the Room exists, the address bar should hold a plain join link.
  useEffect(() => {
    if (joined && intent === "create") {
      router.replace(`/room/${code}`);
    }
  }, [joined, intent, code, router]);

  if (room.error === "roomNotFound") {
    return <RoomNotFound />;
  }
  if (!room.state) {
    return <NicknameForm code={code} error={room.error} onJoin={room.join} />;
  }

  const { room: view, you } = room.state;
  const me = view.players.find((player) => player.id === you);
  const isHost = view.hostId === you;

  if (view.phase === "lobby") {
    return (
      <Lobby
        code={code}
        state={room.state}
        onUpdateSettings={room.updateSettings}
        onVote={room.vote}
        onStart={room.start}
        display={display}
        onDisplayChange={setDisplay}
      />
    );
  }
  if (view.phase === "results") {
    return (
      <OnlineResults
        room={view}
        isHost={isHost}
        nicknames={room.nicknames}
        onBackToLobby={room.backToLobby}
      />
    );
  }
  if (me?.spectator) {
    return (
      <Spectating
        room={view}
        you={you}
        nicknames={room.nicknames}
        clockOffsetMs={room.clockOffsetMs}
      />
    );
  }
  if (view.phase === "countdown" && view.countdownEndsAtMs !== null) {
    return (
      <Countdown
        endsAtMs={view.countdownEndsAtMs}
        clockOffsetMs={room.clockOffsetMs}
      />
    );
  }
  if (view.phase === "racing" && view.darts) {
    return (
      <CrazyDartsMatch
        darts={view.darts}
        startingHp={view.settings.startingHp}
        you={you}
        nicknames={room.nicknames}
        clockOffsetMs={room.clockOffsetMs}
        display={display}
        onKey={room.key}
      />
    );
  }
  if (view.phase === "racing" && view.timeTrial) {
    return (
      <OnlineTimeTrial
        timeTrial={view.timeTrial}
        you={you}
        nicknames={room.nicknames}
        clockOffsetMs={room.clockOffsetMs}
        display={display}
        onKey={room.key}
      />
    );
  }
  if (view.phase === "racing" && view.race) {
    return (
      <RaceTyping
        race={view.race}
        you={you}
        nicknames={room.nicknames}
        display={display}
        onKey={room.key}
      />
    );
  }

  return null;
}

function NicknameForm({
  code,
  error,
  onJoin,
}: {
  code: string;
  error: string | null;
  onJoin: (nickname: string) => void;
}) {
  const t = useTranslations("Room");
  const [nickname, setNickname] = useState("");

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{t("title", { code })}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onJoin(nickname);
          }}
        >
          <Label htmlFor="nickname">{t("nickname")}</Label>
          <Input
            id="nickname"
            value={nickname}
            maxLength={MAX_NICKNAME_LENGTH}
            autoComplete="off"
            autoFocus
            onChange={(event) => setNickname(event.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {t(`errors.${error}`)}
            </p>
          )}
          <Button type="submit" size="lg">
            {t("enter")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RoomNotFound() {
  const t = useTranslations("Room");

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-bold">{t("errors.roomNotFound")}</h1>
      <Link href="/online" className={buttonVariants({ variant: "outline" })}>
        {t("backToOnline")}
      </Link>
    </div>
  );
}
