import { Component, computed, DestroyRef, inject, input, model, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

export interface TagOption {
  id: string;
  name?: string;
}

@Component({
  selector: 'spx-tag-selector',
  standalone: true,
  imports: [MatIconModule, ReactiveFormsModule, MatFormFieldModule, MatAutocompleteModule, MatChipsModule],
  templateUrl: './tag-selector.component.html',
  styleUrl: './tag-selector.component.scss',
})
export class TagSelectorComponent implements OnInit {
  destroyRef = inject(DestroyRef);

  options = input.required<TagOption[]>();
  readOnly = input<boolean>(false);

  readonly labelText = input('Related projects');
  readonly allOpt = input(true);
  readonly allOptText = input('All existing and future projects');
  readonly existOpt = input(true);
  readonly existOptText = input('All existing projects');

  All: TagOption = { id: '__all' };
  Exist: TagOption = { id: '__exist' };

  mapIdName = new Map<string, string>();

  selection = model<TagOption[]>([]);
  filter = signal('');
  autocomplete = computed(() => {
    const opts = this.allOpt() ? [this.All] : [];
    // Not all project are selected
    if (this.existOpt() && this.selection().length !== this.options().length) {
      opts.push(this.Exist);
    }
    let res = opts.concat(this.options());
    // Filter already selected items
    res = res.filter(
      v =>
        this.selection().findIndex(s => s.id === v.id) === -1 &&
        this.mapIdName.get(v.id)?.toLocaleLowerCase().includes(this.filter().toLocaleLowerCase())
    );
    return res;
  });

  inputCtrl: FormControl = new FormControl('');

  ngOnInit(): void {
    this.mapIdName.set(this.All.id, this.allOptText());
    this.mapIdName.set(this.Exist.id, this.existOptText());
    this.options().forEach(v => this.mapIdName.set(v.id, v.name || ''));

    this.inputCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
      this.filter.set(value);
    });
  }

  selectTag(event: MatAutocompleteSelectedEvent) {
    this.select(event.option.value);
  }

  select(item: TagOption) {
    if (item.id === this.All.id) {
      this.selection.set([this.All]);
    } else if (item.id === this.Exist.id) {
      this.selection.set([...this.options()]);
    } else {
      if (this.selection().findIndex(v => v.id === this.All.id) !== -1) {
        this.selection.set([]);
      }

      this.selection.update(opts => {
        opts.push(item);
        return [...opts];
      });
    }
    // Reset input
    this.inputCtrl.setValue('');
  }

  removeSelected(id: string) {
    this.selection.update(opts => opts.filter(opt => opt.id !== id));
  }
}
