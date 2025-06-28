import { Component } from '@angular/core';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { FieldListComponent } from './components/field-list/field-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NzLayoutModule,
    PdfViewerComponent,
    FieldListComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'PDF Field Mapper for Adobe Sign';
}