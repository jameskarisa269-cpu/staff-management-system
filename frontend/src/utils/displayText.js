export function cleanSeedPrefix(value) {
  return typeof value === "string"
    ? value.replace(/^(?:DEMO DATA|Sample data)\s*-\s*/i, "")
    : value;
}

const seededAssetDescriptions = {
  "AST-1001": "Assigned office laptop.",
  "AST-1002": "Assigned desktop workstation.",
  "AST-1003": "Assigned department laptop.",
  "AST-1004": "Meeting room projector available for use.",
  "AST-1005": "Office printer located in Administration.",
  "AST-1006": "Network switch for office network connectivity.",
  "AST-1007": "Backup laptop currently under maintenance.",
  "AST-1008": "Office phone retired from service.",
};

export function cleanAssetDescription(asset) {
  const description = cleanSeedPrefix(asset.description)?.trim();
  if (!description) return "";

  if (
    /^replace with the organisation asset record\.?$/i.test(description) ||
    /^(?:available inventory sample|currently undergoing maintenance|retired inventory sample)\.?$/i.test(description)
  ) {
    return seededAssetDescriptions[asset.asset_tag] || "";
  }

  return description;
}
