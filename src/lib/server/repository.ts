import "server-only";

import { requireAdmin } from "@/lib/server/auth";
import type { BaseRecord, PublishStatus } from "@/types/content";

/**
 * The write side of the data layer.
 *
 * The public site only ever reads (see `src/lib/content.ts`). Everything an
 * administrator can do is expressed here as one interface, so a CMS built on
 * this codebase has a single, typed contract to satisfy — and so the read path
 * can never accidentally acquire write capability.
 *
 * The default implementation is read-only: the site's records live in
 * version-controlled TypeScript files, and a running Next.js server has no
 * business rewriting its own source. Point `CONTENT_API_URL` at a Node/Express
 * service and implement `ApiContentRepository` against it.
 */

/** Every collection an administrator can manage. */
export const COLLECTIONS = [
  "leaders",
  "council-officials",
  "senators",
  "house-of-representatives",
  "house-of-assembly",
  "candidates",
  "lgas",
  "lcdas",
  "wards",
  "news",
  "events",
  "gallery-albums",
  "videos",
  "achievements",
  "documents",
  "elections",
] as const;

export type CollectionName = (typeof COLLECTIONS)[number];

export interface ListQuery {
  status?: PublishStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UploadedImage {
  url: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * The contract an administrative backend must implement.
 * Every method is authorised by the caller before it is invoked.
 */
export interface ContentRepository {
  list<T extends BaseRecord>(
    collection: CollectionName,
    query?: ListQuery,
  ): Promise<ListResult<T>>;

  get<T extends BaseRecord>(
    collection: CollectionName,
    slug: string,
  ): Promise<T | null>;

  create<T extends BaseRecord>(
    collection: CollectionName,
    record: Omit<T, "id" | "createdAt" | "updatedAt">,
  ): Promise<T>;

  update<T extends BaseRecord>(
    collection: CollectionName,
    slug: string,
    patch: Partial<T>,
  ): Promise<T>;

  remove(collection: CollectionName, slug: string): Promise<void>;

  setStatus(
    collection: CollectionName,
    slug: string,
    status: PublishStatus,
  ): Promise<void>;

  /** Images are stored by the backend, never written into the app bundle. */
  uploadImage(file: File, folder: string): Promise<UploadedImage>;
}

class ReadOnlyRepositoryError extends Error {
  constructor(action: string) {
    super(
      `Cannot ${action}: this deployment reads its content from version-controlled files in src/data. ` +
        "Set CONTENT_API_URL and implement ApiContentRepository to enable editing.",
    );
    this.name = "ReadOnlyRepositoryError";
  }
}

/**
 * The default repository. Reads are delegated to the file-backed content layer
 * by the caller; writes fail loudly rather than pretending to succeed.
 */
export const readOnlyRepository: ContentRepository = {
  async list() {
    throw new ReadOnlyRepositoryError("list records through the admin API");
  },
  async get() {
    throw new ReadOnlyRepositoryError("read records through the admin API");
  },
  async create() {
    throw new ReadOnlyRepositoryError("create records");
  },
  async update() {
    throw new ReadOnlyRepositoryError("update records");
  },
  async remove() {
    throw new ReadOnlyRepositoryError("delete records");
  },
  async setStatus() {
    throw new ReadOnlyRepositoryError("change publication status");
  },
  async uploadImage() {
    throw new ReadOnlyRepositoryError("upload images");
  },
};

/**
 * Resolves the repository for the current deployment.
 *
 * Callers must pass the capability the operation needs; authorisation happens
 * here so no call site can forget it.
 */
export async function getRepository(
  capability: "read" | "write" | "publish" | "delete" = "read",
): Promise<ContentRepository> {
  await requireAdmin(capability);

  if (process.env.CONTENT_API_URL) {
    // TODO(integration): return new ApiContentRepository({
    //   baseUrl: process.env.CONTENT_API_URL!,
    //   token: process.env.CONTENT_API_TOKEN!,
    // });
    throw new Error(
      "CONTENT_API_URL is set but ApiContentRepository has not been implemented yet.",
    );
  }

  return readOnlyRepository;
}
