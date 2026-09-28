// The DB-backed content's "why us"/highlight items (see
// core/models/site-content.ts's WhyUsItem) store an icon slug as a Bootstrap
// Icons class name ("bi-cpu", "bi-patch-check"...) - that's what the OLD EJS
// site rendered directly (it loads the Bootstrap Icons font), but this
// Angular app doesn't load that font anywhere and renders every other icon
// through Angular Material's <mat-icon> instead. Rather than pulling in a
// second icon font just for a handful of home/team-page icons, this maps the
// known slugs onto their closest Material Symbols equivalent. Unknown slugs
// (e.g. a new one an admin picks that isn't listed here) fall back to a
// plain star rather than rendering nothing.
const BI_TO_MATERIAL_ICON: Record<string, string> = {
  'bi-cpu': 'memory',
  'bi-patch-check': 'verified',
  'bi-person-heart': 'favorite',
  'bi-flower1': 'spa',
  'bi-heart-pulse': 'monitor_heart',
  'bi-calendar-check': 'event_available',
};

export function biIconToMaterial(biClass: string | undefined): string {
  return (biClass && BI_TO_MATERIAL_ICON[biClass]) || 'star';
}
