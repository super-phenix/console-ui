import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface TextEditorData {
  title?: string;
  subtitle?: string;
  text?: string;
  readonly?: boolean;
}

@Component({
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    CdkTextareaAutosize,
  ],
  template: `
    <h2 mat-dialog-title>{{ title() }}</h2>
    <div #dialogContent mat-dialog-content>
      <div class="d-flex flex-column h-100 gap-2">
        <span>
          <i>{{ subtitle() }}</i>
        </span>
        <mat-form-field class="text-edition h-50 flex-grow" subscriptSizing="dynamic">
          <textarea
            matInput
            cdkTextareaAutosize
            [cdkAutosizeMinRows]="autosize()"
            [cdkAutosizeMaxRows]="autosize()"
            [formControl]="text"></textarea>
        </mat-form-field>
      </div>
    </div>
    <div mat-dialog-actions>
      <button type="button" mat-stroked-button [mat-dialog-close]="undefined">Cancel</button>
      <button type="button" matButton="filled" color="primary" [mat-dialog-close]="this.text.value">Ok</button>
    </div>
  `,
  styles: `
    @use '@angular/material' as mat;

    .text-edition {
      @include mat.form-field-overrides(
        (
          filled-container-color: var(--mat-sys-background),
          container-vertical-padding: 0,
        )
      );

      textarea {
        line-height: 24px;
        font-family: 'Consolas', Courier, monospace;
        white-space: pre;
        overflow-wrap: normal;
        overflow: auto;
        padding-bottom: 15px;
        padding-right: 15px;
        box-sizing: content-box;
      }
    }
  `,
})
export class TextEditorDialog implements OnInit {
  readonly dialogRef = inject(MatDialogRef<TextEditorDialog>);
  readonly fb = inject(FormBuilder);
  data = inject<TextEditorData>(MAT_DIALOG_DATA);

  dialogContent = viewChild<ElementRef<HTMLDivElement>>('dialogContent');

  autosize = signal(15);

  title = signal(this.data?.title || 'Text Editor');
  subtitle = signal(this.data?.subtitle);

  text = this.fb.nonNullable.control(this.data?.text || '', Validators.required);

  constructor() {
    this.dialogRef.updateSize('var(--mat-dialog-container-max-width, 560px)', '75%');

    if (this.data.readonly === true) {
      this.text.disable();
    }
  }

  ngOnInit(): void {
    const dialog = this.dialogContent()?.nativeElement;
    if (dialog) {
      let height = dialog.clientHeight - 15;
      if (this.subtitle()) {
        height -= 24;
      }
      const numberLine = Math.floor(height / 24);

      this.autosize.set(numberLine);
    }
  }
}
