import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductDBaaS } from '@products/00_shared/models/product.model';
import { DBaaSDetailsConnectComponent } from './dbaas-details-connect.component';

function db(phase?: string): ProductDBaaS {
  return {
    id: '1',
    eid: 'db-1',
    productName: 'db-1',
    gitops: 'false',
    cluster: { metadata: { name: 'db-1', namespace: 'ns' }, spec: { instances: 2 }, status: { phase } },
    endpoints: [
      { role: 'r', host: '198.18.0.10', port: 5434 },
      { role: 'rw', host: '198.18.0.10', port: 5432 },
      { role: 'rw', host: '51.159.24.88', port: 5432, external: true },
    ],
  };
}

describe('DBaaSDetailsConnectComponent', () => {
  let component: DBaaSDetailsConnectComponent;
  let fixture: ComponentFixture<DBaaSDetailsConnectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DBaaSDetailsConnectComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(DBaaSDetailsConnectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('db', db('Setting up primary'));
    fixture.componentRef.setInput('az', 'az1');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stays on the private network while the public address is unknown', () => {
    component.network.set('public');
    expect(component.activeNetwork()).toBe('private');
  });

  it('lists only the private endpoints', () => {
    expect(component.endpoints().map(e => e.host)).toEqual(['198.18.0.10', '198.18.0.10']);
  });

  it('treats only the healthy phase as ready', () => {
    expect(component.isReady()).toBe(false);
    fixture.componentRef.setInput('db', db('Cluster in healthy state'));
    expect(component.isReady()).toBe(true);
  });

  const cases: {
    name: string;
    client: 'psql' | 'uri';
    role: 'rw' | 'r';
    network?: 'public';
    expected: string;
  }[] = [
    {
      name: 'psql on rw',
      client: 'psql',
      role: 'rw',
      expected: 'psql "host=198.18.0.10 port=5432 dbname=<database> user=<user> sslmode=require"',
    },
    {
      name: 'uri on r',
      client: 'uri',
      role: 'r',
      expected: 'postgresql://<user>:<password>@198.18.0.10:5434/<database>?sslmode=require',
    },
    {
      name: 'psql on public rw',
      client: 'psql',
      role: 'rw',
      network: 'public',
      expected: 'psql "host=51.159.24.88 port=5432 dbname=<database> user=<user> sslmode=require"',
    },
    {
      name: 'uri on public r',
      client: 'uri',
      role: 'r',
      network: 'public',
      expected: 'postgresql://<user>:<password>@51.159.24.88:5434/<database>?sslmode=require',
    },
  ];

  cases.forEach(({ name, client, role, network, expected }) => {
    it(`builds the ${name} snippet without the password`, () => {
      fixture.componentRef.setInput('publicEndpoints', [
        { role: 'rw', host: '51.159.24.88', port: 5432 },
        { role: 'r', host: '51.159.24.88', port: 5434 },
      ]);
      component.network.set(network ?? 'private');
      component.client.set(client);
      component.role.set(role);
      expect(component.snippet()).toBe(expected);
    });
  });
});
