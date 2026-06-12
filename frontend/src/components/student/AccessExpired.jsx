import { Clock, RefreshCw, ShoppingCart } from "lucide-react";

/**
 * Dedicated "Access Expired" screen shown when a student opens premium content
 * whose subscription has lapsed (or was revoked). Account access is unaffected —
 * this only gates the premium item. Both buttons trigger the repurchase flow.
 *
 * Props:
 *  - title      override the heading (default "Access Expired")
 *  - message    override the body copy
 *  - expiresAt  optional date to show when access ended
 *  - disabled   when true, copy reflects an admin-disabled grant
 *  - onRenew    handler for "Renew Access" (defaults to onBuy)
 *  - onBuy      handler for "Buy Again"
 *  - busy       disables buttons while a purchase is in flight
 *  - compact    render as an inline card rather than a full-height screen
 */
export default function AccessExpired({
  title = "Access Expired",
  message,
  expiresAt,
  disabled = false,
  onRenew,
  onBuy,
  busy = false,
  compact = false,
}) {
  const body =
    message ||
    (disabled
      ? "Your access to this course or test series has been disabled. Renew your access to continue learning and regain all premium content."
      : "Your subscription for this course or test series has expired. Renew your access to continue learning and regain access to all premium content.");

  const renew = onRenew || onBuy;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-10 px-6" : "min-h-[60vh] px-6"
      }`}
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5">
        <Clock size={30} className="text-amber-400" />
      </div>
      <h2 className="text-2xl font-extrabold text-white">{title}</h2>
      <p className="mt-3 max-w-md text-sm text-white/60 leading-relaxed">{body}</p>
      {expiresAt && (
        <p className="mt-2 text-xs text-white/40">
          Access ended on{" "}
          {new Date(expiresAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
      <div className="mt-7 flex flex-col sm:flex-row gap-3">
        <button
          onClick={renew}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-primary text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} /> {busy ? "Processing…" : "Renew Access"}
        </button>
        <button
          onClick={onBuy}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/15 bg-white/5 text-white font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <ShoppingCart size={16} /> Buy Again
        </button>
      </div>
    </div>
  );
}
