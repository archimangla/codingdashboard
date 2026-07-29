import { Router } from "express";
import { db, userProfilesTable, platformConnectionsTable } from "@workspace/db";
import {
  GetUserProfileResponse,
  CreateUserProfileBody,
  CreateUserProfileResponse,
  UpdateUserProfileBody,
  UpdateUserProfileResponse,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import type { IRouter } from "express";

const router: IRouter = Router();
const USER_ID = 1;

router.get("/user/profile", async (req, res): Promise<void> => {
  const [profile] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.id, USER_ID));

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const connections = await db
    .select()
    .from(platformConnectionsTable)
    .where(eq(platformConnectionsTable.userId, USER_ID));

  const result = GetUserProfileResponse.parse({
    id: profile.id,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl ?? null,
    onboardingComplete: profile.onboardingComplete,
    createdAt: profile.createdAt.toISOString(),
    lastSyncAt: profile.lastSyncAt?.toISOString() ?? null,
    platforms: connections.map((c) => ({
      platformId: c.platformId,
      handle: c.handle,
    })),
  });

  res.json(result);
});

router.post("/user/profile", async (req, res): Promise<void> => {
  const parsed = CreateUserProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { displayName, avatarUrl, platforms = [] } = parsed.data;

  const [existing] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.id, USER_ID));

  let profile;
  if (existing) {
    [profile] = await db
      .update(userProfilesTable)
      .set({ displayName, avatarUrl: avatarUrl ?? undefined, onboardingComplete: true })
      .where(eq(userProfilesTable.id, USER_ID))
      .returning();
  } else {
    [profile] = await db
      .insert(userProfilesTable)
      .values({ displayName, avatarUrl: avatarUrl ?? undefined, onboardingComplete: true })
      .returning();
  }

  // Upsert platform connections (must filter by userId to avoid cross-user collisions)
  for (const p of platforms) {
    const [exists] = await db
      .select()
      .from(platformConnectionsTable)
      .where(
        and(
          eq(platformConnectionsTable.userId, USER_ID),
          eq(platformConnectionsTable.platformId, p.platformId),
        ),
      );

    if (exists) {
      await db
        .update(platformConnectionsTable)
        .set({ handle: p.handle })
        .where(eq(platformConnectionsTable.id, exists.id));
    } else {
      await db.insert(platformConnectionsTable).values({
        userId: USER_ID,
        platformId: p.platformId,
        handle: p.handle,
      });
    }
  }

  const connections = await db
    .select()
    .from(platformConnectionsTable)
    .where(eq(platformConnectionsTable.userId, USER_ID));

  res.status(201).json(
    CreateUserProfileResponse.parse({
      id: profile.id,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl ?? null,
      onboardingComplete: profile.onboardingComplete,
      createdAt: profile.createdAt.toISOString(),
      lastSyncAt: profile.lastSyncAt?.toISOString() ?? null,
      platforms: connections.map((c) => ({ platformId: c.platformId, handle: c.handle })),
    }),
  );
});

router.patch("/user/profile", async (req, res): Promise<void> => {
  const parsed = UpdateUserProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { displayName, avatarUrl, platforms } = parsed.data;

  await db
    .update(userProfilesTable)
    .set({
      ...(displayName !== undefined ? { displayName } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      onboardingComplete: true,
    })
    .where(eq(userProfilesTable.id, USER_ID));

  if (platforms !== undefined) {
    const submittedIds = new Set(platforms.map((p) => p.platformId));

    // Delete any connections that were cleared (not present in submitted list)
    const existing = await db
      .select()
      .from(platformConnectionsTable)
      .where(eq(platformConnectionsTable.userId, USER_ID));

    for (const conn of existing) {
      if (!submittedIds.has(conn.platformId)) {
        await db
          .delete(platformConnectionsTable)
          .where(eq(platformConnectionsTable.id, conn.id));
      }
    }

    // Upsert the ones that are present
    for (const p of platforms) {
      const [existingConn] = await db
        .select()
        .from(platformConnectionsTable)
        .where(
          and(
            eq(platformConnectionsTable.userId, USER_ID),
            eq(platformConnectionsTable.platformId, p.platformId),
          ),
        );

      if (existingConn) {
        await db
          .update(platformConnectionsTable)
          .set({ handle: p.handle })
          .where(eq(platformConnectionsTable.id, existingConn.id));
      } else {
        await db.insert(platformConnectionsTable).values({
          userId: USER_ID,
          platformId: p.platformId,
          handle: p.handle,
        });
      }
    }
  }

  const [profile] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.id, USER_ID));

  const connections = await db
    .select()
    .from(platformConnectionsTable)
    .where(eq(platformConnectionsTable.userId, USER_ID));

  res.json(
    UpdateUserProfileResponse.parse({
      id: profile.id,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl ?? null,
      onboardingComplete: profile.onboardingComplete,
      createdAt: profile.createdAt.toISOString(),
      lastSyncAt: profile.lastSyncAt?.toISOString() ?? null,
      platforms: connections.map((c) => ({ platformId: c.platformId, handle: c.handle })),
    }),
  );
});

export default router;
