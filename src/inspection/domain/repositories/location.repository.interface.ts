export interface ILocationRepository {
  existsGovernorate(id: string): Promise<boolean>;
  existsCity(id: string): Promise<boolean>;
  findCity(id: string): Promise<{ id: string; governorateId: string } | null>;
}
