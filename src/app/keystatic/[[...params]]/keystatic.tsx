"use client";

import { makePage } from "@keystatic/next/ui/app";
import keystaticConfig from "../../../../keystatic.config";

/**
 * The editing interface itself. Client-only by nature — it is a single-page
 * application that talks to the route handler under `/api/keystatic`.
 */
export default makePage(keystaticConfig);
