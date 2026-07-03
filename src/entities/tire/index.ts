export type TireSeason = "Winter" | "Summer" | "AllSeason";
export type TireStatus = "Stored" | "Issued";

export interface Tire {
  id: string;
  brand: string;
  model: string | null;
  size: string;
  season: TireSeason;
  quantity: number;
  receiptDate: string;
  issueDate: string | null;
  location: string | null;
  photoUrl: string | null;
  notes: string | null;
  status: TireStatus;
  ownerId: string;
  owner: { id: string; name: string | null; phone: string | null };
}
