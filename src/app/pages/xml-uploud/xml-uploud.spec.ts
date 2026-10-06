import { ComponentFixture, TestBed } from '@angular/core/testing';
import { XmlUploud } from './xml-uploud';

describe('XmlUploud', () => {
  let component: XmlUploud;
  let fixture: ComponentFixture<XmlUploud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XmlUploud],
    }).compileComponents();

    fixture = TestBed.createComponent(XmlUploud);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
