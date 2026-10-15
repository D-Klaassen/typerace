"use client";

import { LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Leaves a game for the home page. With a `confirmation`, it asks first, so a
 * stray click doesn't end a game in progress.
 */
export function QuitButton({
  label,
  confirmation,
  onQuit,
}: {
  label: string;
  confirmation?: { title: string; description: string };
  onQuit: () => void;
}) {
  const t = useTranslations("Navigation");
  const content = (
    <>
      <LogOutIcon data-icon="inline-start" aria-hidden />
      {label}
    </>
  );

  if (!confirmation) {
    return (
      <Button variant="ghost" onClick={onQuit}>
        {content}
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" />}>
        {content}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmation.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmation.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("keepPlaying")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onQuit}>
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
