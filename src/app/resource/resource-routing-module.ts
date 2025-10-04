import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Resource } from './resource.component';

const routes: Routes = [{ path: '', component: Resource }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ResourceRoutingModule {}
