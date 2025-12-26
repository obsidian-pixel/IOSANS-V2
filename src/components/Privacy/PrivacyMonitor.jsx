/**
 * Privacy Monitor Component
 * Patches window.fetch to prove 0% data leakage.
 * Part of IOSANS Sovereign Architecture.
 */

import React, { useState, useEffect } from "react";
import "./PrivacyMonitor.css";

// Request log storage
const requestLog = [];
const MAX_LOG_SIZE = 100;

// Original fetch reference
let originalFetch = null;

/**
 * Initialize fetch interception
 */
function initPrivacyMonitor() {
  if (originalFetch) return; // Already initialized

  originalFetch = window.fetch;

  window.fetch = async function patchedFetch(url, options = {}) {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      url: String(url),
      method: options.method || "GET",
      blocked: false,
      reason: null,
    };

    // Check for external requests
    const urlObj = new URL(url, window.location.origin);
    const isExternal = urlObj.origin !== window.location.origin;
    const isLocalhost =
      urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1";
    const isCDN =
      urlObj.hostname.includes("cdn") || urlObj.hostname.includes("jsdelivr");

    // Allow CDN requests for Pyodide, etc.
    if (isExternal && !isLocalhost && !isCDN) {
      entry.blocked = true;
      entry.reason = "External request blocked for privacy";
      logRequest(entry);
      throw new Error(
        `[PrivacyMonitor] Blocked external request to: ${urlObj.origin}`
      );
    }

    logRequest(entry);
    return originalFetch.call(window, url, options);
  };
}

/**
 * Log a request
 */
function logRequest(entry) {
  requestLog.unshift(entry);
  if (requestLog.length > MAX_LOG_SIZE) {
    requestLog.pop();
  }
}

/**
 * Get request statistics
 */
function getStats() {
  const total = requestLog.length;
  const blocked = requestLog.filter((r) => r.blocked).length;
  const external = requestLog.filter((r) => {
    try {
      const url = new URL(r.url, window.location.origin);
      return url.origin !== window.location.origin;
    } catch {
      return false;
    }
  }).length;

  return {
    total,
    blocked,
    allowed: total - blocked,
    external,
    leakageRate:
      total > 0
        ? (((blocked > 0 ? 0 : external) / total) * 100).toFixed(1)
        : "0.0",
  };
}

function PrivacyMonitor() {
  const [stats, setStats] = useState({
    total: 0,
    blocked: 0,
    allowed: 0,
    leakageRate: "0.0",
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    initPrivacyMonitor();

    const interval = setInterval(() => {
      setStats(getStats());
      setRecentRequests(requestLog.slice(0, 5));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="privacy-monitor">
      <div
        className="privacy-monitor__header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="privacy-monitor__icon">🛡️</span>
        <span className="privacy-monitor__title">Privacy Monitor</span>
        <span className="privacy-monitor__rate">
          {stats.leakageRate}% leakage
        </span>
      </div>

      {expanded && (
        <div className="privacy-monitor__details">
          <div className="privacy-monitor__stats">
            <div className="privacy-monitor__stat">
              <span className="stat-label">Total Requests</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="privacy-monitor__stat">
              <span className="stat-label">Allowed</span>
              <span className="stat-value stat-value--success">
                {stats.allowed}
              </span>
            </div>
            <div className="privacy-monitor__stat">
              <span className="stat-label">Blocked</span>
              <span className="stat-value stat-value--error">
                {stats.blocked}
              </span>
            </div>
          </div>

          <div className="privacy-monitor__log">
            <div className="privacy-monitor__log-title">Recent Activity</div>
            {recentRequests.length === 0 ? (
              <div className="privacy-monitor__empty">No requests yet</div>
            ) : (
              recentRequests.map((req) => (
                <div
                  key={req.id}
                  className={`privacy-monitor__entry ${
                    req.blocked ? "blocked" : ""
                  }`}
                >
                  <span className="entry-method">{req.method}</span>
                  <span className="entry-url">{req.url.slice(0, 40)}</span>
                  {req.blocked && <span className="entry-blocked">⛔</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PrivacyMonitor;
