import { DatePipe } from '@angular/common';
import { Component, input, linkedSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { Snapshot } from '@products/00_shared/models/storage/snapshot/snapshot.model';

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

function sortData(this: Sort, a: Snapshot, b: Snapshot) {
  const isAsc = this.direction === 'asc';
  switch (this.active) {
    case 'id':
      return compare(a.metadata.name, b.metadata.name, isAsc);
    case 'date':
      return compare(new Date(a.status.creationTime).getTime(), new Date(b.status.creationTime).getTime(), isAsc);
    default:
      return 0;
  }
}

@Component({
  selector: 'spx-snapshot-details-linked-snap',
  imports: [MatButtonModule, MatTableModule, MatIconModule, MatChipsModule, RouterLink, MatSortModule, DatePipe],
  templateUrl: './snapshot-details-linked-snap.component.html',
  styleUrl: './snapshot-details-linked-snap.component.scss',
})
export class SnapshotDetailsLinkedSnapComponent {
  displayedColumns: string[] = ['id', 'date', 'size', 'ready', 'actions'];
  snapshots = input.required<Snapshot[]>();

  defaultSort: Sort = {
    active: 'date',
    direction: 'asc',
  };

  datasource = linkedSignal<Snapshot[], Snapshot[]>({
    // `selectedOption` is set to the `computation` result whenever this `source` changes.
    source: this.snapshots,
    computation: (newOptions, _) => {
      return newOptions.sort(sortData.bind(this.defaultSort));
    },
  });

  sortData(sort: Sort) {
    const data = this.snapshots() || [];

    let sortedData = [...data];

    if (!sort.active || sort.direction === '') {
      this.datasource.set([...sortedData]);
      return;
    }

    sortedData = data.sort(sortData.bind(sort));
    this.datasource.set([...sortedData]);
  }

  trackBy(_: number, snapshot: Snapshot) {
    return snapshot.metadata.name;
  }
}
