import { Routes } from '@angular/router';



export const STORES_ROUTES: Routes = [

  {

    path: '',

    loadComponent: () =>

      import('./components/stores-shell/stores-shell.component').then(

        (m) => m.StoresShellComponent,

      ),

  },

];


