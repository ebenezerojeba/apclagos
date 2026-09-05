/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { Schema, type Types } from "mongoose";
import { defineModel, imageSchema, type CloudinaryImage } from "./shared";

/**
 * Infrastructure collections: the media library, site settings and the people
 * who can sign in to the admin.
 */

/* -------------------------------------------------------------------------- */
/*  Media library                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A registry of every asset uploaded through the admin.
 *
 * Cloudinary is the store; this is the index. Keeping a row per asset is what
 * makes it possible to browse what has been uploaded, reuse an image across
 * records, and — critically — find orphans. Without it the only inventory
 * would be Cloudinary's own dashboard, which knows nothing about which article
 * an image belongs to.
 */
export interface MediaDoc {
  _id: Types.ObjectId;
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resourceType: "image" | "video" | "raw";
  folder?: string;
  alt: string;
  caption?: string;
  credit?: string;
  tags: string[];
  uploadedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<any>(
  {
    publicId: { type: String, required: true, unique: true, trim: true },
    url: { type: String, required: true, trim: true },
    secureUrl: { type: String, required: true, trim: true },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    format: { type: String, required: true, trim: true },
    bytes: { type: Number, required: true, min: 0 },
    resourceType: { type: String, enum: ["image", "video", "raw"], default: "image" },
    folder: { type: String, trim: true, index: true },
    alt: {
      type: String,
      required: [true, "Alternative text is required for every asset."],
      trim: true,
      maxlength: 300,
    },
    caption: { type: String, trim: true, maxlength: 500 },
    credit: { type: String, trim: true, maxlength: 200 },
    tags: [{ type: String, trim: true, maxlength: 40 }],
    uploadedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true },
);

mediaSchema.index({ createdAt: -1 });

export const Media = defineModel<MediaDoc>("Media", mediaSchema);

/* -------------------------------------------------------------------------- */
/*  Site settings                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A singleton. `key` is pinned to "site" and unique, so there can only ever be
 * one settings document — the alternative (a free-form key/value store) makes
 * every read a guess about which row is authoritative.
 */
export interface SettingsDoc {
  _id: Types.ObjectId;
  key: "site";
  organisationName?: string;
  tagline?: string;
  description?: string;
  addressLines: string[];
  city?: string;
  state?: string;
  phones: string[];
  emails: string[];
  openingHours?: string;
  mapQuery?: string;
  social: {
    facebook?: string;
    x?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  logo?: CloudinaryImage;
  updatedAt: Date;
  createdAt: Date;
}

const settingsSchema = new Schema<any>(
  {
    key: { type: String, default: "site", enum: ["site"], unique: true },
    organisationName: { type: String, trim: true, maxlength: 200 },
    tagline: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 600 },
    addressLines: [{ type: String, trim: true, maxlength: 200 }],
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    phones: [{ type: String, trim: true, maxlength: 40 }],
    emails: [{ type: String, trim: true, lowercase: true, maxlength: 200 }],
    openingHours: { type: String, trim: true, maxlength: 200 },
    mapQuery: { type: String, trim: true, maxlength: 300 },
    social: {
      facebook: { type: String, trim: true },
      x: { type: String, trim: true },
      instagram: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      youtube: { type: String, trim: true },
    },
    logo: { type: imageSchema },
  },
  { timestamps: true },
);

export const Settings = defineModel<SettingsDoc>("Settings", settingsSchema);

/* -------------------------------------------------------------------------- */
/*  Admin users                                                                */
/* -------------------------------------------------------------------------- */

export const ADMIN_ROLES = ["owner", "editor", "contributor"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/**
 * Capabilities per role. Routes ask for a capability, never for a role
 * directly, so adding a role later does not mean auditing every call site.
 */
export const ROLE_CAPABILITIES: Record<AdminRole, string[]> = {
  owner: ["read", "write", "publish", "delete", "manage-users", "settings"],
  editor: ["read", "write", "publish"],
  contributor: ["read", "write"],
};

export interface AdminUserDoc {
  _id: Types.ObjectId;
  email: string;
  name: string;
  /** bcrypt hash. Never selected by default — see `select: false` below. */
  passwordHash: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt?: Date;
  /**
   * Bumped to invalidate every existing session for this user — used on
   * password change and on deactivation, so a stolen cookie stops working.
   */
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const adminUserSchema = new Schema<any>(
  {
    email: {
      type: String,
      required: [true, "An email address is required."],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."],
    },
    name: { type: String, required: [true, "A name is required."], trim: true, maxlength: 160 },
    // Excluded from every query result unless explicitly re-selected, so a
    // hash cannot leak through a careless `.find()` that gets serialised to a
    // client component.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: [...ADMIN_ROLES], default: "contributor", index: true },
    active: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date },
    sessionVersion: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export const AdminUser = defineModel<AdminUserDoc>("AdminUser", adminUserSchema);

export function roleCan(role: AdminRole, capability: string): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}
