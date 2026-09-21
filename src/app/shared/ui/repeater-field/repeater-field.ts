import { Component, input } from '@angular/core';
import { ReactiveFormsModule, FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface RepeaterSubfield {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'hidden';
  options?: { value: string; label: string }[];
}

/**
 * Angular/Reactive-Forms equivalent of the old admin-repeater.js vanilla-JS widget
 * (schema-driven add/remove rows, e.g. Service.packages / "Varijante usluge"). The
 * old widget serialized rows to a hidden <input> as a JSON string on every
 * change/submit, because a plain HTML form POST can only carry strings; here the
 * FormArray IS the value - form.value is already the array of objects the JSON API
 * expects, no stringify/parse step needed (see api.ts's post()/put(), which
 * send the form value straight through as a JSON body).
 *
 * A `_id` subfield (type: 'hidden') in the schema round-trips an existing row's
 * Mongo _id unchanged across an edit - the same reason the old widget carried one:
 * without it, every save would mint a new _id for every row, silently orphaning
 * anything elsewhere that referenced the old one (see the backend's regression
 * test in test/integration/http/admin-service.http.test.js for exactly this bug).
 */
@Component({
  selector: 'app-repeater-field',
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule],
  templateUrl: './repeater-field.html',
  styleUrl: './repeater-field.scss',
})
export class RepeaterField {
  schema = input.required<RepeaterSubfield[]>();
  array = input.required<FormArray<FormGroup>>();
  addLabel = input('Dodaj stavku');
  emptyLabel = input('Nema stavki.');

  textFields(): RepeaterSubfield[] {
    return this.schema().filter((f) => f.type !== 'hidden' && f.type !== 'checkbox');
  }

  checkboxFields(): RepeaterSubfield[] {
    return this.schema().filter((f) => f.type === 'checkbox');
  }

  addRow(): void {
    const group = new FormGroup({});
    for (const field of this.schema()) {
      const initial = field.type === 'checkbox' ? false : field.type === 'number' ? null : '';
      group.addControl(field.name, new FormControl(initial));
    }
    this.array().push(group);
  }

  removeRow(index: number): void {
    this.array().removeAt(index);
  }

  rows(): FormGroup[] {
    return this.array().controls;
  }
}
