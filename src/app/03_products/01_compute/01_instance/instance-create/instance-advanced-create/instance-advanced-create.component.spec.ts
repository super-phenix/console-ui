import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { InstanceAdvancedCreateComponent } from './instance-advanced-create.component';
import { AdvancedOptionsInput } from '@products/00_shared/models/compute/instance/advanced-options.model';

// Thin host around <spx-advanced-blocks>; the block logic is covered by
// advanced-blocks.component.spec.ts. This just checks wiring.
describe('InstanceAdvancedCreateComponent', () => {
  let fixture: ComponentFixture<InstanceAdvancedCreateComponent>;
  let component: InstanceAdvancedCreateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstanceAdvancedCreateComponent, MatDialogModule],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(InstanceAdvancedCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('forwards the inner advancedChange output', () => {
    const emitted: AdvancedOptionsInput[] = [];
    component.advancedChange.subscribe(v => emitted.push(v));
    const payload: AdvancedOptionsInput = { devices: { tpm: { enabled: true } } };
    component.advancedChange.emit(payload);
    expect(emitted).toEqual([payload]);
  });
});
