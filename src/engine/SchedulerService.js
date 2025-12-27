/**
 * Scheduler Service
 * Handles periodic checking of ScheduleTriggerNodes.
 * Implements a lightweight Cron parser for standard 5-part syntax.
 * Part of IOSANS Sovereign Architecture.
 */

class SchedulerService {
  constructor() {
    this.lastCheckTime = null;
  }

  /**
   * Checks if a node should trigger based on its cron expression
   * @param {Object} node - The ScheduleTriggerNode
   * @param {Date} [now] - Current time (defaults to new Date())
   * @returns {boolean}
   */
  shouldTrigger(node, now = new Date()) {
    if (!node.data || !node.data.enabled || !node.data.cronExpression) {
      return false;
    }

    // Round down to current minute to avoid double triggers within the same minute
    // Logic: We check if the current minute matches the cron.
    // To prevent re-triggering, the caller must ensure it only checks once per minute,
    // OR we track last trigger time per node.
    // Ideally, the App main loop runs once per second, but we only trigger if we entered a new minute.

    // For simplicity here, we just return TRUE if it matches.
    // State management (deduplication) is up to the consumer or we can add it here.

    return this.matchesCron(node.data.cronExpression, now);
  }

  /**
   * Parses and matches cron expression
   * @param {string} cron - "* * * * *"
   * @param {Date} date
   */
  matchesCron(cron, date) {
    try {
      const parts = cron.trim().split(/\s+/);
      if (parts.length !== 5) return false;

      const [min, hour, dom, month, dow] = parts;

      const limits = [
        [0, 59], // min
        [0, 23], // hour
        [1, 31], // dom
        [1, 12], // month
        [0, 6], // dow (0=Sun)
      ];

      const current = [
        date.getMinutes(),
        date.getHours(),
        date.getDate(),
        date.getMonth() + 1,
        date.getDay(),
      ];

      return parts.every((part, i) =>
        this._checkPart(part, current[i], limits[i])
      );
    } catch (e) {
      console.error("Cron parse error", e);
      return false;
    }
  }

  _checkPart(part, value, [min, max]) {
    if (part === "*") return true;

    // List: "1,2,3"
    if (part.includes(",")) {
      return part.split(",").some((p) => this._checkPart(p, value, [min, max]));
    }

    // Step: "*/15" or "0-30/5"
    if (part.includes("/")) {
      const [range, stepStr] = part.split("/");
      const step = parseInt(stepStr, 10);
      if (isNaN(step)) return false;

      // Check if value is in range AND matches step
      if (range === "*") {
        return (value - min) % step === 0; // standard cron step from min
        // Actually usually */5 means "every 5th unit starting from min"
        // For minute 0-59: 0, 5, 10
      } else {
        // Range with step? "10-20/2"
        // Recurse for range check?
        // Let's keep it simple: "*/N" is common. "N/M" is rare in this UI.
        // The UI generates "*/N" (e.g. interval-minutes).
        return this._checkPart(range, value, [min, max]) && value % step === 0;
      }
    }

    // Range: "1-5"
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((v) => parseInt(v, 10));
      return value >= start && value <= end;
    }

    // Single value
    return parseInt(part, 10) === value;
  }
}

export const schedulerService = new SchedulerService();
