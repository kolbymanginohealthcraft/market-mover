import { useEffect, useCallback } from "react";

/**
 * Hook for managing map tooltip closing behavior
 * Extends the dropdown close behavior to handle map-specific scenarios
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.tooltip - The tooltip object (e.g., MapLibre popup)
 * @param {Function} options.closeCallback - Function to call when closing tooltip
 * @param {boolean} options.isOpen - Whether tooltip is currently open
 * @param {string} options.tooltipSelector - CSS selector for the tooltip (optional)
 * @param {string} options.markerSelector - CSS selector for map markers (optional)
 * @returns {Object} - Returns closeTooltip function
 */
export function useMapTooltipClose({
  tooltip,
  closeCallback,
  isOpen = true,
  tooltipSelector = '.maplibregl-popup',
  markerSelector = '.maplibregl-marker'
}) {
  // Function to close tooltip
  const closeTooltip = useCallback(() => {
    if (tooltip && typeof tooltip.remove === 'function') {
      tooltip.remove();
    }
    if (typeof closeCallback === 'function') {
      closeCallback();
    }
  }, [tooltip, closeCallback]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeTooltip();
      }
    };

    const handleClickOutside = (e) => {
      // Check if click is outside the tooltip and not on a map marker
      if (tooltip && 
          !e.target.closest(tooltipSelector) && 
          !e.target.closest(markerSelector)) {
        closeTooltip();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, tooltip, tooltipSelector, markerSelector, closeTooltip]);

  return { closeTooltip };
}
