import { PiCheckCircle, PiWarningCircle, PiX } from "react-icons/pi"

/**
 * Always-mounted live regions for the dashboards' message/error pair.
 * `message` -> polite status, `error` -> assertive alert.
 */
export function StatusBanner({ message, error, onDismiss, errorId }) {
  return (
    <div className="shrink-0 space-y-2 empty:hidden">
      <div role="status" aria-live="polite" className="empty:hidden">
        {message ? (
          <p className="flex items-start gap-2 rounded-xl border border-success/30 bg-success-bg px-4 py-3 text-sm text-success">
            <PiCheckCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{message}</span>
            {onDismiss && (
              <button type="button" onClick={() => onDismiss("message")} aria-label="Dismiss message" className="press rounded p-0.5">
                <PiX className="size-4" aria-hidden="true" />
              </button>
            )}
          </p>
        ) : null}
      </div>
      <div role="alert" aria-live="assertive" className="empty:hidden">
        {error ? (
          <p id={errorId} className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
            <PiWarningCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{error}</span>
            {onDismiss && (
              <button type="button" onClick={() => onDismiss("error")} aria-label="Dismiss error" className="press rounded p-0.5">
                <PiX className="size-4" aria-hidden="true" />
              </button>
            )}
          </p>
        ) : null}
      </div>
    </div>
  )
}
