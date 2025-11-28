import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { PdfFieldService } from '../../services/pdf-field.service';
import { HistoryService } from '../../services/history.service';
import { AdobeDocumentType, Field, FieldTypeCombination, FormFieldContentType, FormFieldInputType } from '../../models/field.model';
import * as pdfjsLib from 'pdfjs-dist';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

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
    NzSelectModule,
    NzSpaceModule,
    NzToolTipModule
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

  // Selection state
  selectedField: Field | null = null;
  hoveredField: Field | null = null;

  // Drag/Resize state
  isDragging = false;
  isResizing = false;
  dragStartPos: { x: number; y: number } | null = null;
  dragFieldStartPos: { left: number; top: number } | null = null;
  resizeHandle: string | null = null; // 'tl', 'tr', 'bl', 'br', 't', 'r', 'b', 'l'
  resizeStartBounds: { left: number; top: number; width: number; height: number } | null = null;

  // Snap to grid
  snapToGrid = false;
  gridSize = 10; // points

  // Undo/Redo state
  canUndo = false;
  canRedo = false;

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

  constructor(
    private pdfFieldService: PdfFieldService,
    public historyService: HistoryService,
    private modal: NzModalService
  ) { }

  /**
   * Handle keyboard shortcuts
   */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Ctrl+Z: Undo
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.historyService.undo();
      this.selectedField = null;
      this.redrawOverlay();
      return;
    }

    // Ctrl+Shift+Z or Ctrl+Y: Redo
    if ((event.ctrlKey && event.shiftKey && event.key === 'Z') || (event.ctrlKey && event.key === 'y')) {
      event.preventDefault();
      this.historyService.redo();
      this.selectedField = null;
      this.redrawOverlay();
      return;
    }

    // Delete key: delete selected field
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.selectedField && !this.isDrawing) {
        event.preventDefault();
        this.pdfFieldService.deleteField(this.selectedField.id);
        this.selectedField = null;
        this.redrawOverlay();
      }
      return;
    }

    // Escape key: deselect field or cancel drag/resize
    if (event.key === 'Escape') {
      if (this.isDragging || this.isResizing) {
        this.cancelDragOrResize();
      } else if (this.selectedField) {
        this.selectedField = null;
        this.redrawOverlay();
      }
      return;
    }
  }

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

    // Subscribe to undo/redo state
    this.historyService.canUndo$.subscribe(canUndo => {
      this.canUndo = canUndo;
    });

    this.historyService.canRedo$.subscribe(canRedo => {
      this.canRedo = canRedo;
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
    const rect = this.drawingCanvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.isDrawing) {
      // Drawing mode: start drawing a new field
      this.drawingStart = { x, y };
      return;
    }

    // Not in drawing mode - check for selection, drag, or resize
    let viewport: any = null;
    this.pdfFieldService.currentViewport$.subscribe(vp => viewport = vp).unsubscribe();

    if (!viewport) return;

    // Check if clicking on selected field's resize handle
    if (this.selectedField) {
      const handle = this.getResizeHandleAtPoint(x, y, this.selectedField, viewport);
      if (handle) {
        // Start resize operation
        this.isResizing = true;
        this.resizeHandle = handle;
        this.dragStartPos = { x, y };
        this.resizeStartBounds = {
          left: this.selectedField.locations.left,
          top: this.selectedField.locations.top,
          width: this.selectedField.locations.width,
          height: this.selectedField.locations.height
        };
        return;
      }
    }

    // Check for field selection or drag
    const fieldAtPoint = this.getFieldAtPoint(x, y);

    if (fieldAtPoint) {
      if (this.selectedField?.id === fieldAtPoint.id) {
        // Clicking on already selected field - start drag
        this.isDragging = true;
        this.dragStartPos = { x, y };
        this.dragFieldStartPos = {
          left: fieldAtPoint.locations.left,
          top: fieldAtPoint.locations.top
        };
      } else {
        // Select different field
        this.selectedField = fieldAtPoint;
        this.redrawOverlay();
      }
    } else {
      // Clicked on empty space - deselect
      this.selectedField = null;
      this.redrawOverlay();
    }
  }

  onMouseMove(event: MouseEvent): void {
    const rect = this.drawingCanvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let viewport: any = null;
    this.pdfFieldService.currentViewport$.subscribe(vp => viewport = vp).unsubscribe();

    if (!viewport) return;

    // Handle dragging
    if (this.isDragging && this.selectedField && this.dragStartPos && this.dragFieldStartPos) {
      const deltaX = this.pdfFieldService.pixelsToPoints(x - this.dragStartPos.x, viewport.scale);
      const deltaY = this.pdfFieldService.pixelsToPoints(y - this.dragStartPos.y, viewport.scale);

      let newLeft = this.dragFieldStartPos.left + deltaX;
      let newTop = this.dragFieldStartPos.top + (this.documentType === AdobeDocumentType.LIBRARY ? deltaY : -deltaY);

      // Apply snap to grid
      newLeft = this.snapToGridPoint(newLeft);
      newTop = this.snapToGridPoint(newTop);

      // Update field position temporarily (not in history yet)
      this.pdfFieldService.moveField(this.selectedField.id, newLeft, newTop, false);
      return;
    }

    // Handle resizing
    if (this.isResizing && this.selectedField && this.dragStartPos && this.resizeStartBounds && this.resizeHandle) {
      const deltaX = this.pdfFieldService.pixelsToPoints(x - this.dragStartPos.x, viewport.scale);
      const deltaY = this.pdfFieldService.pixelsToPoints(y - this.dragStartPos.y, viewport.scale);

      let { left, top, width, height } = this.resizeStartBounds;

      // Apply deltas based on which handle is being dragged
      const yMultiplier = this.documentType === AdobeDocumentType.LIBRARY ? 1 : -1;

      switch (this.resizeHandle) {
        case 'tl': // Top-left
          left += deltaX;
          top += deltaY * yMultiplier;
          width -= deltaX;
          height -= deltaY * yMultiplier;
          break;
        case 'tr': // Top-right
          top += deltaY * yMultiplier;
          width += deltaX;
          height -= deltaY * yMultiplier;
          break;
        case 'bl': // Bottom-left
          left += deltaX;
          width -= deltaX;
          height += deltaY * yMultiplier;
          break;
        case 'br': // Bottom-right
          width += deltaX;
          height += deltaY * yMultiplier;
          break;
        case 't': // Top edge
          top += deltaY * yMultiplier;
          height -= deltaY * yMultiplier;
          break;
        case 'b': // Bottom edge
          height += deltaY * yMultiplier;
          break;
        case 'l': // Left edge
          left += deltaX;
          width -= deltaX;
          break;
        case 'r': // Right edge
          width += deltaX;
          break;
      }

      // Apply minimum size constraints
      const minSize = 20; // points
      if (width < minSize) width = minSize;
      if (height < minSize) height = minSize;

      // Apply snap to grid
      left = this.snapToGridPoint(left);
      top = this.snapToGridPoint(top);
      width = this.snapToGridPoint(width);
      height = this.snapToGridPoint(height);

      // Update field temporarily (not in history yet)
      this.pdfFieldService.resizeField(this.selectedField.id, left, top, width, height, false);
      return;
    }

    // Handle drawing mode
    if (this.isDrawing) {
      if (!this.drawingStart) return;

      const currentX = x;
      const currentY = y;

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
      return;
    }

    // Update hover state and cursor
    const fieldAtPoint = this.getFieldAtPoint(x, y);
    if (fieldAtPoint !== this.hoveredField) {
      this.hoveredField = fieldAtPoint;
      this.redrawOverlay();
    }

    // Update cursor based on what's under the mouse
    let cursor = 'default';
    if (this.selectedField) {
      const handle = this.getResizeHandleAtPoint(x, y, this.selectedField, viewport);
      if (handle) {
        // Resize cursor based on handle
        const cursorMap: { [key: string]: string } = {
          'tl': 'nwse-resize', 'br': 'nwse-resize',
          'tr': 'nesw-resize', 'bl': 'nesw-resize',
          't': 'ns-resize', 'b': 'ns-resize',
          'l': 'ew-resize', 'r': 'ew-resize'
        };
        cursor = cursorMap[handle] || 'default';
      } else if (fieldAtPoint?.id === this.selectedField.id) {
        cursor = 'move';
      } else if (fieldAtPoint) {
        cursor = 'pointer';
      }
    } else if (fieldAtPoint) {
      cursor = 'pointer';
    }

    this.drawingCanvas.nativeElement.style.cursor = cursor;
  }

  onMouseUp(event: MouseEvent): void {
    // Complete drag operation
    if (this.isDragging && this.selectedField && this.dragFieldStartPos) {
      const currentField = this.fields.find(f => f.id === this.selectedField?.id);
      if (currentField) {
        // Only add to history if position actually changed
        if (currentField.locations.left !== this.dragFieldStartPos.left ||
            currentField.locations.top !== this.dragFieldStartPos.top) {
          // Re-apply the move with history enabled
          this.pdfFieldService.moveField(
            currentField.id,
            currentField.locations.left,
            currentField.locations.top,
            true
          );
        }
      }
      this.isDragging = false;
      this.dragStartPos = null;
      this.dragFieldStartPos = null;
      return;
    }

    // Complete resize operation
    if (this.isResizing && this.selectedField && this.resizeStartBounds) {
      const currentField = this.fields.find(f => f.id === this.selectedField?.id);
      if (currentField) {
        // Only add to history if size/position actually changed
        const bounds = this.resizeStartBounds;
        if (currentField.locations.left !== bounds.left ||
            currentField.locations.top !== bounds.top ||
            currentField.locations.width !== bounds.width ||
            currentField.locations.height !== bounds.height) {
          // Re-apply the resize with history enabled
          this.pdfFieldService.resizeField(
            currentField.id,
            currentField.locations.left,
            currentField.locations.top,
            currentField.locations.width,
            currentField.locations.height,
            true
          );
        }
      }
      this.isResizing = false;
      this.resizeHandle = null;
      this.dragStartPos = null;
      this.resizeStartBounds = null;
      return;
    }

    // Handle drawing mode
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
      name: this.generateSmartFieldName(selectedType.inputType, selectedType.contentType ?? FormFieldContentType.DATA),
      inputType: selectedType.inputType,
      contentType: selectedType.contentType ?? FormFieldContentType.DATA,
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

  /**
   * Draw selection handles around a field (corners + edges)
   */
  drawSelectionHandles(ctx: CanvasRenderingContext2D, left: number, top: number, width: number, height: number): void {
    const handleSize = 8;
    const handles = [
      // Corner handles
      { x: left, y: top },  // Top-left
      { x: left + width, y: top },  // Top-right
      { x: left, y: top + height },  // Bottom-left
      { x: left + width, y: top + height },  // Bottom-right
      // Edge handles
      { x: left + width / 2, y: top },  // Top-middle
      { x: left + width / 2, y: top + height },  // Bottom-middle
      { x: left, y: top + height / 2 },  // Left-middle
      { x: left + width, y: top + height / 2 },  // Right-middle
    ];

    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    handles.forEach(handle => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });
  }

  /**
   * Find field at given canvas coordinates
   */
  getFieldAtPoint(x: number, y: number): Field | null {
    let viewport: any = null;
    this.pdfFieldService.currentViewport$.subscribe(vp => viewport = vp).unsubscribe();

    if (!viewport) return null;

    // Check fields in reverse order (top fields first)
    const fieldsOnPage = this.fields
      .filter(field => field.locations.pageNumber === this.currentPage)
      .reverse();

    for (const field of fieldsOnPage) {
      const left = field.locations.left * viewport.scale;
      const width = field.locations.width * viewport.scale;
      const height = field.locations.height * viewport.scale;

      let top: number;
      if (this.documentType === AdobeDocumentType.LIBRARY) {
        top = field.locations.top * viewport.scale;
      } else {
        const pageHeightInPoints = viewport.viewBox[3] - viewport.viewBox[1];
        const pdfTop = field.locations.top;
        const topInPoints = pageHeightInPoints - pdfTop;
        top = topInPoints * viewport.scale;
      }

      // Check if point is inside field bounds
      if (x >= left && x <= left + width && y >= top && y <= top + height) {
        return field;
      }
    }

    return null;
  }

  /**
   * Generate smart field name based on input type and content type
   * Examples:
   * - TEXT_FIELD + SIGNER_NAME → "signer_name_1"
   * - SIGNATURE + SIGNATURE → "signature_1"
   * - DATE + SIGNATURE_DATE → "date_signed_1"
   * - TEXT_FIELD + DATA → "text_field_1"
   */
  generateSmartFieldName(inputType: FormFieldInputType, contentType: FormFieldContentType): string {
    // Define smart names for common combinations
    const nameMap: { [key: string]: string } = {
      // Text fields
      [`${FormFieldInputType.TEXT_FIELD}_${FormFieldContentType.DATA}`]: 'text_field',
      [`${FormFieldInputType.TEXT_FIELD}_${FormFieldContentType.SIGNER_NAME}`]: 'signer_name',
      [`${FormFieldInputType.TEXT_FIELD}_${FormFieldContentType.SIGNER_EMAIL}`]: 'signer_email',
      [`${FormFieldInputType.MULTILINE}_${FormFieldContentType.DATA}`]: 'multiline_text',

      // Signature fields
      [`${FormFieldInputType.SIGNATURE}_${FormFieldContentType.SIGNATURE}`]: 'signature',
      [`${FormFieldInputType.SIGNATURE}_${FormFieldContentType.SIGNER_INITIALS}`]: 'initials',

      // Date fields
      [`${FormFieldInputType.DATE}_${FormFieldContentType.DATA}`]: 'date_field',
      [`${FormFieldInputType.DATE}_${FormFieldContentType.SIGNATURE_DATE}`]: 'date_signed',

      // Other fields
      [`${FormFieldInputType.CHECKBOX}_${FormFieldContentType.DATA}`]: 'checkbox',
      [`${FormFieldInputType.RADIO}_${FormFieldContentType.DATA}`]: 'radio_button',
    };

    const key = `${inputType}_${contentType}`;
    const baseName = nameMap[key] || 'field';

    // Count existing fields of the same type
    const existingCount = this.fields.filter(f =>
      f.inputType === inputType && f.contentType === contentType
    ).length;

    return `${baseName}_${existingCount + 1}`;
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
        const isSelected = this.selectedField?.id === field.id;
        const isHovered = this.hoveredField?.id === field.id;

        // Draw field background and border
        ctx.strokeStyle = isSelected ? '#1890ff' : (isHovered ? '#40a9ff' : color);
        ctx.fillStyle = (isSelected ? '#1890ff' : (isHovered ? '#40a9ff' : color)) + '33';
        ctx.lineWidth = isSelected ? 3 : (isHovered ? 2.5 : 2);

        ctx.fillRect(left, top, width, height);
        ctx.strokeRect(left, top, width, height);

        // Draw selection handles if selected
        if (isSelected) {
          this.drawSelectionHandles(ctx, left, top, width, height);
        }

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

  /**
   * Snap coordinate to grid if enabled
   */
  snapToGridPoint(value: number): number {
    if (!this.snapToGrid) return value;
    return Math.round(value / this.gridSize) * this.gridSize;
  }

  /**
   * Cancel drag or resize operation
   */
  cancelDragOrResize(): void {
    this.isDragging = false;
    this.isResizing = false;
    this.dragStartPos = null;
    this.dragFieldStartPos = null;
    this.resizeHandle = null;
    this.resizeStartBounds = null;
    this.redrawOverlay();
  }

  /**
   * Check if mouse is over a resize handle
   * Returns handle name or null
   */
  getResizeHandleAtPoint(x: number, y: number, field: Field, viewport: any): string | null {
    if (!field) return null;

    const left = field.locations.left * viewport.scale;
    const width = field.locations.width * viewport.scale;
    const height = field.locations.height * viewport.scale;

    let top: number;
    if (this.documentType === AdobeDocumentType.LIBRARY) {
      top = field.locations.top * viewport.scale;
    } else {
      const pageHeightInPoints = viewport.viewBox[3] - viewport.viewBox[1];
      const pdfTop = field.locations.top;
      const topInPoints = pageHeightInPoints - pdfTop;
      top = topInPoints * viewport.scale;
    }

    const handleSize = 8;
    const hitMargin = 4;

    // Check corner handles
    const handles = [
      { name: 'tl', x: left, y: top },
      { name: 'tr', x: left + width, y: top },
      { name: 'bl', x: left, y: top + height },
      { name: 'br', x: left + width, y: top + height },
      // Edge handles
      { name: 't', x: left + width / 2, y: top },
      { name: 'b', x: left + width / 2, y: top + height },
      { name: 'l', x: left, y: top + height / 2 },
      { name: 'r', x: left + width, y: top + height / 2 },
    ];

    for (const handle of handles) {
      const distance = Math.sqrt(
        Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2)
      );
      if (distance <= (handleSize / 2 + hitMargin)) {
        return handle.name;
      }
    }

    return null;
  }

  changeDocumentType(type: AdobeDocumentType): void {
    this.modal.create({
      nzTitle: 'Change Document Type - Field Remapping Required',
      nzContent: `
    <p><strong>Changing the document type will remap all field coordinates.</strong></p>
    <p>Adobe Sign uses different coordinate systems:</p>
    <ul style="margin: 10px 0;">
      <li><strong>TRANSIENT:</strong> Origin at bottom-left (0,0)</li>
      <li><strong>LIBRARY:</strong> Origin at top-left (0,0)</li>
    </ul>
    <p>All your fields will be automatically repositioned to maintain their visual placement in the new coordinate system. The Y-coordinates will be recalculated.</p>
    <p style="color: #ff4d4f; margin-top: 10px;">
      <strong>Note:</strong> This affects the exported JSON values. Please verify field positions after the change.
    </p>
  `,
      nzClosable: true,
      nzOkText: 'Continue with Remapping',
      nzOkType: 'primary',
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        this.documentType = type;
        this.redrawOverlay();
      },
      nzWidth: 520,
      nzMaskClosable: false,
      nzIconType: 'exclamation-circle'
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.pdfDocument && this.currentPage) {
      this.renderPage(this.currentPage);
    }
  }
}