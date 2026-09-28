import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { ContentBlocks } from '../../../../shared/ui/content-blocks/content-blocks';
import { PostDetail } from '../../models/post';
import { slugify } from '../../../../core/utils/slugify';

export interface TocEntry {
  id: string;
  text: string;
  /** Content-block heading level (2 or 3) - level-2 entries render flush,
   * level-3 (and anything deeper) get an indent in the sidebar. */
  level: number;
}

@Component({
  selector: 'app-blog-detail',
  imports: [CommonModule, RouterLink, MatChipsModule, ImageUrlPipe, ContentBlocks],
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.scss',
})
export class BlogDetail {
  post = input<PostDetail | null>(null);

  /** "SADRŽAJ" sidebar entries, one per heading block in the post body. The
   * id here MUST match content-blocks.ts's headingId() (same slugify(text)
   * + block-array-index scheme) since that's what stamps the [id] the anchor
   * links jump to - both derive it from the raw block array rather than a
   * filtered "headings only" list so the index lines up. */
  toc = computed<TocEntry[]>(() => {
    const blocks = this.post()?.sadrzaj ?? [];
    return blocks
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => block.tip === 'heading' && (block.nivo === 2 || block.nivo === 3) && !!block.tekst)
      .map(({ block, index }) => ({
        id: `${slugify(block.tekst || 'sekcija')}-${index}`,
        text: block.tekst!,
        level: block.nivo!,
      }));
  });

  /** autor.avatar can be an ImageDisplay object or a plain url string (same
   * shape ambiguity as PostAdminDetail's autor.avatar) - normalize here so the
   * template doesn't need a typeof check. */
  authorAvatarUrl(): string | null {
    const avatar = this.post()?.autor.avatar;
    if (!avatar) return null;
    return typeof avatar === 'string' ? avatar : avatar.url;
  }

  /** Scrolls to a heading by its own coordinates rather than a plain
   * scrollIntoView({block:'start'}) - the site header is `position: sticky`
   * (see layout/header/header.scss), so a bare scrollIntoView lands the
   * heading's top edge exactly where the fixed header sits, visually cutting
   * the heading text off behind it (this was the reported bug: clicking a
   * "Sadržaj" entry "prebaci na pocetak teksta i odsece naslov"). Reading the
   * header's live offsetHeight (rather than a guessed CSS scroll-margin-top
   * constant) keeps this correct whether the header is one row or has wrapped
   * to two on a narrow screen. */
  scrollToHeading(id: string, event: Event): void {
    event.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const header = document.querySelector('app-header') as HTMLElement | null;
    const headerHeight = header?.offsetHeight ?? 0;
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}
