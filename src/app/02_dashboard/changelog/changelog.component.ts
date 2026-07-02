import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

interface ChangeLogItem {
  date: number;
  description: string;
}

@Component({
  selector: 'spx-changelog',
  imports: [MatIconModule, DatePipe],
  templateUrl: './changelog.component.html',
  styleUrl: './changelog.component.scss',
})
export class ChangelogComponent {
  changelogs: ChangeLogItem[] = [
    {
      date: this.getDate(28, 4, 2026),
      description: 'New graphic design and complete UI redesign.',
    },
    {
      date: this.getDate(7, 4, 2026),
      description: 'Add support for advanced configurations in KaaS.',
    },
    {
      date: this.getDate(25, 3, 2026),
      description: 'Integration of project backups by AZ.',
    },
    {
      date: this.getDate(6, 3, 2026),
      description: 'Integration of Kubernetes as a Service.',
    },
    {
      date: this.getDate(5, 1, 2026),
      description: 'Version 1.0.0 of the Console',
    },
  ];

  getDate(day: number, month: number, year: number): number {
    return Date.UTC(year, month - 1, day);
  }
}
