import { Component, computed, inject, input, model } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TextEditorDialog } from '@products/00_shared/dialogs/text-editor-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'spx-step-post-install-chart',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  templateUrl: './step-post-install-chart.component.html',
  styleUrl: './step-post-install-chart.component.scss',
})
export class StepPostInstallChartComponent {
  private readonly dialog = inject(MatDialog);

  formGroup = input.required<FormGroup>();
  active = model<boolean>();

  chartName = computed(() => this.getInput<string>('chartName'));
  chartVersion = computed(() => this.getInput<string>('chartVersion'));
  namespace = computed(() => this.getInput<string>('namespace'));
  repoUrl = computed(() => this.getInput<string>('repoUrl'));
  values = computed(() => this.getInput<string>('values'));

  async openTextEditor() {
    const editorRef = this.dialog.open(TextEditorDialog, {
      data: {
        title: 'Values',
        text: this.values()?.value || '',
      },
      panelClass: 'dialog--large',
    });

    const res = await firstValueFrom<string | undefined>(editorRef.afterClosed());

    // Discard if the value is undefined (match with cancel action)
    if (res === undefined) {
      return;
    }

    this.values()?.setValue(res);
  }

  getInput<T>(name: string): FormControl<T> | null {
    const input = this.formGroup().get(name);
    if (input) {
      return input as FormControl<T>;
    }
    console.error(`Failed to find ${name} formControl`);
    return null;
  }
}
