"use client";

import { generateRoomCode, isRoomCode } from "@typerace/protocol";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Create a new Room, or go to an existing one by its code. */
export function OnlineStart() {
  const t = useTranslations("Online");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);

  function join(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!isRoomCode(normalized)) {
      setInvalid(true);
      return;
    }
    router.push(`/room/${normalized}`);
  }

  return (
    <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("createTitle")}</CardTitle>
          <CardDescription>{t("createDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push(`/room/${generateRoomCode()}?create=1`)}
          >
            {t("create")}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("joinTitle")}</CardTitle>
          <CardDescription>{t("joinDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={join} noValidate className="flex flex-col gap-3">
            <Label htmlFor="room-code" className="sr-only">
              {t("code")}
            </Label>
            <Input
              id="room-code"
              value={code}
              placeholder={t("code")}
              autoComplete="off"
              maxLength={6}
              className="font-mono tracking-widest uppercase"
              aria-invalid={invalid}
              onChange={(event) => {
                setCode(event.target.value);
                setInvalid(false);
              }}
            />
            {invalid && (
              <p role="alert" className="text-sm text-destructive">
                {t("invalidCode")}
              </p>
            )}
            <Button type="submit" size="lg" variant="outline">
              {t("join")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
