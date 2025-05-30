import { ReactNode } from "react";

import { Fraction } from "@/types/generated/openapi";
import { getFractionInteger, getFractionWithoutInteger } from "@/utils/fraction";

import cls from "./DisplayFraction.module.css";

export function DisplayFraction({ id, fraction }: { id: string; fraction: Fraction }): ReactNode {
  return (
    <div id={id} className={cls.displayFraction}>
      <span>{getFractionInteger(fraction)}</span>
      {fraction.numerator > 0 && <span className={cls.fractionPart}>{getFractionWithoutInteger(fraction)}</span>}
    </div>
  );
}
