// One rendered content block - matches renderContentBlocks()'s output exactly
// (see content-blocks.util.js). NOT an HTML string: both blog posts and product
// long descriptions are stored as an ordered array of structured blocks
// (paragraph/heading/image/gallery/quote/list/video/table/cards/callout/faq/cta/
// divider/serviceReference/productReference), so the shared <app-content-blocks>
// component (src/app/shared/ui/content-blocks/) switches on `tip` and renders each
// block type's own markup rather than binding this to [innerHTML]. Lives in
// core/models (not blog's or shop's own models) because it's shared by both features.
export interface ContentBlockImage {
  url: string | null;
  alt: string | null;
}

export interface ContentBlockFaqItem {
  question: string;
  answer: string;
}

export interface ContentBlockCard {
  icon?: string | null;
  title?: string | null;
  text?: string | null;
}

export interface ContentBlockButton {
  tekst?: string | null;
  url?: string | null;
}

export interface ContentBlock {
  tip: string;
  tekst: string | null;
  nivo: number | null;
  slika: ContentBlockImage | null;
  galerija: ContentBlockImage[] | null;
  video: { url?: string; title?: string; thumbnail?: string; isExternal?: boolean } | null;
  stavke: string[] | null;
  uredjeno: boolean;
  izvor: string | null;
  kolone: string[] | null;
  redovi: { label?: string; values?: string[] }[] | null;
  kartice: ContentBlockCard[] | null;
  naslovBloka: string | null;
  varijanta: 'info' | 'success' | 'warning' | 'danger';
  faqStavke: ContentBlockFaqItem[] | null;
  dugme: ContentBlockButton | null;
}
