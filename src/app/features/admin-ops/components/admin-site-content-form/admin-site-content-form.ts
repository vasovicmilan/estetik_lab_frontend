import { SiteInfo } from '../../../../core/services/site-info';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AdminSiteContent } from '../../services/site-content';
import { SiteContentAll, SiteContentPageSeoEntry, SiteContentWhyUsItem } from '../../models/site-content';
import { ContentSection } from '../../../../core/models/site-content';
import { FormLayout } from '../../../../shared/ui/form-layout/form-layout';
import { FormSection } from '../../../../shared/ui/form-layout/form-section';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { SectionsBuilder } from '../../../../shared/ui/sections-builder/sections-builder';

/** Admin-editable marketing/legal CONTENT - About, FAQ, Politika privatnosti,
 * Uslovi korišćenja, Partnerski program, "šta je Estetik Lab" uvod na
 * početnoj, "Zašto mi", i uvod tim stranice (see core/services/site-content.ts
 * for the matching PUBLIC read side that renders this on /o-nama, /faq, etc).
 * Mounted at /admin/sadrzaj-sajta (see app.routes.ts, gated on
 * `manage_site_content` - same permission as /admin/podesavanja-sajta, which
 * this form intentionally sits next to but does not replace: that screen is
 * operational CONFIG, this one is marketing/legal COPY - see
 * site-content.model.js's header comment on the backend for the full
 * reasoning).
 *
 * Eight independent tabs, each its own form + save button + PUT endpoint
 * (mirrors admin-site-settings-form's "Radno vreme"/"Neradni dani" pattern of
 * several independent forms in one screen) - a save on one tab can never
 * clobber another section's content, matching the backend's one-PUT-per-
 * section API.
 *
 * "About"/"Politika privatnosti"/"Uslovi korišćenja" each have a `sections`
 * field shaped like `ContentSection[]` - title + optional paragraphs/list/
 * closingParagraphs, with one level of nested `subsections` of the same
 * shape (see core/models/site-content.ts). This is edited with the shared
 * `SectionsBuilder` component (shared/ui/sections-builder) - a card-based,
 * no-code builder with "Dodaj ..." buttons per content type - rather than a
 * raw JSON textarea, so an admin with no programming knowledge can add,
 * edit, remove and reorder this content. Each of the three tabs keeps its
 * own `signal<ContentSection[]>` (outside the Reactive Forms group, since
 * the builder's state lives in a signal, not a FormControl) and reads it
 * directly on submit. Every other field on every tab (FAQ items, partnership
 * steps/highlights, home intro massages, "why us"/team highlights) IS a
 * proper add/remove-row Reactive Form, since those are simple flat arrays of
 * 2-3 short fields each. */
@Component({
  selector: 'app-admin-site-content-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    FormLayout,
    FormSection,
    FormActions,
    SectionsBuilder,
  ],
  templateUrl: './admin-site-content-form.html',
  styleUrl: './admin-site-content-form.scss',
})
export class AdminSiteContentForm implements OnInit {
  private fb = inject(FormBuilder);
  private siteContent = inject(AdminSiteContent);
  private snackBar = inject(MatSnackBar);
  protected readonly site = inject(SiteInfo);

  loading = signal(false);
  savingAbout = signal(false);
  savingFaq = signal(false);
  savingPrivacyPolicy = signal(false);
  savingTerms = signal(false);
  savingPartnership = signal(false);
  savingHomeIntro = signal(false);
  savingWhyUs = signal(false);
  savingTeamIntro = signal(false);
  savingPageSeo = signal(false);

  /** Known icon slugs the public frontend actually maps to a Material icon
   * (see core/utils/bi-icon-map.ts) - any other Bootstrap Icons class still
   * saves fine, it just renders as a plain star there, so the hint below the
   * select says so rather than blocking free text entirely. */
  iconOptions = [
    { value: 'bi-cpu', label: 'bi-cpu (procesor)' },
    { value: 'bi-patch-check', label: 'bi-patch-check (potvrda)' },
    { value: 'bi-person-heart', label: 'bi-person-heart (osoba/srce)' },
    { value: 'bi-flower1', label: 'bi-flower1 (cvet)' },
    { value: 'bi-heart-pulse', label: 'bi-heart-pulse (puls)' },
    { value: 'bi-calendar-check', label: 'bi-calendar-check (kalendar)' },
  ];

  // ---- O nama ----
  aboutForm: FormGroup = this.fb.group({
    intro: ['', Validators.required],
  });
  aboutSections = signal<ContentSection[]>([]);

