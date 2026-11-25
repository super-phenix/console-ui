import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import { NodeGroupFormComponent } from './node-group-form.component';

describe('NodeGroupFormComponent', () => {
  let component: NodeGroupFormComponent;
  let fixture: ComponentFixture<NodeGroupFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeGroupFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeGroupFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('index', 0);
    fixture.componentRef.setInput('storageClassList', []);
    fixture.componentRef.setInput(
      'group',
      new FormGroup({
        name: new FormControl('pool'),
        nodeRole: new FormControl(''),
        replicas: new FormControl(1),
        cpu: new FormControl(2),
        memory: new FormControl({ value: 4, unit: 'Gi' }),
        bootDiskSize: new FormControl(''),
        storageClass: new FormControl(''),
      })
    );
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
