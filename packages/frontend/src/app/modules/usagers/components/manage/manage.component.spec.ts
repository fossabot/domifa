import { APP_BASE_HREF, Location } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { async, fakeAsync, inject, TestBed, tick } from "@angular/core/testing";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { AppComponent } from "src/app/app.component";
import { AppModule } from "src/app/app.module";
import { NotFoundComponent } from "src/app/modules/general/components/errors/not-found/not-found.component";
import { HomeComponent } from "src/app/modules/general/components/home/home.component";
import { MentionsLegalesComponent } from "src/app/modules/general/components/mentions/mentions-legales/mentions-legales.component";
import { LoadingComponent } from "src/app/modules/loading/loading.component";
import { StructuresFormComponent } from "src/app/modules/structures/components/structures-form/structures-form.component";
import { StructuresSearchComponent } from "src/app/modules/structures/components/structures-search/structures-search.component";

import { RegisterUserComponent } from "src/app/modules/users/components/register-user/register-user.component";
import { UserProfilComponent } from "src/app/modules/users/components/user-profil/user-profil.component";
import { AppRoutingModule, routes } from "../../../../app-routing.module";
import { StructuresConfirmComponent } from "../../../structures/components/structures-confirm/structures-confirm.component";
import { LoginComponent } from "../../../users/components/login/login.component";
import { ResetPasswordComponent } from "../../../users/components/reset-password/reset-password.component";
import { UsagersModule } from "../../usagers.module";
import { ManageUsagersComponent } from "./manage.component";

describe("ManageUsagersComponent", () => {
  let app: any;
  let fixture: any;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        HomeComponent,
        LoginComponent,
        StructuresFormComponent,
        LoadingComponent,
        RegisterUserComponent,
        MentionsLegalesComponent,
        NotFoundComponent,
        StructuresSearchComponent,
        StructuresConfirmComponent,
        ResetPasswordComponent,
        UserProfilComponent
      ],
      imports: [
        UsagersModule,
        NgbModule,
        RouterTestingModule.withRoutes(routes),
        ReactiveFormsModule,
        FormsModule,
        HttpClientModule
      ],
      providers: [{ provide: APP_BASE_HREF, useValue: "/" }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ManageUsagersComponent);
    app = fixture.debugElement.componentInstance;
    app.ngOnInit();
  }));

  it("0. create component", () => {
    expect(app).toBeTruthy();
  });

  it("1. NgOnInit", async(() => {
    expect(app.title).toEqual("Gérer vos domiciliés");
    expect(app.searching).toEqual(false);

    expect(app.filters).toEqual({
      echeance: null,
      id: null,
      interactionStatut: null,
      interactionType: null,
      name: null,
      sort: "az",
      statut: "VALIDE"
    });
  }));

  it("2. Update filter", async(() => {
    app.updateFilters("sort", "za");
    app.updateFilters("statut", "REFUS");
    expect(app.filters).toEqual({
      echeance: null,
      id: null,
      interactionStatut: null,
      interactionType: null,
      name: null,
      sort: "za",
      statut: "REFUS"
    });
  }));

  it("3. Reset Filters", async(() => {
    fixture = TestBed.createComponent(ManageUsagersComponent);
    app = fixture.debugElement.componentInstance;
    app.ngOnInit();
    app.resetFilters();
    expect(app.filters).toEqual({
      echeance: null,
      id: null,
      interactionStatut: null,
      interactionType: null,
      name: null,
      sort: "az",
      statut: "VALIDE"
    });
  }));

  it("X. Small functions : get letter, reset bar, go to profil", () => {
    fixture = TestBed.createComponent(ManageUsagersComponent);
    app = fixture.debugElement.componentInstance;
    app.ngOnInit();
    expect(app.getLetter("Yassine")).toEqual("Y");
    app.resetSearchBar();
    expect(app.filters.name).toEqual("");
  });

  it("4. Routing functions", fakeAsync(
    inject([Router, Location], (router: Router, location: Location) => {
      app = fixture.debugElement.componentInstance;
      app.goToProfil(2, "INSTRUCTION");
      tick();
      expect(location.path()).toEqual("/usager/2/edit");

      app.goToProfil(1, "VALIDE");
      tick();
      expect(location.path()).toEqual("/connexion?returnUrl=%2Fusager%2F1");
    })
  ));
});
