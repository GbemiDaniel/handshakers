import React from "react";

/**
 * BaseCard Component
 * Encapsulates flat, bordered container rules:
 * - Solid white background (bg-white)
 * - Container query wrapper (@container)
 * - Cubic-bezier motion timing (200ms cubic-bezier(0.4, 0, 0.2, 1))
 * - Fluid padding & intrinsic overflow defense (min-width: 0)
 */
export default function BaseCard({
  children,
  className = "",
  title,
  subtitle,
  headerAction,
  footer,
  padding = "p-4 sm:p-6 lg:p-7",
  ...props
}) {
  return (
    <div
      className={`@container bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs transition-all duration-200 ease-in-out hover:border-slate-300/90 dark:hover:border-slate-700 ${padding} ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 min-w-0">
          <div className="w-full flex-1 min-w-0">
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-snug wrap-break-word">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-normal wrap-break-word">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="shrink-0 self-start sm:self-auto mt-0.5 sm:mt-0 min-w-0">
              {headerAction}
            </div>
          )}
        </div>
      )}
      
      <div className="w-full min-w-0">{children}</div>

      {footer && (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs sm:text-sm text-slate-500 dark:text-slate-400 min-w-0">
          {footer}
        </div>
      )}
    </div>
  );
}

