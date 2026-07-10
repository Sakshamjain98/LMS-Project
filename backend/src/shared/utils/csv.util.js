// Minimal CSV builder — quotes any field containing a comma, quote, or newline.
const escapeCell = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

// columns: [{ header, key }] reads row[key]; [{ header, value: (row) => ... }] computes it.
export const toCsv = (rows, columns) => {
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((c) => escapeCell(c.value ? c.value(row) : row[c.key]))
      .join(",")
  );
  return [header, ...lines].join("\r\n");
};
