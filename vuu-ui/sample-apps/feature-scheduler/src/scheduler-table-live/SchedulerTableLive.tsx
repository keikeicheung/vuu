import { TableSchema } from "@finos/vuu-data";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { TableNext, TableProps } from "@finos/vuu-table";
import { useMemo } from "react";
import { StatusCell } from "../cell-renderers";
import columns from "./SchedulerLiveColumns";

console.log(`component loaded StatusCell ${typeof StatusCell}`);
import "./SchedulerTableLive.css";

const classBase = "vuuSchedulerTableLive";

export interface SchedulerTableLiveProps extends Omit<TableProps, "config"> {
  tableSchema: TableSchema;
}

export const SchedulerTableLive = ({
  tableSchema,
  ...props
}: SchedulerTableLiveProps) => {
  const tableConfig = useMemo<TableConfig>(
    () => ({
      columns,
      rowSeparators: true,
    }),
    []
  );

  console.log({ columns });

  return (
    <TableNext
      {...props}
      renderBufferSize={20}
      className={classBase}
      config={tableConfig}
      rowHeight={21}
    />
  );
};
