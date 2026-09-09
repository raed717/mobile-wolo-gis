/**
 * Set of attribute and property keys reserved for internal GIS styling or geometry rendering.
 * These should be hidden from shape management views, modal attribute inspectors,
 * and field capture forms unless specifically intended for schema editing.
 */
export const HIDDEN_STYLING_ATTRIBUTE_NAMES: readonly string[] = [
  'Fill Color',
  'Opacity',
  'Stroke Col',
  'Stroke Wid',
  'Stroke Width',
  'Dash Patt',
  'markShape',
  'markerSize',
  'icon',
  'radius',
  'Obj Name', // Displayed prominently as title/header
  'name',     // Displayed prominently as title/header
  'id',
  'projectId',
  'createdAt',
  'createdBy',
  'updatedAt',
  'isImported',
];

const HIDDEN_KEYS_SET = new Set(
  HIDDEN_STYLING_ATTRIBUTE_NAMES.map((k) => k.toLowerCase().trim())
);

/**
 * Check if an attribute name or GeoJSON property key is a styling / internal metadata field.
 */
export function isStylingOrInternalAttribute(name?: string | null): boolean {
  if (!name) return true;
  const normalized = name.toLowerCase().trim();
  return HIDDEN_KEYS_SET.has(normalized);
}

/**
 * Filter out styling and internal attributes from a shape's attributes list.
 */
export function filterVisibleShapeAttributes<T extends { name: string }>(attributes: T[] = []): T[] {
  return attributes.filter((attr) => !isStylingOrInternalAttribute(attr.name));
}

/**
 * Filter out styling and internal properties from a GeoJSON feature's properties dictionary.
 */
export function filterVisibleFeatureProperties(
  properties: Record<string, any> = {}
): [string, any][] {
  return Object.entries(properties).filter(
    ([key]) => !isStylingOrInternalAttribute(key)
  );
}
