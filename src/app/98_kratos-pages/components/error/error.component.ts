import { JsonPipe } from '@angular/common';
import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FlowError } from '@ory/client';
import { FlowService } from '@kratos-pages/shared/services/flow.service';

@Component({
  selector: 'spx-auth-error',
  imports: [JsonPipe],
  templateUrl: './error.component.html',
  styleUrls: ['../../shared/components/base-flow/base-flow.component.scss', './error.component.scss'],
})
export class ErrorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private flowService = inject(FlowService);

  id: string | null = this.route.snapshot.queryParamMap.get('id');

  error: WritableSignal<FlowError | undefined> = signal(undefined);

  ngOnInit(): void {
    if (this.id) {
      this.flowService.getFlowError(this.id).subscribe(res => this.error.set(res));
    }
  }
}
