export interface VehicleProps {
  id: string;
  vin: string;
  plateNumber: string | null;
  manufactureYear: number;
  mileage: number | null;
  engineNumber: string;
  engineCc: number | null;
  power: number | null;
  insuranceValue: number | null;
  registrationDate: Date | null;
  status: string;
  brandId: string;
  modelId: string;
  categoryId: string;
  fuelTypeId: string | null;
  transmissionTypeId: string | null;
  colorId: string | null;
  trimId: string | null;
  sunroofSpecification?: string | null;
  sideMirrors?: string | null;
  carInterior?: string | null;
  calendarNumber?: string | null;
  specialInstructions?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Vehicle {
  private props: VehicleProps;

  constructor(props: VehicleProps) {
    this.props = {
      ...props,
      sunroofSpecification: props.sunroofSpecification ?? null,
      sideMirrors: props.sideMirrors ?? null,
      carInterior: props.carInterior ?? null,
      calendarNumber: props.calendarNumber ?? null,
      specialInstructions: props.specialInstructions ?? null,
    };
  }

  get id(): string {
    return this.props.id;
  }
  get vin(): string {
    return this.props.vin;
  }
  get plateNumber(): string | null {
    return this.props.plateNumber;
  }
  get manufactureYear(): number {
    return this.props.manufactureYear;
  }
  get mileage(): number | null {
    return this.props.mileage;
  }
  get engineNumber(): string {
    return this.props.engineNumber;
  }
  get engineCc(): number | null {
    return this.props.engineCc;
  }
  get power(): number | null {
    return this.props.power;
  }
  get insuranceValue(): number | null {
    return this.props.insuranceValue;
  }
  get registrationDate(): Date | null {
    return this.props.registrationDate;
  }
  get status(): string {
    return this.props.status;
  }
  get brandId(): string {
    return this.props.brandId;
  }
  get modelId(): string {
    return this.props.modelId;
  }
  get categoryId(): string {
    return this.props.categoryId;
  }
  get fuelTypeId(): string | null {
    return this.props.fuelTypeId;
  }
  get transmissionTypeId(): string | null {
    return this.props.transmissionTypeId;
  }
  get colorId(): string | null {
    return this.props.colorId;
  }
  get trimId(): string | null {
    return this.props.trimId;
  }
  get sunroofSpecification(): string | null {
    return this.props.sunroofSpecification ?? null;
  }
  get sideMirrors(): string | null {
    return this.props.sideMirrors ?? null;
  }
  get carInterior(): string | null {
    return this.props.carInterior ?? null;
  }
  get calendarNumber(): string | null {
    return this.props.calendarNumber ?? null;
  }
  get specialInstructions(): string | null {
    return this.props.specialInstructions ?? null;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  public updateDetails(fields: Partial<VehicleProps>): void {
    this.props = {
      ...this.props,
      ...fields,
      updatedAt: new Date(),
    };
  }
}
