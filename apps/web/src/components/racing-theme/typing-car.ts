import type { TypingSession } from "@typerace/game";
import type { RacingCar } from "./racing-track";

/** The car of a single typist, such as the Player whose Turn it is. */
export function typingCar(
  session: Pick<TypingSession, "position" | "typosInARow" | "finished">,
  car: Pick<RacingCar, "id" | "name" | "isYou" | "seat">,
): RacingCar {
  return {
    ...car,
    position: session.position,
    typosInARow: session.typosInARow,
    finished: session.finished,
  };
}
