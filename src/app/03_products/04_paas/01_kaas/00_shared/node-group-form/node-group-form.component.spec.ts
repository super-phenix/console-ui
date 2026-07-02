import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeGroupFormComponent } from './node-group-form.component';

describe('NodeGroupFormComponent', () => {
  let component: NodeGroupFormComponent;
  let fixture: ComponentFixture<NodeGroupFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeGroupFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeGroupFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
