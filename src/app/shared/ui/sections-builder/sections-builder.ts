import { Component, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ContentSection, ContentSubsection } from '../../../core/models/site-content';

type SectionArrayField = 'paragraphs' | 'list' | 'closingParagraphs';

function emptySection(): ContentSection {
  return { title: '', paragraphs: [], list: [], closingParagraphs: [], subsections: [] };
}

function emptySubsection(): ContentSubsection {
  return { title: '', paragraphs: [], list: [], closingParagraphs: [] };
}

/**
 * Visual, no-code builder for `ContentSection[]` - the nested shape shared by
 * the About page, Privacy Policy and Terms & Conditions (see
 * core/models/site-content.ts's ContentSection/ContentSubsection, and the
 * public `content-sections` component that renders the exact same shape on
 * the live site: title, then paragraphs, then a bullet list, then closing
 * paragraphs, then one level of nested subsections in the same shape).
 *
 * Replaces an earlier version of this admin screen that edited `sections` as
 * a raw JSON textarea - Milan asked for something a non-technical admin can
 * use, so this instead gives every piece of content its own plain field with
 * "Dodaj ..." buttons per content type (pasus / stavka liste / završni pasus
 * / pod-sekcija) and up/down arrows to reorder sections - no braces, no
 * quotes, nothing that looks like code. The rendering ORDER on the public
 * site is fixed (paragraphs, then list, then closing paragraphs, then
 * subsections - see content-sections.html), so this editor doesn't need a
 * single interleaved "blocks" list; four clearly-labeled groups per section
 * map onto that fixed order directly and are simpler to build and to use.
 *
 * Two-way bound via Angular's signal `model()` - `<app-sections-builder
 * [(sections)]="mySectionsSignal" />` - so the parent form's signal updates
 * in place without any manual event wiring.
 */
@Component({
  selector: 'app-sections-builder',
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './sections-builder.html',
  styleUrl: './sections-builder.scss',
})
export class SectionsBuilder {
  sections = model.required<ContentSection[]>();

  // ---- Sections (top level) ----

  addSection(): void {
    this.sections.update((list) => [...list, emptySection()]);
  }

  removeSection(index: number): void {
    this.sections.update((list) => list.filter((_, i) => i !== index));
  }

  moveSection(index: number, direction: -1 | 1): void {
    this.sections.update((list) => {
      const target = index + direction;
      if (target < 0 || target >= list.length) return list;
      const copy = [...list];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  updateSectionTitle(index: number, title: string): void {
    this.sections.update((list) => list.map((s, i) => (i === index ? { ...s, title } : s)));
  }

  // ---- Paragraphs / list items / closing paragraphs (shared shape, one level) ----

  addSectionItem(index: number, field: SectionArrayField): void {
    this.sections.update((list) => list.map((s, i) => (i === index ? { ...s, [field]: [...(s[field] ?? []), ''] } : s)));
  }

  updateSectionItem(index: number, field: SectionArrayField, itemIndex: number, value: string): void {
    this.sections.update((list) =>
      list.map((s, i) => {
        if (i !== index) return s;
        const items = [...(s[field] ?? [])];
        items[itemIndex] = value;
        return { ...s, [field]: items };
      })
    );
  }

  removeSectionItem(index: number, field: SectionArrayField, itemIndex: number): void {
    this.sections.update((list) =>
      list.map((s, i) => (i === index ? { ...s, [field]: (s[field] ?? []).filter((_, j) => j !== itemIndex) } : s))
    );
  }

  // ---- Subsections (one nested level, same field shape minus further subsections) ----

  addSubsection(index: number): void {
    this.sections.update((list) =>
      list.map((s, i) => (i === index ? { ...s, subsections: [...(s.subsections ?? []), emptySubsection()] } : s))
    );
  }

  removeSubsection(index: number, subIndex: number): void {
    this.sections.update((list) =>
      list.map((s, i) => (i === index ? { ...s, subsections: (s.subsections ?? []).filter((_, j) => j !== subIndex) } : s))
    );
  }

  updateSubsectionTitle(index: number, subIndex: number, title: string): void {
    this.sections.update((list) =>
      list.map((s, i) => {
        if (i !== index) return s;
        const subsections = (s.subsections ?? []).map((sub, j) => (j === subIndex ? { ...sub, title } : sub));
        return { ...s, subsections };
      })
    );
  }

  addSubsectionItem(index: number, subIndex: number, field: SectionArrayField): void {
    this.sections.update((list) =>
      list.map((s, i) => {
        if (i !== index) return s;
        const subsections = (s.subsections ?? []).map((sub, j) => (j === subIndex ? { ...sub, [field]: [...(sub[field] ?? []), ''] } : sub));
        return { ...s, subsections };
      })
    );
  }

  updateSubsectionItem(index: number, subIndex: number, field: SectionArrayField, itemIndex: number, value: string): void {
    this.sections.update((list) =>
      list.map((s, i) => {
        if (i !== index) return s;
        const subsections = (s.subsections ?? []).map((sub, j) => {
          if (j !== subIndex) return sub;
          const items = [...(sub[field] ?? [])];
          items[itemIndex] = value;
          return { ...sub, [field]: items };
        });
        return { ...s, subsections };
      })
    );
  }

  removeSubsectionItem(index: number, subIndex: number, field: SectionArrayField, itemIndex: number): void {
    this.sections.update((list) =>
      list.map((s, i) => {
        if (i !== index) return s;
        const subsections = (s.subsections ?? []).map((sub, j) =>
          j === subIndex ? { ...sub, [field]: (sub[field] ?? []).filter((_, k) => k !== itemIndex) } : sub
        );
        return { ...s, subsections };
      })
    );
  }
}
