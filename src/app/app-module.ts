// src/app/app-module.ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { AppRoutingModule } from './app-routing-module';
import { AppComponent } from './app.component';
import { CoreModule } from './core-module';
import { jwtInterceptor } from './core/jwt-interceptor';
import { SharedModule } from './shared-module';

@NgModule({
  declarations: [
    // Laisser vide
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
    NgxMaskDirective,
    AppComponent, // 💡 Maintenant valide car AppComponent est standalone
  ],
  providers: [provideHttpClient(withInterceptors([jwtInterceptor])), provideNgxMask()],
  bootstrap: [AppComponent]
})
export class AppModule {}
