import { Component } from '@angular/core';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    PdfViewerComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'PDF Field Mapper for Adobe Sign';
}