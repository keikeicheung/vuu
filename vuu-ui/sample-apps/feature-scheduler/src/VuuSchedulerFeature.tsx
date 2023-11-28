import { TableSchema } from "@finos/vuu-data";
import { FlexboxLayout, Stack } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { SchedulerTableLive } from "./scheduler-table-live";

import "./VuuSchedulerFeature.css";
import { useScheduler } from "./useScheduler";
import {useSchedulerDatasources} from "./useSchedulerDatasources";

const classBase = "VuuSchedulerFeature";

export type BasketStatus = "design" | "on-market";
const basketStatus: [BasketStatus, BasketStatus] = ["design", "on-market"];

export interface SchedulerFeatureProps {
  basketSchema: TableSchema;
  basketTradingSchema: TableSchema;
  basketTradingConstituentJoinSchema: TableSchema;
  instrumentsSchema: TableSchema;

  schedulerSchema: TableSchema;
}

const VuuSchedulerFeature = (props: SchedulerFeatureProps) => {
  const {
    basketSchema,
    basketTradingSchema,
    basketTradingConstituentJoinSchema,
    instrumentsSchema,
    schedulerSchema,
  } = props;


  const {
    dataSourceScheduler
  } = useSchedulerDatasources({
    basketSchema,
    basketInstanceId: "",
    basketTradingSchema,
    basketTradingConstituentJoinSchema,
    instrumentsSchema,
    schedulerSchema
  })

  console.log({schedulerSchema})
  console.log({dataSourceScheduler})

  return (
    <>
      <SchedulerTableLive tableSchema={schedulerSchema} dataSource={dataSourceScheduler}/>
      <div>Scheduler Table</div>
    </>
  );
};

export default VuuSchedulerFeature;