  // ---- FAQ ----
  faqForm: FormArray = this.fb.array([]) as FormArray;
  get faqGroups(): FormGroup[] {
    return this.faqForm.controls as FormGroup[];
  }
  private buildFaqGroup(pitanje = '', odgovor = ''): FormGroup {
    return this.fb.group({ pitanje: [pitanje, Validators.required], odgovor: [odgovor, Validators.required] });
  }
  addFaqItem(): void {
    this.faqForm.push(this.buildFaqGroup());
  }
  removeFaqItem(index: number): void {
    this.faqForm.removeAt(index);
  }

  // ---- Politika privatnosti / Uslovi korišćenja (identičan oblik) ----
  privacyPolicyForm: FormGroup = this.fb.group({
    lastUpdated: ['', Validators.required],
    intro: ['', Validators.required],
  });
  privacyPolicySections = signal<ContentSection[]>([]);
  termsForm: FormGroup = this.fb.group({
    lastUpdated: ['', Validators.required],
    intro: ['', Validators.required],
  });
  termsSections = signal<ContentSection[]>([]);

  // ---- Partnerski program ----
  partnershipIntroForm: FormGroup = this.fb.group({ intro: ['', Validators.required] });
  partnershipStepsForm: FormArray = this.fb.array([]) as FormArray;
  get partnershipStepGroups(): FormGroup[] {
    return this.partnershipStepsForm.controls as FormGroup[];
  }
  private buildPartnershipStepGroup(numberValue = 1, title = '', description = ''): FormGroup {
    return this.fb.group({
      number: [numberValue, [Validators.required, Validators.min(1)]],
      title: [title, Validators.required],
      description: [description, Validators.required],
    });
  }
  addPartnershipStep(): void {
    this.partnershipStepsForm.push(this.buildPartnershipStepGroup(this.partnershipStepsForm.length + 1));
  }
  removePartnershipStep(index: number): void {
    this.partnershipStepsForm.removeAt(index);
  }
  partnershipHighlightsForm: FormArray = this.fb.array([]) as FormArray;
  get partnershipHighlightControls() {
    return this.partnershipHighlightsForm.controls;
  }
  addPartnershipHighlight(): void {
    this.partnershipHighlightsForm.push(this.fb.control('', Validators.required));
  }
  removePartnershipHighlight(index: number): void {
    this.partnershipHighlightsForm.removeAt(index);
  }

