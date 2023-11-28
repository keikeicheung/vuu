import { TableSchema } from "@finos/vuu-data";
import {
  type BasketsTableName,
  schemas as basketSchemas,
} from "./basket/basket-schemas";
import {
  type SimulTableName,
  schemas as simulSchemas,
} from "./simul/simul-schemas";
import {
  type SchedulerTableName,
  schemas as schedulerSchemas,
} from "./scheduler/scheduler-schemas";

export type VuuTableName = BasketsTableName | SimulTableName | SchedulerTableName;
export const schemas: Record<VuuTableName, TableSchema> = {
  ...basketSchemas,
  ...simulSchemas,
  schedulerSchemas
};

const allSchemas: Readonly<Record<VuuTableName, Readonly<TableSchema>>> = {
  ...basketSchemas,
  ...simulSchemas,
  ...schedulerSchemas
};

export const getAllSchemas = () => schemas;

export const getSchema = (tableName: VuuTableName) => {
  if (allSchemas[tableName]) {
    return allSchemas[tableName];
  }
  throw Error(`getSchema no schema for table ${tableName}`);
};
