export interface IVehicleReferenceRepository {
  existsBrand(id: string): Promise<boolean>;
  existsModel(id: string): Promise<boolean>;
  existsCategory(id: string): Promise<boolean>;
  existsColor(id: string): Promise<boolean>;
  existsFuelType(id: string): Promise<boolean>;
  existsTransmissionType(id: string): Promise<boolean>;
  existsTrim(id: string): Promise<boolean>;
}
