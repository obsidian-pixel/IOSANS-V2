/**
 * Hardware Detection Utility
 * Probes the user's hardware capabilities for WebGPU and VRAM estimation.
 * Part of IOSANS Sovereign Architecture - Local-First, WebGPU-native.
 */

/**
 * Detects hardware capabilities including WebGPU support and estimated VRAM.
 * @returns {Promise<{vram: number, hasWebGPU: boolean, tier: "low"|"high"}>}
 */
export async function detectHardware() {
  const result = {
    vram: 0,
    hasWebGPU: false,
    tier: "low",
  };

  // Check for WebGPU support
  if (!navigator.gpu) {
    console.warn("[HardwareDetection] WebGPU not supported in this browser.");
    return result;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      console.warn("[HardwareDetection] No GPU adapter available.");
      return result;
    }

    result.hasWebGPU = true;

    // Query adapter limits to estimate VRAM
    const limits = adapter.limits;

    // Estimate VRAM from maxBufferSize (in bytes, convert to GB)
    const maxBufferSizeGB = limits.maxBufferSize / (1024 * 1024 * 1024);

    // Use maxStorageBufferBindingSize as another VRAM indicator
    const maxStorageGB =
      limits.maxStorageBufferBindingSize / (1024 * 1024 * 1024);

    // Take the larger of the two estimates
    result.vram = Math.max(maxBufferSizeGB, maxStorageGB);

    // Round to 2 decimal places
    result.vram = Math.round(result.vram * 100) / 100;

    // Tier classification: high if VRAM >= 6GB
    result.tier = result.vram >= 6 ? "high" : "low";

    // Attempt to get adapter info (not available in all browsers)
    try {
      if (typeof adapter.requestAdapterInfo === "function") {
        const adapterInfo = await adapter.requestAdapterInfo();
        console.log("[HardwareDetection] Adapter Info:", {
          vendor: adapterInfo.vendor || "unknown",
          architecture: adapterInfo.architecture || "unknown",
          device: adapterInfo.device || "unknown",
          description: adapterInfo.description || "unknown",
        });
      } else if (adapter.info) {
        // Fallback for browsers that use adapter.info property
        console.log("[HardwareDetection] Adapter Info:", {
          vendor: adapter.info.vendor || "unknown",
          architecture: adapter.info.architecture || "unknown",
          device: adapter.info.device || "unknown",
          description: adapter.info.description || "unknown",
        });
      } else {
        console.log(
          "[HardwareDetection] Adapter info not available in this browser."
        );
      }
    } catch (infoError) {
      console.log(
        "[HardwareDetection] Could not retrieve adapter info:",
        infoError.message
      );
    }
  } catch (error) {
    console.error("[HardwareDetection] Error detecting hardware:", error);
  }

  return result;
}

/**
 * Logs hardware detection results to the console.
 * Used for validation during Phase 1.
 */
export async function validateHardwareDetection() {
  console.log("[HardwareDetection] Starting hardware detection...");
  const hardware = await detectHardware();

  console.log("[HardwareDetection] Results:", {
    "VRAM (GB)": hardware.vram,
    "WebGPU Support": hardware.hasWebGPU,
    "Performance Tier": hardware.tier,
  });

  return hardware;
}
