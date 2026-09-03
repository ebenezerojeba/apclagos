import { NextResponse } from "next/server";
import { z } from "zod";
import { getSearchIndex, searchIndex } from "@/lib/search";

/**
 * Search endpoint used by the header command palette.
 *
 * The index itself never leaves the server — only the matched documents do, and
 * only up to `limit`. The query is validated and length-capped so a crafted
 * request cannot turn the scorer into a denial-of-service vector.
 */

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().trim().min(2).max(80),
  limit: z.coerce.number().int().min(1).max(40).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ results: [], total: 0 }, { status: 200 });
  }

  const index = await getSearchIndex();
  const results = searchIndex(index, parsed.data.q, parsed.data.limit ?? 12);

  return NextResponse.json(
    {
      query: parsed.data.q,
      total: results.length,
      results: results.map((doc) => ({
        id: doc.id,
        type: doc.type,
        title: doc.title,
        subtitle: doc.subtitle,
        href: doc.href,
      })),
    },
    {
      headers: {
        // Safe to cache briefly: the response contains only published content.
        "Cache-Control": "public, max-age=30, s-maxage=120, stale-while-revalidate=600",
      },
    },
  );
}
