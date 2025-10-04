import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http'; // NOUVEAUX IMPORTS
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing-module';
import { AppComponent } from './app.component';
import { CoreModule } from './core-module';
import { jwtInterceptor } from './core/jwt-interceptor'; // NOUVEL IMPORT
import { SharedModule } from './shared-module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule, 
    CoreModule,
    SharedModule,
  ],
  providers: [
    // Configuration de l'intercepteur avec le HttpClient
    provideHttpClient(withInterceptors([jwtInterceptor])),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
