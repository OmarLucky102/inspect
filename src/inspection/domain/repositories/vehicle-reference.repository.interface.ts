export interface IVehicleReferenceRepository {
  existsBrand(id: string): Promise<boolean>;
  existsModel(id: string, brandId?: string): Promise<boolean>;
  existsCategory(id: string): Promise<boolean>;
  existsColor(id: string): Promise<boolean>;
  existsFuelType(id: string): Promise<boolean>;
  existsTransmissionType(id: string): Promise<boolean>;
  existsTrim(id: string): Promise<boolean>;

  findBrands(): Promise<
    Array<{ id: string; name: string; code: string | null }>
  >;
  findModelsByBrand(
    brandId: string,
  ): Promise<Array<{ id: string; brandId: string; name: string }>>;
  findCategories(): Promise<
    Array<{
      id: string;
      name: string;
      nameAr: string | null;
      code: string | null;
    }>
  >;
  findColors(): Promise<
    Array<{
      id: string;
      name: string;
      nameAr: string | null;
      hex: string | null;
    }>
  >;
  findFuelTypes(): Promise<
    Array<{ id: string; name: string; nameAr: string | null }>
  >;
  findTransmissionTypes(): Promise<
    Array<{ id: string; name: string; nameAr: string | null }>
  >;
  findTrims(): Promise<
    Array<{ id: string; code: string; name: string; nameAr: string | null }>
  >;
}
