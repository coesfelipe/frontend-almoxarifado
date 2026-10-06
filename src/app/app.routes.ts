import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './services/auth-guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Stock } from './pages/stock/stock';
import { CreateProduct } from './pages/create-product/create-product';
import { EditProduct } from './pages/edit-product/edit-product';
import { XmlUpload } from './pages/xml-uploud/xml-uploud';
import { StockMovement } from './pages/stock-movement/stock-movement';
import { Report } from './pages/report/report';
import { Config } from './pages/config/config';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard]},
  { path: 'home', component: Dashboard, canActivate: [authGuard] },
  { path: 'stock', component: Stock, canActivate: [authGuard] },
  { path: 'stock/create', component: CreateProduct, canActivate: [authGuard]},
  { path: 'stock/create/xml', component: XmlUpload, canActivate: [authGuard]},
  { path: 'stock/edit/:id', component: EditProduct, canActivate: [authGuard] },
  { path: 'stock-movement', component: StockMovement, canActivate: [authGuard] },
  { path: 'report', component: Report, canActivate: [authGuard] },
  { path: 'config', component: Config, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];