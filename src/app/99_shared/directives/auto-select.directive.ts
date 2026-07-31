import { AfterContentInit, Directive, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { MatSelect } from '@angular/material/select';

@Directive({
  selector: 'mat-select[spxAutoSelect]',
  standalone: true,
})
export class AutoSelectDirective implements AfterContentInit {
  private matSelect = inject(MatSelect);
  private ngControl = inject(NgControl, { optional: true });

  ngAfterContentInit(): void {
    // Watch for option list changes (initial render + dynamic updates)
    this.matSelect.options.changes.subscribe(() => this.tryAutoSelect());
    // Also check immediately in case options are already rendered
    this.tryAutoSelect();
  }

  private tryAutoSelect(): void {
    const options = this.matSelect.options;
    if (options.length === 1) {
      const value = options.first.value;
      if (this.ngControl?.control) {
        this.ngControl.control.setValue(value);
      } else {
        this.matSelect.value = value;
      }
      this.matSelect.selectionChange.emit({ source: this.matSelect, value });
    }
  }
}