  // ---- Početna strana - uvod ----
  homeIntroForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    lead: ['', Validators.required],
    who: ['', Validators.required],
    packages: ['', Validators.required],
    closing: ['', Validators.required],
  });
  homeMassagesForm: FormArray = this.fb.array([]) as FormArray;
  get homeMassageGroups(): FormGroup[] {
    return this.homeMassagesForm.controls as FormGroup[];
  }
  private buildHomeMassageGroup(title = '', text = '', href = ''): FormGroup {
    return this.fb.group({ title: [title, Validators.required], text: [text, Validators.required], href: [href, Validators.required] });
  }
  addHomeMassage(): void {
    this.homeMassagesForm.push(this.buildHomeMassageGroup());
  }
  removeHomeMassage(index: number): void {
    this.homeMassagesForm.removeAt(index);
  }

  // ---- Zašto mi (whyUs) - deljen oblik sa tim highlight-ima ispod ----
  whyUsForm: FormArray = this.fb.array([]) as FormArray;
  get whyUsGroups(): FormGroup[] {
    return this.whyUsForm.controls as FormGroup[];
  }
  private buildIconItemGroup(icon = 'bi-cpu', title = '', text = ''): FormGroup {
    return this.fb.group({ icon: [icon, Validators.required], title: [title, Validators.required], text: [text, Validators.required] });
  }
  addWhyUsItem(): void {
    this.whyUsForm.push(this.buildIconItemGroup());
  }
  removeWhyUsItem(index: number): void {
    this.whyUsForm.removeAt(index);
  }

  // ---- SEO stranica (title + meta description; backend je izvor, frontend samo prikazuje) ----
  pageSeoForm: FormArray = this.fb.array([]) as FormArray;
  pageSeoWrapper: FormGroup = this.fb.group({ pages: this.pageSeoForm });
  get pageSeoGroups(): FormGroup[] {
    return this.pageSeoForm.controls as FormGroup[];
  }
  private buildPageSeoGroup(key: string, entry: SiteContentPageSeoEntry): FormGroup {
    return this.fb.group({
      key: [key],
      label: [entry.label],
      path: [entry.path],
      title: [entry.title, [Validators.required, Validators.maxLength(120)]],
      description: [entry.description, [Validators.required, Validators.maxLength(320)]],
      noIndex: [entry.noIndex],
    });
  }

  // ---- Tim strana - uvod ----
  teamIntroForm: FormGroup = this.fb.group({
    eyebrow: ['', Validators.required],
    title: ['', Validators.required],
    lead: ['', Validators.required],
  });
  teamHighlightsForm: FormArray = this.fb.array([]) as FormArray;
  get teamHighlightGroups(): FormGroup[] {
    return this.teamHighlightsForm.controls as FormGroup[];
  }
  addTeamHighlight(): void {
    this.teamHighlightsForm.push(this.buildIconItemGroup());
  }
  removeTeamHighlight(index: number): void {
    this.teamHighlightsForm.removeAt(index);
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.siteContent
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (content) => this.patchAll(content),
        error: (error) => this.snackBar.open(error?.message || 'Greška pri učitavanju sadržaja sajta.', 'U redu', { duration: 4000 }),
      });
  }

  private patchAll(content: SiteContentAll): void {
    this.aboutForm.patchValue({ intro: content.about.intro });
    this.aboutSections.set(content.about.sections);

    this.faqForm.clear();
    for (const item of content.faq.items) this.faqForm.push(this.buildFaqGroup(item.pitanje, item.odgovor));

    this.privacyPolicyForm.patchValue({
      lastUpdated: content.privacyPolicy.lastUpdated,
      intro: content.privacyPolicy.intro,
    });
    this.privacyPolicySections.set(content.privacyPolicy.sections);
    this.termsForm.patchValue({
      lastUpdated: content.termsAndConditions.lastUpdated,
      intro: content.termsAndConditions.intro,
    });
    this.termsSections.set(content.termsAndConditions.sections);

    this.partnershipIntroForm.patchValue({ intro: content.partnership.intro });
    this.partnershipStepsForm.clear();
    for (const step of content.partnership.steps) this.partnershipStepsForm.push(this.buildPartnershipStepGroup(step.number, step.title, step.description));
    this.partnershipHighlightsForm.clear();
    for (const highlight of content.partnership.highlights) this.partnershipHighlightsForm.push(this.fb.control(highlight, Validators.required));

    this.homeIntroForm.patchValue({
      title: content.homeIntro.title,
      lead: content.homeIntro.lead,
      who: content.homeIntro.who,
      packages: content.homeIntro.packages,
      closing: content.homeIntro.closing,
    });
    this.homeMassagesForm.clear();
    for (const massage of content.homeIntro.massages) this.homeMassagesForm.push(this.buildHomeMassageGroup(massage.title, massage.text, massage.href));

    this.whyUsForm.clear();
    for (const item of content.whyUs) this.whyUsForm.push(this.buildIconItemGroup(item.icon, item.title, item.text));

    this.pageSeoForm.clear();
    for (const [key, entry] of Object.entries(content.pageSeo ?? {})) this.pageSeoForm.push(this.buildPageSeoGroup(key, entry));

    this.teamIntroForm.patchValue({ eyebrow: content.teamIntro.eyebrow, title: content.teamIntro.title, lead: content.teamIntro.lead });
    this.teamHighlightsForm.clear();
    for (const item of content.teamIntro.highlights) this.teamHighlightsForm.push(this.buildIconItemGroup(item.icon, item.title, item.text));
  }

  submitAbout(): void {
    if (this.aboutForm.invalid) {
      this.aboutForm.markAllAsTouched();
      return;
    }
    const raw = this.aboutForm.getRawValue();

    this.savingAbout.set(true);
    this.siteContent
      .updateAbout({ intro: raw.intro, sections: this.aboutSections() })
      .pipe(finalize(() => this.savingAbout.set(false)))
      .subscribe({
        next: () => this.snackBar.open('Stranica "O nama" je sačuvana.', 'U redu', { duration: 3000 }),
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  submitFaq(): void {
    if (this.faqForm.invalid) {
      this.faqForm.markAllAsTouched();
      return;
    }
    this.savingFaq.set(true);
    this.siteContent
      .updateFaq({ items: this.faqForm.getRawValue() })
      .pipe(finalize(() => this.savingFaq.set(false)))
      .subscribe({
        next: () => this.snackBar.open('FAQ sadržaj je sačuvan.', 'U redu', { duration: 3000 }),
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  submitPrivacyPolicy(): void {
    if (this.privacyPolicyForm.invalid) {
      this.privacyPolicyForm.markAllAsTouched();
      return;
    }
    const raw = this.privacyPolicyForm.getRawValue();

    this.savingPrivacyPolicy.set(true);
    this.siteContent
      .updatePrivacyPolicy({ lastUpdated: raw.lastUpdated, intro: raw.intro, sections: this.privacyPolicySections() })
      .pipe(finalize(() => this.savingPrivacyPolicy.set(false)))
      .subscribe({
        next: () => this.snackBar.open('Politika privatnosti je sačuvana.', 'U redu', { duration: 3000 }),
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  submitTerms(): void {
    if (this.termsForm.invalid) {
      this.termsForm.markAllAsTouched();
      return;
    }
    const raw = this.termsForm.getRawValue();

    this.savingTerms.set(true);
    this.siteContent
      .updateTermsAndConditions({ lastUpdated: raw.lastUpdated, intro: raw.intro, sections: this.termsSections() })
      .pipe(finalize(() => this.savingTerms.set(false)))
      .subscribe({
        next: () => this.snackBar.open('Uslovi korišćenja su sačuvani.', 'U redu', { duration: 3000 }),
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  submitPartnership(): void {
    if (this.partnershipIntroForm.invalid || this.partnershipStepsForm.invalid || this.partnershipHighlightsForm.invalid) {
      this.partnershipIntroForm.markAllAsTouched();
      this.partnershipStepsForm.markAllAsTouched();
      this.partnershipHighlightsForm.markAllAsTouched();
      return;
    }

    this.savingPartnership.set(true);
    this.siteContent
      .updatePartnership({
        intro: this.partnershipIntroForm.getRawValue().intro,
        steps: this.partnershipStepsForm.getRawValue(),
        highlights: this.partnershipHighlightsForm.getRawValue(),
      })
      .pipe(finalize(() => this.savingPartnership.set(false)))
      .subscribe({
        next: () => this.snackBar.open('Partnerski program je sačuvan.', 'U redu', { duration: 3000 }),
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  submitHomeIntro(): void {
    if (this.homeIntroForm.invalid || this.homeMassagesForm.invalid) {
      this.homeIntroForm.markAllAsTouched();
      this.homeMassagesForm.markAllAsTouched();
      return;
    }

    this.savingHomeIntro.set(true);
    this.siteContent
      .updateHomeIntro({ ...this.homeIntroForm.getRawValue(), massages: this.homeMassagesForm.getRawValue() })
      .pipe(finalize(() => this.savingHomeIntro.set(false)))
      .subscribe({
        next: () => this.snackBar.open('Uvod početne strane je sačuvan.', 'U redu', { duration: 3000 }),
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  submitWhyUs(): void {
    if (this.whyUsForm.invalid) {
      this.whyUsForm.markAllAsTouched();
      return;
    }

    this.savingWhyUs.set(true);
    this.siteContent
      .updateWhyUs(this.whyUsForm.getRawValue() as SiteContentWhyUsItem[])
      .pipe(finalize(() => this.savingWhyUs.set(false)))
      .subscribe({
        next: () => this.snackBar.open('Sekcija "Zašto mi" je sačuvana.', 'U redu', { duration: 3000 }),
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  submitTeamIntro(): void {
    if (this.teamIntroForm.invalid || this.teamHighlightsForm.invalid) {
      this.teamIntroForm.markAllAsTouched();
      this.teamHighlightsForm.markAllAsTouched();
      return;
    }

    this.savingTeamIntro.set(true);
    this.siteContent
      .updateTeamIntro({ ...this.teamIntroForm.getRawValue(), highlights: this.teamHighlightsForm.getRawValue() })
      .pipe(finalize(() => this.savingTeamIntro.set(false)))
      .subscribe({
        next: () => this.snackBar.open('Uvod tim stranice je sačuvan.', 'U redu', { duration: 3000 }),
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  submitPageSeo(): void {
    if (this.pageSeoForm.invalid) {
      this.pageSeoForm.markAllAsTouched();
      return;
    }
    const pages: Record<string, { title: string; description: string; noIndex: boolean }> = {};
    for (const row of this.pageSeoForm.getRawValue() as Array<{ key: string; title: string; description: string; noIndex: boolean }>) {
      pages[row.key] = { title: row.title, description: row.description, noIndex: row.noIndex };
    }

    this.savingPageSeo.set(true);
    this.siteContent
      .updatePageSeo(pages)
      .pipe(finalize(() => this.savingPageSeo.set(false)))
      .subscribe({
        next: () => this.snackBar.open('SEO stranica je sačuvan.', 'U redu', { duration: 3000 }),
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
