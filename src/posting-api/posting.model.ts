export interface Freight {
    equipmentType: string;
    fullPartial: string;
    lengthFeet?: number;
    weightPounds: string;
  }

export interface Posting {
    companyId: string;
    freight: Freight;
}