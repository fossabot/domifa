import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpParams
} from "@angular/common/http";
import { Injectable } from "@angular/core";

import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { LoadingService } from "../../loading/loading.service";
import { Decision } from "../interfaces/decision";
import { Entretien } from "../interfaces/entretien";
import { Rdv } from "../interfaces/rdv";
import { Usager } from "../interfaces/usager";

@Injectable({
  providedIn: "root"
})
export class UsagerService {
  public http: HttpClient;
  public loading: boolean;
  public endPointUsagers = environment.apiUrl + "usagers";

  constructor(http: HttpClient, private loadingService: LoadingService) {
    this.http = http;
    this.loading = true;
  }

  public create(usager: Usager): Observable<Usager> {
    const response =
      usager.id !== 0
        ? this.http.patch(`${this.endPointUsagers}/${usager.id}`, usager)
        : this.http.post(`${this.endPointUsagers}`, usager);

    return response.pipe(
      map(updatedUsager => {
        return new Usager(updatedUsager);
      })
    );
  }

  public createRdv(rdv: Rdv, usagerId: number): Observable<any> {
    return this.http.post(`${this.endPointUsagers}/rdv/${usagerId}`, rdv);
  }

  public editTransfert(transfert: any, usagerId: number): Observable<any> {
    return this.http.post(
      `${this.endPointUsagers}/transfert/${usagerId}`,
      transfert
    );
  }

  public deleteTransfert(usagerId: number): Observable<any> {
    return this.http.delete(`${this.endPointUsagers}/transfert/${usagerId}`);
  }

  public editProcuration(transfert: any, usagerId: number): Observable<any> {
    return this.http.post(
      `${this.endPointUsagers}/procuration/${usagerId}`,
      transfert
    );
  }

  public deleteProcuration(usagerId: number): Observable<Usager> {
    return this.http
      .delete(`${this.endPointUsagers}/procuration/${usagerId}`)
      .pipe(
        map(response => {
          return new Usager(response);
        })
      );
  }

  public nextStep(usagerId: number, etapeDemande: number): Observable<Usager> {
    return this.http
      .get(`${this.endPointUsagers}/next-step/${usagerId}/${etapeDemande}`)
      .pipe(
        map(response => {
          return new Usager(response);
        })
      );
  }

  public stopCourrier(usagerId: number): Observable<Usager> {
    return this.http
      .get(`${this.endPointUsagers}/stop-courrier/${usagerId}`)
      .pipe(
        map(response => {
          return new Usager(response);
        })
      );
  }

  public renouvellement(usagerId: number): Observable<Usager> {
    return this.http
      .get(`${this.endPointUsagers}/renouvellement/${usagerId}`)
      .pipe(
        map(response => {
          return new Usager(response);
        })
      );
  }

  public entretien(entretien: Entretien, usagerId: number): Observable<Usager> {
    return this.http
      .post(`${this.endPointUsagers}/entretien/${usagerId}`, entretien)
      .pipe(
        map(response => {
          return new Usager(response);
        })
      );
  }

  public setDecision(usagerId: number, decision: Decision, statut: string) {
    decision.statut = statut;
    return this.http
      .post(`${this.endPointUsagers}/decision/${usagerId}`, decision)
      .pipe(
        map(response => {
          return new Usager(response);
        })
      );
  }

  public findOne(usagerId: number): Observable<Usager> {
    return this.http.get(`${this.endPointUsagers}/${usagerId}`).pipe(
      map(response => {
        return new Usager(response);
      })
    );
  }

  public isDoublon(nom: string, prenom: string) {
    return this.http
      .get(`${this.endPointUsagers}/doublon/${nom}/${prenom}`)
      .pipe(
        map(response => {
          return Array.isArray(response)
            ? response.map(item => new Usager(item))
            : [new Usager(response)];
        })
      );
  }

  public delete(usagerId: number) {
    return this.http.delete(`${this.endPointUsagers}/${usagerId}`);
  }

  public getStats() {
    return this.http.get(`${this.endPointUsagers}/stats`);
  }

  /* Recherche */
  public search(search: any): Observable<Usager[]> {
    let data = new HttpParams();

    Object.keys(search).forEach(key => {
      const value = search[key];
      if (value !== null) {
        data = data.append(key, value);
      }
    });

    return this.http
      .get(`${this.endPointUsagers}/search/`, { params: data })
      .pipe(
        map(response => {
          return Array.isArray(response)
            ? response.map(item => new Usager(item))
            : [new Usager(response)];
        })
      );
  }

  /* Attestation */
  public attestation(usagerId: number) {
    this.loadingService.startLoading();

    this.http
      .get(`${this.endPointUsagers}/attestation/${usagerId}`, {
        responseType: "blob"
      })
      .subscribe(x => {
        const newBlob = new Blob([x], { type: "application/pdf" });

        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
          window.navigator.msSaveOrOpenBlob(newBlob);
          return;
        }
        const data = window.URL.createObjectURL(newBlob);
        const link = document.createElement("a");
        const randomNumber = Math.floor(Math.random() * 100) + 1;

        link.href = data;
        link.download = "attestation_" + usagerId + "_" + randomNumber + ".pdf";
        link.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window
          })
        );

        setTimeout(() => {
          window.URL.revokeObjectURL(data);
          link.remove();
          this.loadingService.stopLoading();
        }, 500);
      });
  }

  public import(data: any) {
    const uploadURL = environment.apiUrl + "import";

    return this.http
      .post<any>(uploadURL, data, {
        observe: "events",
        reportProgress: true
      })
      .pipe(
        map((event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress) {
            if (event.total) {
              const progress = Math.round((100 * event.loaded) / event.total);
              return {
                message: progress,
                status: "progress"
              };
            }
          } else if (event.type === HttpEventType.Response) {
            return { success: true, body: event.body };
          }
          return `Unhandled event: ${event.type}`;
        })
      );
  }
}
