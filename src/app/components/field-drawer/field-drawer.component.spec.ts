import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldDrawerComponent } from './field-drawer.component';

describe('FieldDrawerComponent', () => {
  let component: FieldDrawerComponent;
  let fixture: ComponentFixture<FieldDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
