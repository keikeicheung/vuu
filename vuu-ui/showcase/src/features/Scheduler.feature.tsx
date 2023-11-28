

import { useViewContext } from "@finos/vuu-layout";
import { TableSchema } from "@finos/vuu-data";
import React, { useMemo } from "react";
import { vuuModule, VuuModuleName } from "@finos/vuu-data-test";
import VuuSchedulerFeature, {
  SchedulerDataSourceKey,
  SchedulerFeatureProps
} from "feature-scheduler";

export const SchedulerFeature = ({
  basketSchema,
  basketTradingSchema,
  basketTradingConstituentJoinSchema,
  instrumentsSchema,
  schedulerSchema
}: SchedulerFeatureProps) => {
  const { saveSession } = useViewContext();

  useMemo(() => {
    const dataSourceConfig: [
      SchedulerDataSourceKey,
      TableSchema,
      VuuModuleName
    ][] = [
      ["data-source-basket", basketSchema, "BASKET"],
      ["data-source-basket-trading-control", basketTradingSchema, "BASKET"],
      ["data-source-basket-trading-search", basketTradingSchema, "BASKET"],
      [
        "data-source-basket-trading-constituent-join",
        basketTradingConstituentJoinSchema,
        "BASKET",
      ],
      ["data-source-instruments", instrumentsSchema, "SIMUL"],
      [
        "data-source-scheduler",
        schedulerSchema,
        "SCHEDULER",
      ],
    ];
    for (const [key, schema, module] of dataSourceConfig) {
      const dataSource = vuuModule(module).createDataSource(schema.table.table);
      saveSession?.(dataSource, key);
    }
  }, [
    basketSchema,
    basketTradingConstituentJoinSchema,
    basketTradingSchema,
    instrumentsSchema,
    schedulerSchema,
    saveSession,
  ]);

  return (
    <VuuSchedulerFeature
      basketSchema={basketSchema}
      basketTradingSchema={basketTradingSchema}
      basketTradingConstituentJoinSchema={basketTradingConstituentJoinSchema}
      instrumentsSchema={instrumentsSchema}
      schedulerSchema={schedulerSchema}
    />
  );
};

export default SchedulerFeature;
