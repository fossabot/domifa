export type Filters =
  | "statut"
  | "name"
  | "echeance"
  | "interactionType"
  | "interactionStatut"
  | "sort";

export class Search {
  public statut: string;
  public name: string;
  public echeance: string;
  public interactionType: string;
  public interactionStatut: boolean;
  public sort: string;

  constructor(search?: any) {
    this.interactionType = (search && search.interactionType) || null;
    this.interactionStatut = (search && search.interactionStatut) || null;
    this.echeance = (search && search.echeance) || null;
    this.name = (search && search.name) || null;
    this.sort = (search && search.sort) || "az";
    this.statut = (search && search.statut) || "VALIDE";
  }
}
