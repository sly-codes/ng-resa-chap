import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ResourceRoutingModule } from './resource-routing-module';
import { Resource } from './resource.component';

@NgModule({
  declarations: [Resource],
  imports: [CommonModule, ResourceRoutingModule],
})
export class ResourceModule {}
