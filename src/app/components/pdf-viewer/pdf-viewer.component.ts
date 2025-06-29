import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { PdfFieldService } from '../../services/pdf-field.service';
import { AdobeDocumentType, Field, FieldTypeCombination, FormFieldContentType, FormFieldInputType } from '../../models/field.model';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with CDN
(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.mjs`;

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzUploadModule,
    NzIconModule,
    NzDividerModule,
    NzSelectModule
  ],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.less']
})
export class PdfViewerComponent implements OnInit {
  @ViewChild('pdfCanvas', { static: false }) pdfCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('drawingCanvas', { static: false }) drawingCanvas!: ElementRef<HTMLCanvasElement>;

  pdfDocument: any = null;
  currentPage = 1;
  totalPages = 0;
  scale = 1.5;
  isDrawing = false;
  showGrid = false;
  drawingStart: { x: number; y: number } | null = null;

  private renderTask: any = null;
  private isRendering = false;

  fieldType: FormFieldInputType = FormFieldInputType.TEXT_FIELD;
  selectedFieldType: string = 'text_data';
  recipientIndex = 1;
  documentType: AdobeDocumentType = AdobeDocumentType.TRANSIENT;

  fields: Field[] = [];

  fieldTypeCombinations: FieldTypeCombination[] = [
    // Text fields
    { label: 'Text Field', inputType: FormFieldInputType.TEXT_FIELD, contentType: FormFieldContentType.DATA, icon: 'font-size', color: '#1890ff', validation: '', validationData: '' },
    { label: 'Multiline Text', inputType: FormFieldInputType.MULTILINE, contentType: FormFieldContentType.DATA, icon: 'file-text', color: '#1890ff', validation: '', validationData: '' },
    { label: 'Signer Name', inputType: FormFieldInputType.TEXT_FIELD, contentType: FormFieldContentType.SIGNER_NAME, icon: 'user', color: '#13c2c2', validation: '', validationData: '' },
    { label: 'Signer Email', inputType: FormFieldInputType.TEXT_FIELD, contentType: FormFieldContentType.SIGNER_EMAIL, icon: 'mail', color: '#13c2c2', validation: '', validationData: '' },
    // { label: 'Signer Title', inputType: FormFieldInputType.TEXT_FIELD, contentType: FormFieldContentType.SIGNER_TITLE, icon: 'idcard', color: '#13c2c2', validation:'',validationData:''  },
    // { label: 'Signer Company', inputType: FormFieldInputType.TEXT_FIELD, contentType: FormFieldContentType.SIGNER_COMPANY, icon: 'bank', color: '#13c2c2', validation:'',validationData:''  },

    // Signature fields
    { label: 'Signature', inputType: FormFieldInputType.SIGNATURE, contentType: FormFieldContentType.SIGNATURE, icon: 'edit', color: '#52c41a', validation: '', validationData: '' },
    { label: 'Initials', inputType: FormFieldInputType.SIGNATURE, contentType: FormFieldContentType.SIGNER_INITIALS, icon: 'highlight', color: '#52c41a', validation: '', validationData: '' },

    // Date fields
    { label: 'Date Field', inputType: FormFieldInputType.DATE, contentType: FormFieldContentType.DATA, icon: 'calendar', color: '#fa8c16', validation: 'DATE_CUSTOM', validationData: 'yyyy-MM-dd' },
    { label: 'Date-CUSTOM Field', inputType: FormFieldInputType.DATE, contentType: FormFieldContentType.DATA, icon: 'calendar', color: '#fa8c16', validation: 'DATE', validationData: '' },
    { label: 'Signing Date', inputType: FormFieldInputType.DATE, contentType: FormFieldContentType.SIGNATURE_DATE, icon: 'calendar', color: '#fa8c16', validation: '', validationData: '', readOnly: true },

    // Other fields
    { label: 'Checkbox', inputType: FormFieldInputType.CHECKBOX, contentType: FormFieldContentType.DATA, icon: 'check-square', color: '#722ed1', validation: '', validationData: '' },
    { label: 'Radio Button', inputType: FormFieldInputType.RADIO, contentType: FormFieldContentType.DATA, icon: 'check-circle', color: '#722ed1', validation: '', validationData: '' },
    // { label: 'Dropdown', inputType: FormFieldInputType.DROP_DOWN, contentType: FormFieldContentType.DATA, icon: 'down-square', color: '#13c2c2', validation:'',validationData:'' },
    // { label: 'Hyperlink', inputType: FormFieldInputType.HYPERLINK, contentType: FormFieldContentType.HYPERLINK, icon: 'link', color: '#eb2f96', validation:'',validationData:'' },
    // { label: 'Image', inputType: FormFieldInputType.IMAGE, contentType: FormFieldContentType.IMAGE, icon: 'picture', color: '#faad14', validation:'',validationData:'' },
    // { label: 'QR Code', inputType: FormFieldInputType.IMAGE, contentType: FormFieldContentType.QR_CODE, icon: 'qrcode', color: '#faad14', validation:'',validationData:'' }
  ];

  fieldTypeGroups = [
    {
      label: 'Text Fields',
      items: this.fieldTypeCombinations.filter(f => f.inputType === FormFieldInputType.TEXT_FIELD || f.inputType === FormFieldInputType.MULTILINE)
    },
    {
      label: 'Signature Fields',
      items: this.fieldTypeCombinations.filter(f => f.inputType === FormFieldInputType.SIGNATURE)
    },
    {
      label: 'Date Fields',
      items: this.fieldTypeCombinations.filter(f => f.inputType === FormFieldInputType.DATE)
    },
    {
      label: 'Other Fields',
      items: this.fieldTypeCombinations.filter(f =>
        ![FormFieldInputType.TEXT_FIELD, FormFieldInputType.MULTILINE, FormFieldInputType.SIGNATURE, FormFieldInputType.DATE].includes(f.inputType)
      )
    }
  ];

  FormFieldInputType = FormFieldInputType;

  constructor(private pdfFieldService: PdfFieldService) { }

  ngOnInit(): void {
    this.pdfFieldService.pdfDocument$.subscribe(async (pdfDoc) => {
      if (pdfDoc) {
        this.pdfDocument = pdfDoc;
        this.totalPages = pdfDoc.numPages;
        this.currentPage = 1;
        await this.renderPage(this.currentPage);
      }
    });

    this.pdfFieldService.fields$.subscribe(fields => {
      this.fields = fields;
      this.redrawOverlay();
    });
  }

  beforeUpload = (file: any) => {
    const nativeFile: File = file.originFileObj || file;
    if (nativeFile.type !== 'application/pdf') {
      return false;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.loadPdf(e.target.result);
    };
    reader.readAsArrayBuffer(nativeFile);
    return false;
  };

  async onFileSelected(event: any): Promise<void> {
    const file = event.file || event.target?.files?.[0];
    if (file && file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      await this.loadPdf(arrayBuffer);
    }
  }


  async loadPdf(arrayBuffer: ArrayBuffer): Promise<void> {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    this.pdfDocument = await loadingTask.promise;
    this.totalPages = this.pdfDocument.numPages;
    this.currentPage = 1;
    this.pdfFieldService.setPdfDocument(this.pdfDocument);

    setTimeout(() => {
      this.renderPage(this.currentPage);
    }, 100);
  }

  async renderPage(pageNumber: number): Promise<void> {
    if (!this.pdfDocument || !this.pdfCanvas) return;

    if (this.renderTask) {
      try {
        await this.renderTask.cancel();
      } catch (error) {
      }
      this.renderTask = null;
    }

    if (this.isRendering) {
      return;
    }

    try {
      this.isRendering = true;

      const page = await this.pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: this.scale });

      const canvas = this.pdfCanvas.nativeElement;
      const context = canvas.getContext('2d')!;

      context.clearRect(0, 0, canvas.width, canvas.height);

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (this.drawingCanvas) {
        const drawCanvas = this.drawingCanvas.nativeElement;
        drawCanvas.height = viewport.height;
        drawCanvas.width = viewport.width;
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      this.renderTask = page.render(renderContext);
      await this.renderTask.promise;

      this.renderTask = null;

      this.pdfFieldService.setCurrentPage(pageNumber);
      this.pdfFieldService.setCurrentViewport(viewport);
      this.redrawOverlay();
    } catch (error) {
      if ((error as any).name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', error);
      }
    } finally {
      this.isRendering = false;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderPage(this.currentPage);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.renderPage(this.currentPage);
    }
  }

  onMouseDown(event: MouseEvent): void {
    if (!this.isDrawing) return;

    const rect = this.drawingCanvas.nativeElement.getBoundingClientRect();
    this.drawingStart = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing || !this.drawingStart) return;

    const rect = this.drawingCanvas.nativeElement.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    const ctx = this.drawingCanvas.nativeElement.getContext('2d')!;
    this.redrawOverlay();

    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      this.drawingStart.x,
      this.drawingStart.y,
      currentX - this.drawingStart.x,
      currentY - this.drawingStart.y
    );

    let viewport: any = null;
    this.pdfFieldService.currentViewport$.subscribe(vp => viewport = vp).unsubscribe();

    if (viewport) {
      const pixelLeft = Math.min(this.drawingStart.x, currentX);
      const pixelTop = Math.min(this.drawingStart.y, currentY);
      const pixelWidth = Math.abs(currentX - this.drawingStart.x);
      const pixelHeight = Math.abs(currentY - this.drawingStart.y);

      const pointsLeft = this.pdfFieldService.pixelsToPoints(pixelLeft, viewport.scale);
      const pointsTop = this.pdfFieldService.convertYCoordinate(pixelTop, pixelHeight, viewport, this.documentType);
      const pointsWidth = this.pdfFieldService.pixelsToPoints(pixelWidth, viewport.scale);
      const pointsHeight = this.pdfFieldService.pixelsToPoints(pixelHeight, viewport.scale);

      ctx.setLineDash([]);
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.fillText(
        `L: ${pointsLeft.toFixed(1)}, T: ${pointsTop.toFixed(1)}, W: ${pointsWidth.toFixed(1)}, H: ${pointsHeight.toFixed(1)}`,
        pixelLeft,
        pixelTop - 5
      );
    }
  }

  onMouseUp(event: MouseEvent): void {
    if (!this.isDrawing || !this.drawingStart) return;

    const rect = this.drawingCanvas.nativeElement.getBoundingClientRect();
    const endX = event.clientX - rect.left;
    const endY = event.clientY - rect.top;

    const selectedType = this.getSelectedFieldType();
    if (!selectedType) return;

    const fieldCount = this.fields.filter(f =>
      f.inputType === selectedType.inputType &&
      f.contentType === selectedType.contentType
    ).length + 1;
    let viewport: any = null;
    this.pdfFieldService.currentViewport$.subscribe(vp => viewport = vp).unsubscribe();

    if (!viewport) return;

    const pixelLeft = Math.min(this.drawingStart.x, endX);
    const pixelTop = Math.min(this.drawingStart.y, endY);
    const pixelWidth = Math.abs(endX - this.drawingStart.x);
    const pixelHeight = Math.abs(endY - this.drawingStart.y);

    const pointsLeft = this.pdfFieldService.pixelsToPoints(pixelLeft, viewport.scale);
    const pointsWidth = this.pdfFieldService.pixelsToPoints(pixelWidth, viewport.scale);
    const pointsHeight = this.pdfFieldService.pixelsToPoints(pixelHeight, viewport.scale);

    const pointsTop = this.pdfFieldService.convertYCoordinate(pixelTop, pixelHeight, viewport, this.documentType);

    const field: Field = {
      id: `field_${Date.now()}`,
      name: `${selectedType.label} ${fieldCount}`,
      inputType: selectedType.inputType,
      contentType: selectedType.contentType,
      readOnly: selectedType.readOnly,
      required: false,
      validation: selectedType.validation,
      validationData: selectedType.validationData,
      locations: {
        pageNumber: this.currentPage,
        left: Number(pointsLeft) || 0,
        top: Number(pointsTop) || 0,
        width: Number(pointsWidth) || 0,
        height: Number(pointsHeight) || 0
      },
      recipientIndex: this.recipientIndex,
    };

    this.pdfFieldService.addField(field);
    this.drawingStart = null;
  }

  toggleDrawing(): void {
    this.isDrawing = !this.isDrawing;
  }

  setFieldType(type: FormFieldInputType): void {
    this.fieldType = type;
  }

  getRecipientLabel(index: number): string {
    return this.pdfFieldService.getRecipientTypeName(index);
  }

  getSelectedFieldType(): FieldTypeCombination | undefined {
    return this.fieldTypeCombinations.find(ft =>
      `${ft.label}_${ft.inputType}_${ft.contentType}`.toLowerCase() === this.selectedFieldType
    );
  }

  getFieldTypeIcon(field: Field): string {
    const combination = this.fieldTypeCombinations.find(ft =>
      ft.inputType === field.inputType && ft.contentType === field.contentType
    );
    return combination?.icon || 'question';
  }




  redrawOverlay(): void {
    if (!this.drawingCanvas) return;

    const ctx = this.drawingCanvas.nativeElement.getContext('2d')!;
    ctx.clearRect(0, 0, this.drawingCanvas.nativeElement.width, this.drawingCanvas.nativeElement.height);

    let viewport: any = null;
    this.pdfFieldService.currentViewport$.subscribe(vp => viewport = vp).unsubscribe();

    if (!viewport) return;

    if (this.showGrid) {
      ctx.save();
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5;
      ctx.font = '10px Arial';
      ctx.fillStyle = '#999';

      const pageWidthInPoints = viewport.width / viewport.scale;
      const pageHeightInPoints = viewport.height / viewport.scale;

      for (let pointX = 0; pointX <= pageWidthInPoints; pointX += 50) {
        const pixelX = pointX * viewport.scale;
        ctx.beginPath();
        ctx.moveTo(pixelX, 0);
        ctx.lineTo(pixelX, viewport.height);
        ctx.stroke();

        ctx.fillText(pointX.toString(), pixelX + 2, 12);
      }

      for (let pointY = 0; pointY <= pageHeightInPoints; pointY += 50) {
        const pixelY = pointY * viewport.scale;
        ctx.beginPath();
        ctx.moveTo(0, pixelY);
        ctx.lineTo(viewport.width, pixelY);
        ctx.stroke();

        let displayY: number;
        if (this.documentType === AdobeDocumentType.LIBRARY) {
          // For LIBRARY type, use direct Y coordinate (0 at top)
          displayY = Math.round(pointY);
        } else {
          // For TRANSIENT type, use Adobe's bottom-origin system (0 at bottom)
          displayY = Math.round(pageHeightInPoints - pointY);
        }
        ctx.fillText(displayY.toString(), 2, pixelY - 2);
      }

      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.fillText(`Page: ${pageWidthInPoints.toFixed(0)} × ${pageHeightInPoints.toFixed(0)} points`, 10, viewport.height - 10);

      ctx.restore();
    }

    this.fields
      .filter(field => field.locations.pageNumber === this.currentPage)
      .forEach(field => {
        const left = field.locations.left * viewport.scale;
        const width = field.locations.width * viewport.scale;
        const height = field.locations.height * viewport.scale;

        let top: number;
        if (this.documentType === AdobeDocumentType.LIBRARY) {
          // For LIBRARY type, use direct top coordinate (0-based from top)
          top = field.locations.top * viewport.scale;
        } else {
          // For TRANSIENT type, use bottom-origin coordinate system
          const pageHeightInPoints = viewport.viewBox[3] - viewport.viewBox[1];
          const pdfTop = field.locations.top;
          const topInPoints = pageHeightInPoints - pdfTop;
          top = topInPoints * viewport.scale;
        }

        const color = this.getFieldColor(field);
        ctx.strokeStyle = color;
        ctx.fillStyle = color + '33';
        ctx.lineWidth = 2;

        ctx.fillRect(left, top, width, height);
        ctx.strokeRect(left, top, width, height);

        ctx.fillStyle = color;
        ctx.font = '11px Arial';

        ctx.fillText(
          field.name,
          left + 3,
          top + 12
        );

        ctx.fillText(
          this.getRecipientLabel(field.recipientIndex),
          left + 3,
          top + 24
        );

        ctx.font = '9px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(
          `(${field.locations.left?.toFixed?.(0) || 0}, ${field.locations.top?.toFixed?.(0) || 0})`,
          left + 3,
          top + height - 3
        );

        if (field.required) {
          ctx.fillStyle = '#ff0000';
          ctx.fillText('*', left + width - 10, top + 12);
        }
      });
  }

  getFieldColor(field: Field): string {
    const combination = this.fieldTypeCombinations.find(ft =>
      ft.inputType === field.inputType && ft.contentType === field.contentType
    );
    return combination?.color || '#1890ff';
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.pdfDocument && this.currentPage) {
      this.renderPage(this.currentPage);
    }
  }
}