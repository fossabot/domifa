import { Component, OnInit } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import {
  NgbDateParserFormatter,
  NgbDatepickerI18n,
  NgbModal
} from "@ng-bootstrap/ng-bootstrap";
import { fromEvent, Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { Doc } from "src/app/modules/usagers/interfaces/document";
import { Usager } from "src/app/modules/usagers/interfaces/usager";
import { DocumentService } from "src/app/modules/usagers/services/document.service";
import { UsagerService } from "src/app/modules/usagers/services/usager.service";

import { User } from "src/app/modules/users/interfaces/user";
import { UsersService } from "src/app/modules/users/services/users.service";
import { AuthService } from "src/app/services/auth.service";
import { NgbDateCustomParserFormatter } from "src/app/services/date-formatter";
import { CustomDatepickerI18n } from "src/app/services/date-french";
import { fadeInOut } from "../../../../shared/animations";
import { ENTRETIEN_LABELS } from "../../../../shared/entretien.labels";
import { regexp } from "../../../../shared/validators";
import { StructureService } from "../../../structures/services/structure.service";
import { AyantDroit } from "../../interfaces/ayant-droit";

@Component({
  animations: [fadeInOut],
  providers: [
    UsagerService,
    NgbDateCustomParserFormatter,
    { provide: NgbDatepickerI18n, useClass: CustomDatepickerI18n },
    { provide: NgbDateParserFormatter, useClass: NgbDateCustomParserFormatter }
  ],
  selector: "app-usagers-form",
  styleUrls: ["./usagers-form.css"],
  templateUrl: "./usagers-form.html"
})
export class UsagersFormComponent implements OnInit {
  public selected: any;
  get f() {
    return this.usagerForm.controls;
  }
  get u(): any {
    return this.uploadForm.controls;
  }
  get r(): any {
    return this.rdvForm.controls;
  }
  get e(): any {
    return this.entretienForm.controls;
  }
  get ayantsDroits() {
    return this.usagerForm.get("ayantsDroits") as FormArray;
  }

  public title: string;
  public labels: any;
  public doublons: Usager[];

  /* Config datepickers */
  public dToday = new Date();
  public maxDateNaissance = {
    day: this.dToday.getDate(),
    month: this.dToday.getMonth() + 1,
    year: this.dToday.getFullYear()
  };
  public minDateNaissance = { day: 1, month: 1, year: 1900 };

  public minDateRdv = {
    day: this.dToday.getDate(),
    month: this.dToday.getMonth() + 1,
    year: this.dToday.getFullYear()
  };
  public maxDateRdv = {
    day: this.dToday.getDate(),
    month: this.dToday.getMonth() + 1,
    year: this.dToday.getFullYear() + 2
  };

  public etapes = [
    "État civil",
    "Prise de RDV",
    "Entretien",
    "Pièces justificatives",
    "Décision finale"
  ];

  /* RDV */
  public httpError: any;

  /* Upload */
  public uploadError: any;
  public fileName = "";
  public userId: number;
  public uploadResponse: any;
  public documents: Doc[];

  public usager: Usager;
  public uploadForm: FormGroup;
  public registerForm: FormGroup;
  public usagerForm: FormGroup;
  public rdvForm: FormGroup;
  public entretienForm: FormGroup;

  public submitted = false;
  public submittedFile = false;

  public structureId: number;
  public modal: any;
  public structure: any;
  public agents: User[] = [];

  public motifsRefus = {};
  public residence = {};
  public cause = {};
  public raison = {};
  public motifsRefusList = [];
  public residenceList = [];
  public causeList = [];
  public raisonList = [];

  public successMessage: string;
  public errorMessage: string;

  private successSubject = new Subject<string>();
  private errorSubject = new Subject<string>();

  constructor(
    private formBuilder: FormBuilder,
    private usagerService: UsagerService,
    private userService: UsersService,
    private documentService: DocumentService,
    private authService: AuthService,
    private structureService: StructureService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private router: Router,
    private nbgDate: NgbDateCustomParserFormatter
  ) {}

  public ngOnInit() {
    this.title = "Enregister une domiciliation";
    this.uploadResponse = { status: "", message: "", filePath: "" };
    this.userId = 1;
    this.structureId = 2;
    this.uploadError = {};
    this.labels = ENTRETIEN_LABELS;
    this.doublons = [];
    this.documents = [];

    this.successSubject.subscribe(message => {
      this.successMessage = message;
      this.errorMessage = null;
    });

    this.errorSubject.subscribe(message => {
      this.errorMessage = message;
      this.successMessage = null;
    });

    this.successSubject
      .pipe(debounceTime(10000))
      .subscribe(() => (this.successMessage = null));

    this.motifsRefus = {
      refus1: "Existence d'un hébergement stable",
      refus2: "Nombre maximal domiciliations atteint",
      refus3: "En dehors des critères du public domicilié",
      refus4: "Absence de lien avec la commune",
      refusAutre: "Autre (précisez le motif)"
    };

    this.residence = {
      sr1: "Sans abris / Squat",
      sr2: "Hôtel",
      sr3: "Hébergement social (sans service courrier)",
      sr4: "Hébergé chez un tiers",
      sr5: "Domicile mobile (ex: caravane)",
      // tslint:disable-next-line: object-literal-sort-keys
      residenceAutre: "Autre"
    };

    this.cause = {
      cause1: "Rupture familiale et/ou conjugale ",
      cause2: "Violence familiale et/ou conjugale",
      cause3: "Sortie d'une structure d'hébergement",
      cause4: "Expulsion",
      cause5: "Hébergé, mais ne peut justifier d'une adresse",
      cause6: "Errance",
      cause7: "Personnes itinérantes",
      causeAutre: "Autre"
    };

    this.raison = {
      raison1: "Accès aux prestations sociales",
      raison2: "Exercice des droits civils ou civiques",
      raisonAutre: "Autre"
    };

    this.motifsRefusList = Object.keys(this.motifsRefus);
    this.residenceList = Object.keys(this.residence);
    this.causeList = Object.keys(this.cause);
    this.raisonList = Object.keys(this.raison);

    if (this.route.snapshot.params.id) {
      const id = this.route.snapshot.params.id;

      this.usagerService.findOne(id).subscribe(
        (usager: Usager) => {
          this.usager = new Usager(usager);
          this.initForm();
          for (const ayantDroit of this.usager.ayantsDroits) {
            this.addAyantDroit(ayantDroit);
          }
        },
        error => {
          this.router.navigate(["404"]);
        }
      );
    } else {
      this.usager = new Usager({});
      this.initForm();
    }
  }

  public initForm() {
    this.usagerForm = this.formBuilder.group({
      ayantsDroits: this.formBuilder.array([]),
      ayantsDroitsExist: [this.usager.ayantsDroitsExist, []],
      dateNaissance: [this.usager.dateNaissance, []],
      dateNaissancePicker: [
        this.usager.dateNaissancePicker,
        [Validators.required]
      ],
      decision: [this.usager.decision, []],
      email: [this.usager.email, [Validators.email]],
      etapeDemande: [this.usager.etapeDemande, []],
      id: [this.usager.id, []],
      nom: [this.usager.nom, Validators.required],
      phone: [this.usager.phone, [Validators.pattern(regexp.phone)]],
      preference: this.formBuilder.group({
        aucun: [this.usager.preference.aucun, []],
        email: [this.usager.preference.email, []],
        phone: [this.usager.preference.phone, []]
      }),
      prenom: [this.usager.prenom, Validators.required],
      sexe: [this.usager.sexe, Validators.required],
      structure: [this.usager.structure, []],
      surnom: [this.usager.surnom, []],
      villeNaissance: [this.usager.villeNaissance, [Validators.required]]
    });

    this.uploadForm = this.formBuilder.group({
      imageInput: [this.fileName, Validators.required],
      label: ["", Validators.required]
    });

    this.rdvForm = this.formBuilder.group({
      dateRdv: [this.usager.rdv.dateRdv, [Validators.required]],
      heureRdv: [this.usager.rdv.heureRdv, [Validators.required]],
      isNow: [this.usager.rdv.isNow, []],
      jourRdv: [this.usager.rdv.jourRdv, [Validators.required]],
      userId: [this.usager.id, Validators.required]
    });

    this.entretienForm = this.formBuilder.group({
      accompagnement: [
        this.usager.entretien.accompagnement,
        [Validators.required]
      ],
      accompagnementDetail: [this.usager.entretien.accompagnementDetail, []],
      cause: [this.usager.entretien.cause, [Validators.required]],
      causeDetail: [this.usager.entretien.causeDetail, []],
      commentaires: [this.usager.entretien.commentaires, []],
      domiciliation: [this.usager.entretien.domiciliation, []],
      liencommune: [this.usager.entretien.liencommune, []],
      raison: [this.usager.entretien.raison, [Validators.required]],
      raisonDetail: [this.usager.entretien.raisonDetail, []],
      residence: [this.usager.entretien.residence, [Validators.required]],
      residenceDetail: [this.usager.entretien.residenceDetail, []],
      revenus: [this.usager.entretien.revenus, []]
    });

    this.userService.getUsers().subscribe((users: User[]) => {
      this.agents = users;
      this.rdvForm.controls.userId.setValue(users[0].id, {
        onlySelf: true
      });
    });
  }

  public setDecision(statut: string) {
    this.usagerService
      .setDecision(this.usager.id, this.usager.decision, statut)
      .subscribe(
        (usager: Usager) => {
          if (this.modal) {
            this.modal.close();
          }
          this.usager = new Usager(usager);
          this.changeSuccessMessage(this.labels[statut]);
        },
        error => {
          this.changeSuccessMessage(
            "Une erreur a eu lieu lors de la validation",
            true
          );
        }
      );
  }

  public open(content: string) {
    this.modal = this.modalService.open(content);
  }

  public isDoublon() {
    if (
      this.usagerForm.get("nom").value !== "" &&
      this.usagerForm.get("prenom").value !== "" &&
      this.usagerForm.get("nom").value !== null &&
      this.usagerForm.get("nom").value &&
      this.usagerForm.get("prenom").value !== null &&
      this.usagerForm.get("prenom").value
    ) {
      this.usagerService
        .isDoublon(
          this.usagerForm.get("nom").value,
          this.usagerForm.get("prenom").value
        )
        .subscribe((usagersDoublon: Usager[]) => {
          this.doublons = [];
          this.errorMessage = null;
          if (usagersDoublon.length !== 0) {
            this.changeSuccessMessage(
              "Un homonyme potentiel a été détecté !",
              true
            );

            usagersDoublon.forEach(doublon => {
              this.doublons.push(new Usager(doublon));
            });
          }
        });
    }
    return false;
  }

  public addAyantDroit(ayantDroit: AyantDroit = new AyantDroit()): void {
    (this.usagerForm.controls.ayantsDroits as FormArray).push(
      this.newAyantDroit(ayantDroit)
    );
  }

  public deleteAyantDroit(i: number): void {
    (this.usagerForm.controls.ayantsDroits as FormArray).removeAt(i);
  }

  public resetAyantDroit(i: number): void {
    while ((this.usagerForm.controls.ayantsDroits as FormArray).length !== 0) {
      (this.usagerForm.controls.ayantsDroits as FormArray).removeAt(0);
    }
  }

  public newAyantDroit(ayantDroit: AyantDroit) {
    return this.formBuilder.group({
      dateNaissance: [
        ayantDroit.dateNaissance,
        [Validators.pattern(regexp.date), Validators.required]
      ],
      lien: [ayantDroit.lien, Validators.required],
      nom: [ayantDroit.nom, Validators.required],
      prenom: [ayantDroit.prenom, Validators.required]
    });
  }

  public getAttestation() {
    return this.usagerService.attestation(this.usager.id);
  }

  public changeStep(i: number) {
    if (this.usager.decision.statut === "instruction" && this.usager.id !== 0) {
      this.usager.etapeDemande = i;
    }
  }

  public submitInfos() {
    this.submitted = true;
    if (this.usagerForm.invalid) {
      Object.keys(this.usagerForm.controls).forEach(key => {
        if (this.usagerForm.get(key).errors != null) {
          this.changeSuccessMessage(
            "Un des champs du formulaire n'est pas rempli ou contient une erreur",
            true
          );
        }
      });
    } else {
      const dateTmp = this.nbgDate.formatEn(
        this.usagerForm.get("dateNaissancePicker").value
      );

      const dateTmpN = new Date(dateTmp).toISOString();
      this.usagerForm.controls.dateNaissance.setValue(dateTmpN);
      this.usagerForm.controls.etapeDemande.setValue(this.usager.etapeDemande);

      this.usagerService.create(this.usagerForm.value).subscribe(
        (usager: Usager) => {
          this.changeSuccessMessage("Enregistrement réussi");
          this.router.navigate(["usager/" + usager.id + "/edit"]);
        },
        error => {
          /* Todo : afficher le contenu des erreurs cote serveur */
          if (error.statusCode && error.statusCode === 400) {
            this.changeSuccessMessage("Une erreur dans le form", true);
          }
        }
      );
    }
  }

  public submitEntretien() {
    this.usagerService
      .entretien(this.entretienForm.value, this.usager.id)
      .subscribe(
        (usager: Usager) => {
          this.usager = new Usager(usager);
          this.changeSuccessMessage("Enregistrement de l'entretien réussi");
        },
        error => {
          this.changeSuccessMessage("Une erreur est survenu", true);
        }
      );
  }

  public setValueRdv(value: string) {
    this.rdvForm.controls.isNow.setValue(value);
  }

  public submitRdv() {
    if (this.rdvForm.get("isNow").value === "oui") {
      this.rdvForm.controls.userId.setValue(2);
      this.rdvForm.controls.dateRdv.setValue(new Date().toISOString());
    } else {
      if (this.rdvForm.invalid) {
        Object.keys(this.rdvForm.controls).forEach(key => {
          if (this.rdvForm.get(key).errors != null) {
            this.changeSuccessMessage(
              "Veuillez vérifier la date de rendez-vous",
              true
            );
          }
        });
      } else {
        const heureRdv = this.rdvForm.get("heureRdv").value;
        const jourRdv = this.nbgDate.formatEn(
          this.rdvForm.get("jourRdv").value
        );
        const dateTmp = new Date(jourRdv);
        dateTmp.setHours(heureRdv.hour, heureRdv.minute, 0);
        this.rdvForm.controls.dateRdv.setValue(dateTmp.toISOString());
      }
    }

    this.usagerService.createRdv(this.rdvForm.value, this.usager.id).subscribe(
      (usager: Usager) => {
        this.usager = new Usager(usager);
        this.changeSuccessMessage("Rendez-vous enregistré");
      },
      error => {
        this.changeSuccessMessage("Une erreur est survenu", true);
      }
    );
  }

  public onFileChange(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      const validFileExtensions = [
        "image/jpg",
        "application/pdf",
        "image/jpeg",
        "image/bmp",
        "image/gif",
        "image/png"
      ];
      const type = event.target.files[0].type;
      const size = event.target.files[0].size;

      this.fileName = event.target.files[0].name;
      this.uploadError = {
        fileSize: size < 5000000,
        fileType: validFileExtensions.includes(type)
      };

      this.uploadForm.controls.imageInput.setValue(file); // <-- Set Value for Validation
      if (!this.uploadError.fileSize || !this.uploadError.fileType) {
        return false;
      }
    }
  }

  public submitFile() {
    this.submittedFile = true;
    this.uploadError = {
      fileSize: true,
      fileType: true
    };

    const formData = new FormData();

    formData.append("file", this.uploadForm.get("imageInput").value);
    formData.append("label", this.uploadForm.get("label").value);

    this.documentService.upload(formData, this.usager.id).subscribe(
      res => {
        this.uploadResponse = res;
        if (
          this.uploadResponse.success !== undefined &&
          this.uploadResponse.success
        ) {
          this.usager.docs = new Usager(this.uploadResponse.body).docs;
          this.uploadForm.reset();
          this.fileName = "";
        }
      },
      err => (this.httpError = err)
    );
  }

  public getDocument(i: number) {
    return this.documentService.getDocument(
      this.usager.id,
      i,
      this.usager.docs[i]
    );
  }

  public deleteDocument(i: number): void {
    this.documentService.deleteDocument(this.usager.id, i).subscribe(
      (usager: Usager) => {
        this.usager.docs = new Usager(usager).docs;
      },
      error => {
        this.changeSuccessMessage("Impossible de supprimer le document", true);
      }
    );
  }

  public goToTop() {
    window.scroll({
      behavior: "smooth",
      left: 0,
      top: 0
    });
  }

  public changeSuccessMessage(message: string, error?: boolean) {
    this.goToTop();
    error ? this.errorSubject.next(message) : this.successSubject.next(message);
  }
}
