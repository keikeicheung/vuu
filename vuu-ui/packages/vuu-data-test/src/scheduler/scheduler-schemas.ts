import { TableSchema } from "@finos/vuu-data";

export type SchedulerTableName =
  | "scheduler";

export const schemas: Readonly<
  Record<SchedulerTableName, Readonly<TableSchema>>
> = {
  scheduler: {
    columns: [
      { name: "schedulerId", serverDataType: "string" },
    ],
    key: "schedulerId",
    table: { module: "SCHEDULER", table: "scheduler" },
  },
};
