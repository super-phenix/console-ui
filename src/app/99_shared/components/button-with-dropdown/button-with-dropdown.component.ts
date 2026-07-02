import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'spx-button-with-dropdown',
  imports: [MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './button-with-dropdown.component.html',
  styleUrl: './button-with-dropdown.component.scss',
})
export class ButtonWithDropdownComponent {
  btnText = input.required();
  disabled = input(false);

  btnClicked = output();
}
