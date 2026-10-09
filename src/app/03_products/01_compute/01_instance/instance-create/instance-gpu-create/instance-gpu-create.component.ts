import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { GpuClass } from '@products/00_shared/models/compute/instance/instance';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';

/** Value of the "None" option. */
export const NO_GPU = '';

@Component({
  selector: 'spx-instance-gpu-create',
  imports: [MatFormFieldModule, MatIconModule, MatSelectModule],
  templateUrl: './instance-gpu-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceGpuCreateComponent {
  protected readonly NO_GPU = NO_GPU;

  private readonly instanceSvc = inject(InstanceService);
  private readonly stateSvc = inject(StateService);

  az = input.required<string | null>();
  /**
   * GPUs currently attached to the instance being edited. Undefined on create.
   * Seeds the selection without re-emitting gpusChange.
   */
  initGpus = input<GpuClass[] | undefined>(undefined);
  /**
   * Emits the selected GPU class ids: [] for none, [id] for a class.
   */
  gpusChange = output<string[]>();

  gpuClassCatalog = rxResource<GpuClass[], string | null>({
    params: () => this.az(),
    stream: () => {
      if (this.az() && this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.instanceSvc.listGpuClasses(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.az()!
        );
      }
      return of<GpuClass[]>([]);
    },
    defaultValue: [],
  });

  selected = signal<string>(NO_GPU);

  /** Edit page: initGpus is bound. The restart notice only makes sense for an existing VM. */
  isEditMode = computed(() => this.initGpus() !== undefined);

  /**
   * Classes offered in the select. A GPU already attached but missing from the
   * catalog (e.g. removed from the AZ mapping) is kept so the user sees it.
   */
  options = computed<GpuClass[]>(() => {
    const catalog = this.gpuClassCatalog.hasValue() ? (this.gpuClassCatalog.value() ?? []) : [];
    const current = this.initGpus()?.[0];
    if (current && !catalog.some(c => c.id === current.id)) {
      return [...catalog, current];
    }
    return catalog;
  });

  constructor() {
    effect(() => {
      const init = this.initGpus();
      // Track the AZ: on create, changing AZ resets the choice.
      this.az();
      if (init === undefined) {
        // Only emit when a GPU was picked, so the parent's default ("no GPU") stays untouched.
        if (untracked(this.selected) !== NO_GPU) {
          this.selected.set(NO_GPU);
          this.gpusChange.emit([]);
        }
      } else {
        this.selected.set(init[0]?.id ?? NO_GPU);
      }
    });
  }

  select(value: string) {
    this.selected.set(value);
    this.gpusChange.emit(value === NO_GPU ? [] : [value]);
  }
}
