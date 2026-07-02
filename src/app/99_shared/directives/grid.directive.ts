import { Directive, ElementRef, HostListener, inject, input, OnInit } from '@angular/core';

@Directive({
  selector: 'div[spxGrid]',
  standalone: true,
})
export class GridDirective implements OnInit {
  private el: ElementRef<HTMLDivElement> = inject(ElementRef);

  small = input<boolean>(false);

  private colWidth = 275;

  ngOnInit() {
    this.el.nativeElement.classList.add('spx-grid');
    if (this.small()) {
      this.el.nativeElement.classList.add('spx-grid--small');
      this.colWidth = 200;
    }
    this.resizeGrid();
  }

  @HostListener('window:resize', [])
  resizeGrid() {
    // Calculate the number of cols we can have by dividing the grid width by our colWidth.
    // This is the maximum number of cols we can have if they are all colWidth.
    const gridWidth = this.el.nativeElement.getBoundingClientRect().width;
    let cols = Math.floor(gridWidth / this.colWidth);
    if (cols == 0) {
      cols = 1;
    }

    for (const item of this.el.nativeElement.children) {
      item.classList.remove(...['sg-max-c1', 'sg-max-c2', 'sg-max-c3', 'sg-max-c4']);
      if (cols <= 4) {
        item.classList.add(`sg-max-c${cols}`);
      }
    }
  }
}
