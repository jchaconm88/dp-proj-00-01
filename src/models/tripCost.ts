import {
  TRIP_COST_ENTITY,
  TRIP_COST_TYPE,
  TRIP_COST_SOURCE,
  TRIP_COST_STATUS,
} from "@/constants/statusOptions";

export type TripCostEntity = keyof typeof TRIP_COST_ENTITY;
export type TripCostType = keyof typeof TRIP_COST_TYPE;
export type TripCostSource = keyof typeof TRIP_COST_SOURCE;
export type TripCostStatus = keyof typeof TRIP_COST_STATUS;

export interface TripCostRecord {
  id: string;
  code: string;
  tripId: string;
  entity: TripCostEntity;
  entityId: string;
  type: TripCostType;
  source: TripCostSource;
  amount: number;
  currency: string;
  status: TripCostStatus;
  settlementId: string | null;
}

export interface TripCostAddInput {
  code: string;
  tripId: string;
  entity: TripCostEntity;
  entityId: string;
  type: TripCostType;
  source: TripCostSource;
  amount: number;
  currency: string;
  status: TripCostStatus;
  settlementId?: string | null;
}

export type TripCostEditInput = Partial<Omit<TripCostRecord, "id">>;
