import { Component, inject, model } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TextEditorData, TextEditorDialog } from '@products/00_shared/dialogs/text-editor-dialog.component';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { firstValueFrom } from 'rxjs';

type ConfigType = 'coredns' | 'cilium' | 'metricsServer';

const CorednsConfig: TextEditorData = {
  title: 'CoreDNS Configuration',
  subtitle: 'Define CoreDNS custom configuration',
};

const CiliumConfig: TextEditorData = {
  title: 'Cilium Configuration',
  subtitle: 'Define Cilium custom configuration',
};

const MetricsServerConfig: TextEditorData = {
  title: 'Metrics Server Configuration',
  subtitle: 'Define Metrics Server custom configuration',
};

@Component({
  selector: 'spx-step-kaas-essentials',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './step-kaas-essentials.component.html',
  styleUrl: './step-kaas-essentials.component.scss',
})
export class StepKaasEssentialsComponent {
  private readonly dialog = inject(MatDialog);
  maxLength = MAX_NAME_LENGTH;

  coredns = model<string>();
  cilium = model<string>();
  metricsServer = model<string>();

  async openTextEditor(configType: ConfigType) {
    let textEditorData: TextEditorData;
    switch (configType) {
      case 'coredns':
        textEditorData = CorednsConfig;
        textEditorData.text = this.coredns();
        break;
      case 'cilium':
        textEditorData = CiliumConfig;
        textEditorData.text = this.cilium();
        break;
      case 'metricsServer':
        textEditorData = MetricsServerConfig;
        textEditorData.text = this.metricsServer();
        break;
    }

    const editorRef = this.dialog.open(TextEditorDialog, {
      data: textEditorData,
      panelClass: 'dialog--large',
    });

    const res = await firstValueFrom<string | undefined>(editorRef.afterClosed());

    // Discard if the value is undefined (match with cancel action)
    if (res === undefined) {
      return;
    }

    switch (configType) {
      case 'coredns':
        this.coredns.set(res);
        break;
      case 'cilium':
        this.cilium.set(res);
        break;
      case 'metricsServer':
        this.metricsServer.set(res);
        break;
    }
  }
}
