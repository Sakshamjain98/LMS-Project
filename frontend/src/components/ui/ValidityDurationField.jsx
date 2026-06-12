import { useState } from "react";

// Preset validity durations (in months) offered to admins. "Custom Duration"
// reveals a free number input. 0 = no expiry (lifetime).
export const VALIDITY_PRESETS = [1, 3, 6, 9, 12];

/**
 * Controlled validity-duration picker. `months` is the numeric value (0 =
 * lifetime); `onChange(months)` is called with the resolved number.
 *
 * `className` is applied to the select + custom input so the field matches the
 * surrounding form (pass the form's input class).
 */
export default function ValidityDurationField({ months = 0, onChange, className = "" }) {
  const numeric = Number(months) || 0;
  const startsCustom = numeric > 0 && !VALIDITY_PRESETS.includes(numeric);
  const [custom, setCustom] = useState(startsCustom);

  const selectValue = custom ? "custom" : String(numeric);

  return (
    <div className="space-y-2">
      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "custom") {
            setCustom(true);
          } else {
            setCustom(false);
            onChange(Number(v));
          }
        }}
        className={className}
      >
        <option value="0">No expiry (lifetime)</option>
        <option value="1">1 Month</option>
        <option value="3">3 Months</option>
        <option value="6">6 Months</option>
        <option value="9">9 Months</option>
        <option value="12">12 Months</option>
        <option value="custom">Custom Duration</option>
      </select>
      {custom && (
        <input
          type="number"
          min="1"
          value={numeric || ""}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          placeholder="Validity in months"
          className={className}
        />
      )}
    </div>
  );
}
