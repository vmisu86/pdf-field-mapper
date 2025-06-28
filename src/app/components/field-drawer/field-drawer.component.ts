import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-field-drawer',
  standalone: true,
  imports: [
    CommonModule,
    NzIconModule,
    NzAlertModule
  ],
  templateUrl: './field-drawer.component.html',
  styleUrls: ['./field-drawer.component.less']
})
export class FieldDrawerComponent {
  fieldTypes = [
    { type: 'text', icon: 'font-size', label: 'Text Field', color: '#1890ff' },
    { type: 'signature', icon: 'edit', label: 'Signature', color: '#52c41a' },
    { type: 'checkbox', icon: 'check-square', label: 'Checkbox', color: '#722ed1' },
    { type: 'date', icon: 'calendar', label: 'Date', color: '#fa8c16' }
  ];

  dragStart(event: DragEvent, fieldType: string): void {
    event.dataTransfer!.setData('fieldType', fieldType);
    event.dataTransfer!.effectAllowed = 'copy';
  }
}