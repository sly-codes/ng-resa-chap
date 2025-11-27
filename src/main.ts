import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideNgxMask } from 'ngx-mask';
import { routes } from './app/app-routing-module';
import { AppComponent } from './app/app.component';
import { jwtInterceptor } from './app/core/jwt-interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideNgxMask(),
  ],
}).catch((err) => console.error(err));
