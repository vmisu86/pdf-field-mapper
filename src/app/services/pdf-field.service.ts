import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdobeDocumentType, Field, IFormFieldGeneratorViewModel } from '../models/field.model';

@Injectable({
  providedIn: 'root'
})
export class PdfFieldService {
  private fieldsSubject = new BehaviorSubject<Field[]>([]);
  fields$: Observable<Field[]> = this.fieldsSubject.asObservable();

  private pdfDocumentSubject = new BehaviorSubject<any>(null);
  pdfDocument$: Observable<any> = this.pdfDocumentSubject.asObservable();

  private currentPageSubject = new BehaviorSubject<number>(1);
  currentPage$: Observable<number> = this.currentPageSubject.asObservable();

  private currentViewportSubject = new BehaviorSubject<any>(null);
  currentViewport$: Observable<any> = this.currentViewportSubject.asObservable();

  constructor() { }

  setPdfDocument(doc: any): void {
    this.pdfDocumentSubject.next(doc);
  }

  setCurrentPage(page: number): void {
    this.currentPageSubject.next(page);
  }

  setCurrentViewport(viewport: any): void {
    this.currentViewportSubject.next(viewport);
  }

  // Convert canvas pixels to PDF points
   pixelsToPoints(pixels: number, scale: number): number {
    return pixels / scale;
  }
  // Convert Y coordinate from top-origin to bottom-origin
  convertYCoordinate(y: number, height: number, viewport: any, documentType: AdobeDocumentType): number {
    if (documentType === AdobeDocumentType.LIBRARY) {
      // For LIBRARY type, use direct coordinate (0-based from top)
      return y / viewport.scale;
    } else {
      // For TRANSIENT type, use bottom-origin coordinate system
      const pageHeightInPoints = viewport.viewBox[3] - viewport.viewBox[1];
      const yInPoints = y / viewport.scale;
      return pageHeightInPoints - yInPoints;
    }
  }

  addField(field: Field): void {
    const currentFields = this.fieldsSubject.value;
    this.fieldsSubject.next([...currentFields, field]);
  }

  updateField(id: string, updates: Partial<Field>): void {
    const currentFields = this.fieldsSubject.value;
    const updatedFields = currentFields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    );
    this.fieldsSubject.next(updatedFields);
  }

  deleteField(id: string): void {
    const currentFields = this.fieldsSubject.value;
    this.fieldsSubject.next(currentFields.filter(field => field.id !== id));
  }

  getFields(): Field[] {
    return this.fieldsSubject.value;
  }

  // Convert to backend ViewModel format
  exportToViewModelFormat(): IFormFieldGeneratorViewModel[] {
    return this.fieldsSubject.value.map(field => ({
      name: field.name,
      inputType: field.inputType,
      contentType: field.contentType,
      required: field.required,
      validation: field.validation,
      validationData: field.validationData,
      locations: [
        {
          pageNumber: field.locations.pageNumber,
          left: Number(field.locations.left),
          top: Number(field.locations.top),
          width: Number(field.locations.width),
          height: Number(field.locations.height)
        }
      ],
      recipientIndex: field.recipientIndex,
      readOnly: field.readOnly
    }));
  }
  

  // Import fields from backend format
  importFromViewModelFormat(viewModels: any[]): void {
    const fields: Field[] = viewModels.map((vm, index) => {
      const location = Array.isArray(vm.locations) ? vm.locations[0] : vm.locations;
      
      return {
        id: `field_${Date.now()}_${index}`,
        name: vm.name,
        inputType: vm.inputType,
        contentType: vm.contentType,
        required: vm.required,
        recipientIndex: 1, 
        validation: vm.validation || '',
        validationData: vm.validationData || '',
        readOnly: vm.readOnly || false,
        locations: {
          pageNumber: Number(location.pageNumber),
          left: Number(location.left),
          top: Number(location.top),
          width: Number(location.width),
          height: Number(location.height)
        }
      };
    });
  
    this.fieldsSubject.next(fields);
  }
  // Helper to get recipient type name
  getRecipientTypeName(index: number): string {
    switch (index) {
      case 1: return 'SIGNER';
      case 2: return 'APPROVER';
      default: return 'UNKNOWN';
    }
  }
}