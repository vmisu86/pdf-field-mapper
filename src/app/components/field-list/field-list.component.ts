import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PdfFieldService } from '../../services/pdf-field.service';
import { Field, FormFieldInputType } from '../../models/field.model';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-field-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzCardModule,
    NzTagModule,
    NzEmptyModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzIconModule,
    NzUploadModule,
    NzModalModule
  ],
  providers: [NzMessageService],
  templateUrl: './field-list.component.html',
  styleUrls: ['./field-list.component.less']
})
export class FieldListComponent implements OnInit {
  fields: Field[] = [];
  editingField: Field | null = null;
  
  FormFieldInputType = FormFieldInputType;

  constructor(
    private pdfFieldService: PdfFieldService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.pdfFieldService.fields$.subscribe(fields => {
      this.fields = fields;
    });
  }

  editField(field: Field): void {
    this.editingField = { ...field };
  }

  saveField(): void {
    if (this.editingField) {
      this.pdfFieldService.updateField(this.editingField.id, this.editingField);
      this.editingField = null;
      this.message.success('Field updated successfully');
    }
  }

  cancelEdit(): void {
    this.editingField = null;
  }

  deleteField(id: string): void {
    this.pdfFieldService.deleteField(id);
    this.message.success('Field deleted successfully');
  }

  exportFields(): void {
    const viewModelFormat = this.pdfFieldService.exportToViewModelFormat();
    const jsonString = JSON.stringify(viewModelFormat, null, 2);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'form-fields.json';
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.message.success('Fields exported successfully');
    console.log('Exported ViewModel format:', viewModelFormat);
  }

  beforeUpload = (): boolean => {
    return false;
  }

  async importFields(event: any): Promise<void> {
    const file = event.file?.originFileObj || event.file;
    if (file && file.type === 'application/json') {
      try {
        const text = await this.readFileAsText(file);
        const viewModels = JSON.parse(text);
        this.pdfFieldService.importFromViewModelFormat(viewModels);
        this.message.success('Fields imported successfully');
      } catch (error) {
        this.message.error('Failed to import fields. Please check the file format.');
        console.error('Import error:', error);
      }
    }
  }
  
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        resolve(e.target.result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsText(file);
    });
  }

  getFieldTypeIcon(type: string, contentType?: string): string {
    if (contentType === 'SIGNER_INITIALS') return 'highlight';
    if (contentType === 'SIGNER_NAME') return 'user';
    if (contentType === 'SIGNER_EMAIL') return 'mail';
    if (contentType === 'SIGNER_TITLE') return 'idcard';
    if (contentType === 'SIGNER_COMPANY') return 'bank';
    if (contentType === 'SIGNING_DATE') return 'calendar';
    if (contentType === 'QR_CODE') return 'qrcode';
    
    const icons: { [key: string]: string } = {
      TEXT_FIELD: 'font-size',
      MULTILINE: 'file-text',
      SIGNATURE: 'edit',
      CHECKBOX: 'check-square',
      RADIO: 'check-circle',
      DROP_DOWN: 'down-square',
      DATE: 'calendar',
      HYPERLINK: 'link',
      IMAGE: 'picture'
    };
    return icons[type] || 'question';
  }

  getFieldTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      TEXT_FIELD: 'blue',
      SIGNATURE: 'green',
      INITIALS: 'green',
      CHECKBOX: 'purple',
      RADIO_BUTTON: 'purple',
      DROP_DOWN: 'cyan',
      MULTILINE_TEXT: 'blue',
      DATE: 'orange',
      HYPERLINK: 'magenta'
    };
    return colors[type] || 'default';
  }


  getRecipientLabel(index: number): string {
    return this.pdfFieldService.getRecipientTypeName(index);
  }

  getRecipientColor(index: number): string {
    switch (index) {
      case 1: return 'blue';
      case 2: return 'orange';
      default: return 'default';
    }
  }

    showFieldsJson(): void {
    const adobeSignFormat = this.pdfFieldService.exportToViewModelFormat();
    const jsonString = JSON.stringify(adobeSignFormat, null, 2);

    this.modal.create({
      nzTitle: 'Adobe Sign Fields (JSON)',
      nzContent: `<pre style="white-space: pre-wrap;word-break: break-all;background: #f5f5f5;padding: 1em;border-radius: 6px;">${jsonString}</pre>`,
      nzFooter: null,
      nzWidth: 700,
      nzMaskClosable: true,
      nzClosable: true,
      nzWrapClassName: 'json-modal'
    });
  }
}