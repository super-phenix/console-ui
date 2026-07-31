import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

import { AutoSelectDirective } from './auto-select.directive';

interface TestOption {
  id: string;
  name: string;
}

@Component({
  imports: [AutoSelectDirective, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  template: `
    <mat-form-field>
      <mat-label>Test</mat-label>
      <mat-select
        spxAutoSelect
        [formControl]="control"
        (selectionChange)="lastEmitted = $event.value">
        @for (opt of options(); track opt.id) {
          <mat-option [value]="opt.id">{{ opt.name }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
class TestHostComponent {
  options = signal<TestOption[]>([]);
  control = new FormControl('');
  lastEmitted: unknown = undefined;
}

describe('AutoSelectDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('should auto-select when there is exactly one option', () => {
    host.options.set([{ id: 'only', name: 'Only Option' }]);
    fixture.detectChanges();

    expect(host.control.value).toBe('only');
    expect(host.lastEmitted).toBe('only');
  });

  it('should not auto-select when there are multiple options', () => {
    host.options.set([
      { id: '1', name: 'One' },
      { id: '2', name: 'Two' },
    ]);
    fixture.detectChanges();

    expect(host.control.value).toBe('');
    expect(host.lastEmitted).toBeUndefined();
  });

  it('should not auto-select when there are no options', () => {
    host.options.set([]);
    fixture.detectChanges();

    expect(host.control.value).toBe('');
    expect(host.lastEmitted).toBeUndefined();
  });

  it('should auto-select when options change from multiple to one', () => {
    host.options.set([
      { id: '1', name: 'One' },
      { id: '2', name: 'Two' },
    ]);
    fixture.detectChanges();
    expect(host.control.value).toBe('');

    host.options.set([{ id: 'single', name: 'Single' }]);
    fixture.detectChanges();

    expect(host.control.value).toBe('single');
    expect(host.lastEmitted).toBe('single');
  });

  it('should not auto-select when options change from one to multiple', () => {
    host.options.set([{ id: 'only', name: 'Only' }]);
    fixture.detectChanges();
    expect(host.control.value).toBe('only');

    host.options.set([
      { id: '1', name: 'One' },
      { id: '2', name: 'Two' },
    ]);
    fixture.detectChanges();

    // Value remains from previous auto-select, but no new auto-select triggered
    expect(host.control.value).toBe('only');
  });
});
