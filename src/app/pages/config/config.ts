import { Component } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  imports: [Navbar],
  selector: 'app-config',
  styleUrl: './config.css',
  templateUrl: './config.html',
})
export class Config {}
