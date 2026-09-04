import { isEditingAvailable, missingEditingConfig } from "@/lib/keystatic-env";
import { SetupRequired } from "./SetupRequired";
import KeystaticApp from "./keystatic";

/** Never prerendered: the editor is per-session and per-request. */
export const dynamic = "force-dynamic";

export default function AdminPage() {
  // Rendering the editor against missing credentials produces an opaque failure
  // in the browser; saying what is missing is far more use to whoever opens it.
  if (!isEditingAvailable) {
    return <SetupRequired missing={missingEditingConfig()} />;
  }
  return <KeystaticApp />;
}
