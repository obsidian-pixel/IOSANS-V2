/**
 * Artifact Storage Utility
 * IndexedDB-based local storage for binary artifacts.
 * Part of IOSANS Sovereign Architecture - Local-First, Privacy-guaranteed.
 */

import { openDB } from "idb";
import { v4 as uuidv4 } from "uuid";

const DB_NAME = "IOSANS_DB";
const DB_VERSION = 1;
const ARTIFACTS_STORE = "artifacts";

/**
 * Gets or creates the IndexedDB database instance.
 * @returns {Promise<IDBDatabase>}
 */
async function getDatabase() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create artifacts store with id as keyPath
      if (!db.objectStoreNames.contains(ARTIFACTS_STORE)) {
        const store = db.createObjectStore(ARTIFACTS_STORE, { keyPath: "id" });
        // Create indexes for efficient querying
        store.createIndex("type", "type");
        store.createIndex("createdAt", "createdAt");
        console.log("[ArtifactStorage] Created artifacts store");
      }
    },
  });
}

/**
 * Saves a binary artifact to IndexedDB.
 * @param {Blob} blob - The binary data to store
 * @param {string} type - The artifact type (e.g., 'model', 'image', 'audio')
 * @returns {Promise<string>} The generated UUID for the artifact
 */
export async function saveArtifact(blob, type) {
  if (!(blob instanceof Blob)) {
    throw new Error("[ArtifactStorage] Invalid blob: expected Blob instance");
  }

  if (!type || typeof type !== "string") {
    throw new Error(
      "[ArtifactStorage] Invalid type: expected non-empty string"
    );
  }

  const db = await getDatabase();
  const id = uuidv4();

  const artifact = {
    id,
    blob,
    type,
    size: blob.size,
    mimeType: blob.type,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.put(ARTIFACTS_STORE, artifact);

  console.log(
    `[ArtifactStorage] Saved artifact: ${id} (${type}, ${blob.size} bytes)`
  );

  return id;
}

/**
 * Retrieves an artifact from IndexedDB by its ID.
 * @param {string} id - The UUID of the artifact
 * @returns {Promise<Blob|null>} The artifact blob, or null if not found
 */
export async function getArtifact(id) {
  if (!id || typeof id !== "string") {
    throw new Error("[ArtifactStorage] Invalid id: expected non-empty string");
  }

  const db = await getDatabase();
  const artifact = await db.get(ARTIFACTS_STORE, id);

  if (!artifact) {
    console.warn(`[ArtifactStorage] Artifact not found: ${id}`);
    return null;
  }

  console.log(`[ArtifactStorage] Retrieved artifact: ${id} (${artifact.type})`);

  return artifact.blob;
}

/**
 * Deletes an artifact from IndexedDB.
 * @param {string} id - The UUID of the artifact to delete
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function deleteArtifact(id) {
  if (!id || typeof id !== "string") {
    throw new Error("[ArtifactStorage] Invalid id: expected non-empty string");
  }

  const db = await getDatabase();
  const artifact = await db.get(ARTIFACTS_STORE, id);

  if (!artifact) {
    console.warn(`[ArtifactStorage] Cannot delete - artifact not found: ${id}`);
    return false;
  }

  await db.delete(ARTIFACTS_STORE, id);
  console.log(`[ArtifactStorage] Deleted artifact: ${id}`);

  return true;
}

/**
 * Lists all artifacts of a specific type.
 * @param {string} type - The artifact type to filter by (optional)
 * @returns {Promise<Array>} Array of artifact metadata (without blob data)
 */
export async function listArtifacts(type = null) {
  const db = await getDatabase();

  let artifacts;
  if (type) {
    artifacts = await db.getAllFromIndex(ARTIFACTS_STORE, "type", type);
  } else {
    artifacts = await db.getAll(ARTIFACTS_STORE);
  }

  // Return metadata only, exclude blob to reduce memory usage
  return artifacts.map(
    ({ id, type, size, mimeType, createdAt, updatedAt }) => ({
      id,
      type,
      size,
      mimeType,
      createdAt,
      updatedAt,
    })
  );
}

/**
 * Gets the total storage usage of all artifacts.
 * @returns {Promise<{count: number, totalSize: number}>}
 */
export async function getStorageStats() {
  const db = await getDatabase();
  const artifacts = await db.getAll(ARTIFACTS_STORE);

  const stats = {
    count: artifacts.length,
    totalSize: artifacts.reduce((sum, a) => sum + (a.size || 0), 0),
  };

  console.log(
    `[ArtifactStorage] Storage stats: ${stats.count} artifacts, ${stats.totalSize} bytes`
  );

  return stats;
}

/**
 * Clears all artifacts from the database.
 * USE WITH CAUTION - This operation is irreversible.
 * @returns {Promise<void>}
 */
export async function clearAllArtifacts() {
  const db = await getDatabase();
  await db.clear(ARTIFACTS_STORE);
  console.log("[ArtifactStorage] Cleared all artifacts");
}
