export type LoadStatus =
  | "Pending"
  | "In Transit"
  | "Delivered"
  | "Cancelled";

export type ServiceType =
  | "Freight"
  | "Last Mile";

export type Mode =
  | "Road"
  | "Air"
  | "Rail"
  | "Sea";

export type Role =
  | "admin"
  | "shipper";

export type Load = {
  id: string;
  loadNumber: string;
  shipperId: string;
  status: LoadStatus;
  serviceType: ServiceType;
  mode: Mode;
  origin: string;
  destination: string;
  createdBy: string;
  createdAt: string;
  isPrivate: boolean;
};

export type Shipper = {
  id: string;
  name: string;
};