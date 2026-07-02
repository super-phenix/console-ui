import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

import { CreateDnat } from '@products/00_shared/models/network/eip/create-eip.model';

@Component({
  selector: 'spx-eip-second-step',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatIconModule,
  ],
  templateUrl: './eip-second-step.component.html',
  styleUrl: './eip-second-step.component.scss',
})
export class EipSecondStepComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);

  formGroup = input.required<FormGroup>();
  snatList = input<string[]>([]);
  dnatList = input<CreateDnat[]>([]);

  get snat() {
    return this.formGroup().get('snat') as FormArray;
  }

  get dnat() {
    return this.formGroup().get('dnat') as FormArray;
  }

  ngOnInit() {
    this.snatList().forEach(cidr => this.snat.push(this.fb.control(cidr, [Validators.required])));
    this.dnatList().forEach(rule =>
      this.dnat.push(
        this.fb.group({
          externalPort: new FormControl<string>(rule.externalPort, [Validators.required]),
          internalIP: new FormControl<string>(rule.internalIP, [Validators.required]),
          internalPort: new FormControl<string>(rule.internalPort, [Validators.required]),
          protocol: new FormControl<'tcp' | 'udp'>(rule.protocol, [Validators.required]),
        })
      )
    );

    this.formGroup()
      .get('type')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.updateValidators(v));

    this.formGroup()
      .get('snat')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        if (v && v.length > 0) {
          this.formGroup().get('snat')?.setErrors(null);
        } else if (this.formGroup().get('type')?.value === 'cidr') {
          this.formGroup().get('snat')?.setErrors({ required: true });
        }
      });

    // Force a Validators update on init
    this.updateValidators(this.formGroup().value?.type);
  }

  addCidr() {
    this.snat.push(this.fb.control('', [Validators.required]));
  }

  removeCidr(index: number) {
    this.snat.removeAt(index);
  }

  addDnat() {
    this.dnat.push(
      this.fb.group({
        externalPort: new FormControl<string>('', [Validators.required]),
        internalIP: new FormControl<string>('', [Validators.required]),
        internalPort: new FormControl<string>('', [Validators.required]),
        protocol: new FormControl<'tcp' | 'udp'>('tcp', [Validators.required]),
      })
    );
  }

  removeDnat(index: number) {
    this.dnat.removeAt(index);
  }

  updateValidators(type: string) {
    if (type === 'ip') {
      this.formGroup().get('snat')?.removeValidators(Validators.required);
      this.formGroup().get('ip')?.addValidators(Validators.required);
    } else if (type === 'cidr') {
      this.formGroup().get('ip')?.removeValidators(Validators.required);
      this.formGroup().get('snat')?.addValidators(Validators.required);
    }

    this.formGroup().get('snat')?.updateValueAndValidity();
    this.formGroup().get('ip')?.updateValueAndValidity();
  }
}
