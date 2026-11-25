import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GridDirective } from './grid.directive';

@Component({
  imports: [GridDirective],
  template: '<div spxGrid [small]="true" style="width: 450px"><span></span></div>',
})
class HostComponent {}

describe('GridDirective', () => {
  it('should limit the columns of its children to the width of the grid', () => {
    const fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();

    const grid: HTMLElement = fixture.nativeElement.querySelector('div');
    expect(grid.className).toBe('spx-grid spx-grid--small');
    expect(grid.children[0].className).toBe('sg-max-c2');
  });
});
