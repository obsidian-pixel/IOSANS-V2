/**
 * Auto Detect Type
 * MIME sensing utility for artifacts based on magic numbers and extensions.
 * Part of IOSANS Sovereign Architecture.
 */

const MIME_SIGNATURES = [
  {
    mime: "image/png",
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  {
    mime: "image/jpeg",
    signature: [0xff, 0xd8, 0xff],
  },
  {
    mime: "image/gif",
    signature: [0x47, 0x49, 0x46, 0x38],
  },
  {
    mime: "image/webp",
    signature: [0x52, 0x49, 0x46, 0x46], // incomplete check, but start
  },
  {
    mime: "audio/wav",
    signature: [0x52, 0x49, 0x46, 0x46], // check 8-11 for WAVE
  },
  {
    mime: "application/pdf",
    signature: [0x25, 0x50, 0x44, 0x46],
  },
];

/**
 * Detects MIME type from a Blob or ArrayBuffer
 * @param {Blob|ArrayBuffer} data
 * @param {string} [filename] - Optional filename fallback
 * @returns {Promise<string>} Detected MIME type
 */
export async function autoDetectType(data, filename) {
  let buffer;

  if (data instanceof Blob) {
    // If Blob already has a specific type (not generic application/octet-stream), trust it
    if (data.type && data.type !== "application/octet-stream") {
      return data.type;
    }
    buffer = await data.slice(0, 16).arrayBuffer();
  } else if (data instanceof ArrayBuffer) {
    buffer = data.slice(0, 16);
  } else {
    // Fallback to extension if no binary data
    return detectTypeFromExtension(filename) || "application/octet-stream";
  }

  const bytes = new Uint8Array(buffer);

  // Check magic numbers
  for (const { mime, signature } of MIME_SIGNATURES) {
    if (matchesSignature(bytes, signature)) {
      // Special case for RIFF (WAV vs WEBP)
      if (mime === "audio/wav" || mime === "image/webp") {
        return detectRiffType(bytes) || mime;
      }
      return mime;
    }
  }

  // Fallback
  return detectTypeFromExtension(filename) || "application/octet-stream";
}

function matchesSignature(bytes, signature) {
  if (bytes.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
}

function detectRiffType(bytes) {
  // Check bytes 8-11
  // 'WAVE' = 57 41 56 45
  // 'WEBP' = 57 45 42 50
  if (bytes.length < 12) return null;

  const subType = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (subType === "WAVE") return "audio/wav";
  if (subType === "WEBP") return "image/webp";
  return null;
}

export function detectTypeFromExtension(filename) {
  if (!filename) return null;
  const ext = filename.split(".").pop().toLowerCase();

  const map = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    wav: "audio/wav",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    json: "application/json",
    txt: "text/plain",
    md: "text/markdown",
    csv: "text/csv",
    pdf: "application/pdf",
  };

  return map[ext] || null;
}
