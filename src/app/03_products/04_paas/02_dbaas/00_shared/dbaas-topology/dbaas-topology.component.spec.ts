import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DBaaSEndpoint, DBaaSEndpointRole } from '@products/00_shared/models/paas/dbaas/dbaas.model';
import { DBaaSTopologyComponent } from './dbaas-topology.component';

describe('DBaaSTopologyComponent', () => {
  let component: DBaaSTopologyComponent;
  let fixture: ComponentFixture<DBaaSTopologyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DBaaSTopologyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DBaaSTopologyComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('instances', 1);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const cases: {
    name: string;
    instances: number;
    endpoints?: DBaaSEndpoint[];
    rails: { role: DBaaSEndpointRole; start: number; end: number; port: number }[];
  }[] = [
    {
      name: 'single instance preview has no read-only rail',
      instances: 1,
      rails: [
        { role: 'rw', start: 1, end: 2, port: 5432 },
        { role: 'r', start: 1, end: 2, port: 5434 },
      ],
    },
    {
      name: 'three instance preview spans replicas with ro',
      instances: 3,
      rails: [
        { role: 'rw', start: 1, end: 2, port: 5432 },
        { role: 'ro', start: 2, end: 4, port: 5433 },
        { role: 'r', start: 1, end: 4, port: 5434 },
      ],
    },
    {
      name: 'live endpoints drive roles and ports',
      instances: 2,
      endpoints: [
        { role: 'r', host: '198.18.0.1', port: 6000 },
        { role: 'rw', host: '198.18.0.1', port: 5432 },
      ],
      rails: [
        { role: 'rw', start: 1, end: 2, port: 5432 },
        { role: 'r', start: 1, end: 3, port: 6000 },
      ],
    },
  ];

  cases.forEach(({ name, instances, endpoints, rails }) => {
    it(name, () => {
      fixture.componentRef.setInput('instances', instances);
      fixture.componentRef.setInput('endpoints', endpoints);
      expect(component.rails().map(r => ({ role: r.role, start: r.start, end: r.end, port: r.port }))).toEqual(rails);
    });
  });
});
