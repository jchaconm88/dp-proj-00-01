import {
  TRIP_CHARGE_TYPE,
  TRIP_CHARGE_SOURCE,
  TRIP_CHARGE_STATUS,
} from "@/constants/statusOptions";

export type TripChargeType = keyof typeof TRIP_CHARGE_TYPE;
export type TripChargeSource = keyof typeof TRIP_CHARGE_SOURCE;
export type TripChargeStatus = keyof typeof TRIP_CHARGE_STATUS;

export interface TripChargeRecord {
  id: string;
  code: string;
  tripId: string;
  type: TripChargeType;
  source: TripChargeSource;
  amount: number;
  currency: string;
  status: TripChargeStatus;
  settlementId: string | null;
}

export interface TripChargeAddInput {
  code: string;
  tripId: string;
  type: TripChargeType;
  source: TripChargeSource;
  amount: number;
  currency: string;
  status: TripChargeStatus;
  settlementId?: string | null;
}

export type TripChargeEditInput = Partial<Omit<TripChargeRecord, "id">>;
