import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";

import { far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgxPrintModule } from "ngx-print";
import { ToastrModule } from "ngx-toastr";
import { LoadingComponent } from "../loading/loading.component";
import { LoadingService } from "../loading/loading.service";
import { SharedModule } from "../shared/shared.module";
import { NotFoundComponent } from "./components/errors/not-found/not-found.component";
import { FaqComponent } from "./components/faq/faq.component";
import { HomeComponent } from "./components/home/home.component";
import { MentionsLegalesComponent } from "./components/mentions/mentions-legales/mentions-legales.component";
import { NewsComponent } from "./components/news/news.component";

library.add(fas, far);

@NgModule({
  declarations: [
    HomeComponent,
    LoadingComponent,
    MentionsLegalesComponent,
    NotFoundComponent,
    FaqComponent,
    NewsComponent
  ],
  exports: [
    HomeComponent,
    LoadingComponent,
    MentionsLegalesComponent,
    NotFoundComponent,
    FaqComponent
  ],
  imports: [
    CommonModule,
    CommonModule,
    BrowserModule,
    NgxPrintModule,
    SharedModule,
    BrowserAnimationsModule,
    FontAwesomeModule,
    RouterModule.forRoot([]),
    ToastrModule.forRoot({
      enableHtml: true,
      positionClass: "toast-top-full-width",
      preventDuplicates: true,
      progressAnimation: "increasing",
      progressBar: true,
      timeOut: 2000
    }),
    HttpClientModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [LoadingService]
})
export class GeneralModule {}
