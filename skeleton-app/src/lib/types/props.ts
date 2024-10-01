import type { AllowedGlobals } from "$lib/utils/safeEval";

export interface CodeExeProps {
  allowedGlobals: AllowedGlobals;
  code: string;
  resultString: string;
  logs: string[];
}
