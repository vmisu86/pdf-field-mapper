# PDF Field Mapper - Project Analysis & Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Core Functionality](#core-functionality)
5. [Key Features](#key-features)
6. [Architecture & Code Organization](#architecture--code-organization)
7. [Components](#components)
8. [Services & State Management](#services--state-management)
9. [Data Models](#data-models)
10. [Configuration](#configuration)
11. [Dependencies](#dependencies)
12. [Build & Development](#build--development)
13. [Coordinate Systems](#coordinate-systems)
14. [Adobe Sign Integration](#adobe-sign-integration)
15. [Future Enhancements](#future-enhancements)

---

## Project Overview

**PDF Field Mapper** is a web-based visual form field configuration tool built with Angular 19. It enables users to interactively place and configure form fields on PDF documents, then export the configurations in Adobe Sign-compatible format.

### Purpose

The application allows users to:
- Upload PDF documents
- Visually draw form fields directly on the PDF
- Configure field properties (type, name, validation, recipients)
- Export field configurations as JSON for Adobe Sign integration
- Import previously saved configurations

### Primary Use Case

Embed document preparation capabilities in enterprise applications, eliminating the need for users to leave their application to configure Adobe Sign forms.

---

## Project Structure

```
pdf-field-mapper/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── pdf-viewer/              # Main PDF display and field drawing
│   │   │   │   ├── pdf-viewer.component.ts
│   │   │   │   ├── pdf-viewer.component.html
│   │   │   │   └── pdf-viewer.component.less
│   │   │   ├── field-list/              # Field management panel
│   │   │   │   ├── field-list.component.ts
│   │   │   │   ├── field-list.component.html
│   │   │   │   └── field-list.component.less
│   │   │   └── field-drawer/            # Field type palette
│   │   │       ├── field-drawer.component.ts
│   │   │       ├── field-drawer.component.html
│   │   │       └── field-drawer.component.less
│   │   ├── models/
│   │   │   └── field.model.ts           # Type definitions and interfaces
│   │   ├── services/
│   │   │   └── pdf-field.service.ts     # State management
│   │   ├── app.component.ts             # Root component
│   │   ├── app.component.html           # Root template
│   │   ├── app.component.less           # Root styles
│   │   ├── app.routes.ts                # Routing configuration
│   │   └── app.config.ts                # Application configuration
│   ├── index.html                       # HTML entry point
│   ├── main.ts                          # Bootstrap file
│   └── styles.less                      # Global styles
├── public/
│   └── favicon.ico                      # Application icon
├── .vscode/                             # VS Code configuration
│   ├── extensions.json
│   ├── launch.json
│   └── tasks.json
├── angular.json                         # Angular CLI configuration
├── tsconfig.json                        # TypeScript configuration
├── tsconfig.app.json                    # App-specific TS config
├── tsconfig.spec.json                   # Test TS config
├── package.json                         # Dependencies and scripts
├── package-lock.json                    # Dependency lock file
├── .editorconfig                        # Editor settings
├── .gitignore                           # Git ignore rules
└── README.md                            # Project documentation
```

---

## Technology Stack

### Frontend Framework
- **Angular 19.2.0** - Modern component-based framework with standalone components
- **TypeScript 5.7.2** - Type-safe development

### PDF Processing
- **PDF.js (pdfjs-dist) 5.3.31** - Client-side PDF rendering
- Worker: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.mjs`

### UI Components
- **ng-zorro-antd 19.3.1** - Ant Design components for Angular
- **@ant-design/icons-angular** - Icon library

### State Management
- **RxJS 7.8.x** - Reactive programming with Observables and BehaviorSubject

### Build Tools
- **Angular CLI 19.2.3** - Command-line interface
- **Vite** - Fast module bundler (Angular 19+ default)

### Testing
- **Jasmine 5.6.0** - Testing framework
- **Karma 6.4.0** - Test runner
- **Karma Chrome Launcher** - Browser automation

### Styling
- **LESS** - CSS preprocessor

---

## Core Functionality

### 1. PDF Upload & Rendering
- Upload PDF files via file input
- Client-side rendering using PDF.js
- Multi-page document support
- Page navigation controls
- Dynamic scaling (1.5x default)

### 2. Visual Field Drawing
- Interactive drawing mode
- Mouse-based field creation (drag to draw rectangles)
- Real-time coordinate display
- Visual feedback during placement

### 3. Field Configuration
- Set field types (text, signature, date, checkbox, etc.)
- Configure field properties:
  - Name
  - Type (input type + content type)
  - Position (left, top, width, height)
  - Page number
  - Required flag
  - Validation rules
  - Recipient assignment (SIGNER, APPROVER)

### 4. Coordinate Grid Overlay
- Toggleable grid display
- Shows PDF points and coordinates
- Supports both TRANSIENT and LIBRARY coordinate systems
- Precise positioning aid

### 5. Data Import/Export
- Export to Adobe Sign-compatible JSON format
- Import from JSON files
- View JSON representation
- Maintain field configurations

---

## Key Features

### Supported Field Types (~15 types)

**Text Fields:**
- Text Field
- Multiline Text
- Signer Name
- Signer Email

**Signature Fields:**
- Signature
- Initials

**Date Fields:**
- Date Field
- Date-CUSTOM
- Signing Date (read-only)

**Other:**
- Checkbox
- Radio Button

### Field Management
- Create, read, update, delete operations
- Edit properties inline
- Visual field list in sidebar
- Field validation support
- Multi-recipient support

### UI Features
- Professional Ant Design interface
- Color-coded field types
- Icon indicators for field types
- Tag-based information display
- Responsive layout
- Clean header/content/sidebar structure

### Adobe Sign Compatibility
- Exports to ViewModel format
- Supports TRANSIENT and LIBRARY document types
- Multi-recipient configurations
- Read-only field support
- Validation data fields

---

## Architecture & Code Organization

### Application Bootstrap

**main.ts**
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

- Uses standalone bootstrap (no NgModule)
- Loads app configuration
- Entry point for Angular application

### Architectural Patterns

1. **RxJS-Based State Management**
   - All state flows through BehaviorSubjects
   - Observable streams for reactive updates
   - Centralized state in PdfFieldService

2. **Standalone Components**
   - Modern Angular architecture
   - No NgModule required
   - Direct component imports

3. **Two-Canvas Approach**
   - PDF.js canvas for rendering
   - Overlay canvas for interactions
   - Optimized for performance

4. **Coordinate System Abstraction**
   - Handles browser pixels
   - PDF.js viewport coordinates
   - Adobe Sign point coordinates

---

## Components

### 1. AppComponent (Root)

**File:** `app.component.ts`

**Responsibility:**
- Root layout component
- Provides page structure with header and content areas
- Imports and composes PdfViewerComponent and FieldListComponent

**Template Structure:**
```html
<nz-layout>
  <nz-header>
    <h1>PDF Field Mapper</h1>
  </nz-header>
  <nz-layout>
    <nz-content>
      <app-pdf-viewer />
    </nz-content>
    <nz-sider>
      <app-field-list />
    </nz-sider>
  </nz-layout>
</nz-layout>
```

---

### 2. PdfViewerComponent

**File:** `pdf-viewer.component.ts` (520 lines)

**Responsibility:**
- Main PDF rendering and field drawing interface
- Handles PDF upload and rendering
- Implements drawing mode for field creation
- Manages canvas interactions
- Displays coordinate grid overlay

**Key Properties:**
```typescript
pdfDocument: PDFDocumentProxy | null = null;
currentPage: number = 1;
totalPages: number = 0;
scale: number = 1.5;
isDrawing: boolean = false;
showGrid: boolean = false;
fields: Field[] = [];
fieldTypeCombinations: FieldTypeCombination[] = [...]
```

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `loadPdf()` | Load PDF from file input |
| `renderPage()` | Render current page to canvas |
| `onMouseDown/Move/Up()` | Handle field drawing interactions |
| `toggleDrawing()` | Toggle drawing mode on/off |
| `redrawOverlay()` | Redraw fields and grid on canvas |
| `pixelsToPoints()` | Convert pixel coordinates to PDF points |
| `convertYCoordinate()` | Handle different coordinate systems |

**Canvas Management:**
- `@ViewChild('pdfCanvas')` - Main PDF.js rendering canvas
- `@ViewChild('overlayCanvas')` - Interactive overlay for fields

**Coordinate Conversion:**
```typescript
pixelsToPoints(pixels: number): number {
  return (pixels / this.scale) * (72 / 96);
}

convertYCoordinate(y: number, height: number, viewport: any): number {
  if (this.documentType === 'TRANSIENT') {
    return viewport.height - y - height;
  }
  return y;
}
```

---

### 3. FieldListComponent

**File:** `field-list.component.ts` (195 lines)

**Responsibility:**
- Sidebar panel for field management
- Display configured fields
- Edit field properties
- Delete fields
- Export/import configurations
- View JSON representation

**Key Properties:**
```typescript
fields: Field[] = [];
editingField: Field | null = null;
isModalVisible = false;
jsonData = '';
documentTypes = ['TRANSIENT', 'LIBRARY'];
```

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `editField(field)` | Open edit modal for field |
| `saveField()` | Save edited field properties |
| `deleteField(id)` | Remove field from list |
| `exportFields()` | Download fields as JSON file |
| `importFields(event)` | Load fields from JSON file |
| `showFieldsJson()` | Display JSON in modal |

**UI Features:**
- Collapsible panels for each field
- Edit modal with form inputs
- JSON viewer modal
- Export/import buttons
- Color-coded field type tags

---

### 4. FieldDrawerComponent

**File:** `field-drawer.component.ts` (29 lines)

**Responsibility:**
- Field type palette (minimal implementation)
- Drag-start event handling (for future drag-and-drop)

**Key Properties:**
```typescript
fieldTypes = [
  { label: 'Text Field', type: 'TEXT_FIELD', icon: 'form' },
  { label: 'Signature', type: 'SIGNATURE', icon: 'edit' },
  { label: 'Date', type: 'DATE', icon: 'calendar' },
  { label: 'Checkbox', type: 'CHECKBOX', icon: 'check-square' }
];
```

**Note:** Currently minimal; could be extended for drag-and-drop field creation.

---

## Services & State Management

### PdfFieldService

**File:** `pdf-field.service.ts` (133 lines)

**Responsibility:**
- Centralized state management using RxJS
- Manages fields, PDF document, current page, viewport
- Coordinate conversion utilities
- Import/export to Adobe Sign format

**State Subjects:**
```typescript
private fieldsSubject = new BehaviorSubject<Field[]>([]);
public fields$ = this.fieldsSubject.asObservable();

private pdfDocumentSubject = new BehaviorSubject<PDFDocumentProxy | null>(null);
public pdfDocument$ = this.pdfDocumentSubject.asObservable();

private currentPageSubject = new BehaviorSubject<number>(1);
public currentPage$ = this.currentPageSubject.asObservable();

private currentViewportSubject = new BehaviorSubject<any>(null);
public currentViewport$ = this.currentViewportSubject.asObservable();
```

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `addField(field)` | Add new field to state |
| `updateField(id, updates)` | Update existing field |
| `deleteField(id)` | Remove field from state |
| `setFields(fields)` | Replace all fields |
| `setPdfDocument(doc)` | Set loaded PDF document |
| `setCurrentPage(page)` | Set active page number |
| `setCurrentViewport(viewport)` | Set PDF.js viewport |
| `exportToViewModelFormat()` | Convert to Adobe Sign format |
| `importFromViewModelFormat(data)` | Import from Adobe Sign format |
| `pixelsToPoints(pixels)` | Convert pixels to points |
| `convertYCoordinate(y, height, viewport, docType)` | Handle coordinate systems |

**Export Format:**
```typescript
exportToViewModelFormat(): IFormFieldGeneratorViewModel {
  return {
    documentType: 'TRANSIENT',
    formFields: this.fieldsSubject.value.map(field => ({
      inputType: field.inputType,
      contentType: field.contentType,
      locations: [{
        pageNumber: field.pageNumber,
        left: field.left,
        top: field.top,
        width: field.width,
        height: field.height
      }],
      name: field.name,
      required: field.required,
      readOnly: field.readOnly || false,
      recipientIndex: field.recipientIndex || 0,
      validationType: field.validationType,
      validationData: field.validationData
    }))
  };
}
```

---

## Data Models

### Field Interface

**File:** `field.model.ts`

```typescript
export interface Field {
  id: string;                          // Unique identifier
  name: string;                        // Field name
  inputType: FormFieldInputType;       // Input type (TEXT, CHECKBOX, etc.)
  contentType: FormFieldContentType;   // Content type (DATA, SIGNATURE, etc.)
  pageNumber: number;                  // Page where field is placed
  left: number;                        // Left coordinate (PDF points)
  top: number;                         // Top coordinate (PDF points)
  width: number;                       // Field width (PDF points)
  height: number;                      // Field height (PDF points)
  required?: boolean;                  // Is field required?
  readOnly?: boolean;                  // Is field read-only?
  recipientIndex?: number;             // Recipient assignment
  validationType?: string;             // Validation type (regex, etc.)
  validationData?: string;             // Validation pattern/data
}
```

### Enums

**FormFieldInputType:**
```typescript
export enum FormFieldInputType {
  TEXT_FIELD = 'TEXT_FIELD',
  MULTILINE = 'MULTILINE',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  DROP_DOWN = 'DROP_DOWN',
  SIGNATURE_BLOCK = 'SIGNATURE_BLOCK',
  DATE = 'DATE',
  HYPERLINK = 'HYPERLINK',
  IMAGE = 'IMAGE'
}
```

**FormFieldContentType:**
```typescript
export enum FormFieldContentType {
  DATA = 'DATA',
  SIGNATURE = 'SIGNATURE',
  SIGNER_NAME = 'SIGNER_NAME',
  SIGNER_EMAIL = 'SIGNER_EMAIL',
  SIGNER_INITIALS = 'SIGNER_INITIALS',
  SIGNATURE_DATE = 'SIGNATURE_DATE',
  IMAGE = 'IMAGE',
  QRCODE = 'QRCODE',
  HYPERLINK = 'HYPERLINK'
}
```

**AdobeDocumentType:**
```typescript
export enum AdobeDocumentType {
  LIBRARY = 'LIBRARY',      // Top-origin coordinate system
  TRANSIENT = 'TRANSIENT'   // Bottom-origin coordinate system
}
```

### FieldTypeCombination

```typescript
export interface FieldTypeCombination {
  label: string;               // Display label
  inputType: FormFieldInputType;
  contentType: FormFieldContentType;
  icon: string;                // Ant Design icon name
  color: string;               // Color code for UI
  group: string;               // Grouping category
}
```

### Adobe Sign ViewModel Format

```typescript
export interface IFormFieldGeneratorViewModel {
  documentType: 'TRANSIENT' | 'LIBRARY';
  formFields: Array<{
    inputType: FormFieldInputType;
    contentType: FormFieldContentType;
    locations: FormFieldLocation[];
    name: string;
    required: boolean;
    readOnly?: boolean;
    recipientIndex?: number;
    validationType?: string;
    validationData?: string;
  }>;
}
```

---

## Configuration

### Angular Configuration (angular.json)

**Project Settings:**
- Project type: `application`
- Source root: `src`
- Component style: `less`
- Output path: `dist/pdf-field-mapper`

**Assets:**
```json
"assets": [
  "src/favicon.ico",
  {
    "glob": "**/*",
    "input": "./node_modules/@ant-design/icons-angular/src/inline-svg/",
    "output": "/assets/"
  },
  {
    "glob": "**/*",
    "input": "./node_modules/pdfjs-dist/build/",
    "output": "/assets/pdfjs/"
  }
]
```

**Styles:**
```json
"styles": [
  "node_modules/ng-zorro-antd/ng-zorro-antd.min.css",
  "src/styles.less"
]
```

**Build Budgets:**
- Initial bundle: 500KB warning, 1MB error
- Component styles: 4KB warning, 8KB error

### TypeScript Configuration (tsconfig.json)

**Compiler Options:**
```json
{
  "target": "ES2022",
  "module": "ES2022",
  "strict": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "experimentalDecorators": true,
  "moduleResolution": "bundler",
  "esModuleInterop": true
}
```

---

## Dependencies

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @angular/common | ^19.2.0 | Common directives and pipes |
| @angular/compiler | ^19.2.0 | Template compiler |
| @angular/core | ^19.2.0 | Core framework |
| @angular/forms | ^19.2.0 | Form handling |
| @angular/platform-browser | ^19.2.0 | Browser platform |
| @angular/router | ^19.2.0 | Routing |
| ng-zorro-antd | ^19.3.1 | UI components |
| pdfjs-dist | ^5.3.31 | PDF rendering |
| rxjs | ~7.8.0 | Reactive programming |
| tslib | ^2.3.0 | TypeScript runtime |
| zone.js | ~0.15.0 | Zone management |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @angular-devkit/build-angular | ^19.2.3 | Build system |
| @angular/cli | ^19.2.3 | CLI tools |
| @angular/compiler-cli | ^19.2.0 | Compiler CLI |
| jasmine-core | ~5.6.0 | Testing framework |
| karma | ~6.4.0 | Test runner |
| typescript | ~5.7.2 | TypeScript compiler |

---

## Build & Development

### NPM Scripts

```json
{
  "ng": "ng",
  "start": "ng serve",
  "build": "ng build",
  "watch": "ng build --watch --configuration development",
  "test": "ng test"
}
```

### Development Workflow

**1. Start Development Server:**
```bash
npm start
```
- Runs on `http://localhost:4200`
- Auto-reloads on file changes
- Hot module replacement enabled

**2. Build for Production:**
```bash
npm run build
```
- Output: `dist/pdf-field-mapper/`
- Production optimizations enabled
- Bundle size budgets enforced

**3. Watch Mode:**
```bash
npm run watch
```
- Continuous builds during development
- Source maps enabled
- No optimization

**4. Run Tests:**
```bash
npm test
```
- Karma test runner
- Chrome launcher
- Coverage reporting

### VS Code Configuration

**Tasks (.vscode/tasks.json):**
- `npm: start` - Start dev server
- `npm: test` - Run tests
- Background task monitoring

**Launch (.vscode/launch.json):**
- Chrome debugging configuration
- Source map support

---

## Coordinate Systems

### Three Coordinate Systems

The application handles three different coordinate systems:

#### 1. Browser Pixel Coordinates
- **Origin:** Top-left (0, 0)
- **Units:** Pixels
- **Used for:** Mouse events, canvas drawing

#### 2. PDF.js Viewport Coordinates
- **Origin:** Top-left (0, 0)
- **Units:** Scaled pixels (affected by zoom level)
- **Used for:** PDF rendering, field display

#### 3. Adobe Sign PDF Points
- **Units:** Points (1/72 inch)
- **Two variants:**
  - **TRANSIENT:** Origin at bottom-left (Y increases upward)
  - **LIBRARY:** Origin at top-left (Y increases downward)

### Conversion Functions

**Pixels to Points:**
```typescript
pixelsToPoints(pixels: number): number {
  const DPI = 96;  // Standard browser DPI
  const POINTS_PER_INCH = 72;
  return (pixels / this.scale) * (POINTS_PER_INCH / DPI);
}
```

**Y-Coordinate Conversion:**
```typescript
convertYCoordinate(y: number, height: number, viewport: any, docType: string): number {
  if (docType === 'TRANSIENT') {
    // Convert from top-origin to bottom-origin
    return viewport.height - y - height;
  }
  // LIBRARY uses top-origin (no conversion needed)
  return y;
}
```

### Coordinate Flow

```
Mouse Event (pixels)
    ↓
Convert to viewport coordinates (scale)
    ↓
Convert to PDF points (72/96 ratio)
    ↓
Convert Y-axis based on document type
    ↓
Store in Field object
```

---

## Adobe Sign Integration

### Export Format

The application exports fields in Adobe Sign's ViewModel format:

```json
{
  "documentType": "TRANSIENT",
  "formFields": [
    {
      "inputType": "TEXT_FIELD",
      "contentType": "DATA",
      "locations": [
        {
          "pageNumber": 1,
          "left": 100.5,
          "top": 200.3,
          "width": 150.0,
          "height": 30.0
        }
      ],
      "name": "firstName",
      "required": true,
      "readOnly": false,
      "recipientIndex": 0,
      "validationType": "REGEX",
      "validationData": "^[A-Za-z]+$"
    }
  ]
}
```

### Field Properties Mapping

| Property | Type | Description |
|----------|------|-------------|
| `inputType` | Enum | Field input type (TEXT_FIELD, CHECKBOX, etc.) |
| `contentType` | Enum | Content type (DATA, SIGNATURE, etc.) |
| `locations` | Array | Field positions (supports multi-location) |
| `pageNumber` | Number | 1-based page index |
| `left/top` | Number | PDF points from origin |
| `width/height` | Number | Field dimensions in points |
| `name` | String | Unique field identifier |
| `required` | Boolean | Is field mandatory? |
| `readOnly` | Boolean | Is field non-editable? |
| `recipientIndex` | Number | 0-based recipient assignment |
| `validationType` | String | Validation rule type |
| `validationData` | String | Validation pattern/data |

### Recipient Support

Fields can be assigned to different recipients:
- **Index 0:** Primary signer (SIGNER role)
- **Index 1+:** Additional signers or approvers

---

## Future Enhancements

### Planned Features

1. **Drag-and-Drop Field Creation**
   - Drag field types from palette onto PDF
   - Pre-configured field sizes
   - Smart snapping to grid

2. **Field Templates**
   - Pre-defined field sets (name, address, signature block)
   - Template library
   - Custom template creation

3. **Advanced Validation**
   - Visual validation rule builder
   - Common patterns (email, phone, SSN)
   - Custom regex with testing

4. **Field Alignment Tools**
   - Align multiple fields (left, right, top, bottom)
   - Distribute evenly
   - Smart guides

5. **Undo/Redo**
   - Command pattern implementation
   - Action history stack
   - Keyboard shortcuts

6. **Keyboard Shortcuts**
   - Toggle drawing mode (Spacebar)
   - Delete selected field (Delete)
   - Zoom in/out (+/-)
   - Navigation (Arrow keys)

7. **Field Duplication**
   - Duplicate selected field
   - Copy/paste functionality
   - Batch operations

8. **Multi-Select**
   - Select multiple fields
   - Bulk editing
   - Group operations

9. **PDF Annotations**
   - Add comments
   - Highlight areas
   - Sticky notes

10. **Export Formats**
    - Multiple export formats (Adobe Sign, DocuSign, etc.)
    - PDF with form fields embedded
    - Excel/CSV field list

### Technical Improvements

1. **Performance Optimization**
   - Virtual scrolling for large field lists
   - Canvas rendering optimization
   - Lazy loading for multi-page PDFs

2. **Testing**
   - Unit tests for services
   - Component tests
   - E2E tests with Cypress

3. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

4. **Mobile Support**
   - Touch event handling
   - Responsive design improvements
   - Mobile-optimized UI

5. **Error Handling**
   - User-friendly error messages
   - Retry mechanisms
   - Error logging

---

## Development Guidelines

### Code Style

- Follow Angular style guide
- Use TypeScript strict mode
- Prefer reactive patterns (RxJS)
- Use standalone components
- Implement OnPush change detection where applicable

### Component Organization

- Keep components focused and single-responsibility
- Use services for shared state
- Prefer composition over inheritance
- Use smart/dumb component pattern

### Testing Strategy

- Unit tests for services (business logic)
- Component tests for UI behavior
- E2E tests for critical workflows
- Maintain >80% code coverage

### Git Workflow

- Feature branches from main
- Descriptive commit messages
- Pull requests for code review
- Semantic versioning

---

## Troubleshooting

### Common Issues

**PDF not loading:**
- Check PDF.js worker URL
- Verify file is valid PDF
- Check browser console for errors

**Fields not displaying:**
- Verify canvas overlay is rendering
- Check field coordinates are within page bounds
- Ensure scale is properly applied

**Export format incorrect:**
- Verify document type matches coordinate system
- Check field validation
- Ensure all required properties are set

**Performance issues:**
- Reduce scale for large PDFs
- Limit number of grid lines
- Optimize canvas clearing

---

## License

[Specify license here]

---

## Contributors

[List contributors here]

---

## Contact

For questions or support, please contact [contact information].

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Angular Version:** 19.2.0
