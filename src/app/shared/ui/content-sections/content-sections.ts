import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentSection } from '../../../core/models/site-content';

/**
 * Renders a ContentSection[] (see core/models/site-content.ts) - the shape
 * shared by the About, Privacy Policy and Terms & Conditions pages: a title
 * plus any mix of paragraphs / a bullet list / one nested level of
 * subsections / closing paragraphs after a list. Shared here rather than
 * duplicated three times since all three pages render this identically (only
 * the intro/lastUpdated chrome around it differs per page).
 *
 * Paragraphs/list items/closingParagraphs are bound with [innerHTML], not
 * plain text interpolation - this content is admin-authored (edited through
 * the Site Content admin screen, not user-submitted) and deliberately
 * contains inline markup (<strong>, <a href>) the same way the old
 * EJS templates rendered it unescaped (<%- %>) - see
 * site-content-defaults.js on the backend for the exact source text.
 */
@Component({
  selector: 'app-content-sections',
  imports: [CommonModule],
  templateUrl: './content-sections.html',
  styleUrl: './content-sections.scss',
})
export class ContentSections {
  sections = input<ContentSection[]>([]);
}
