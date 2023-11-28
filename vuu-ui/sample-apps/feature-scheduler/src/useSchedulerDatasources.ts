import { useViewContext } from "@finos/vuu-layout";
import { DataSource, RemoteDataSource, TableSchema } from "@finos/vuu-data";
import { useCallback, useMemo, useState } from "react";
import { SchedulerFeatureProps } from "./VuuSchedulerFeature";
import { VuuFilter } from "@finos/vuu-protocol-types";

export type SchedulerDataSourceKey =
  | "data-source-basket"
  | "data-source-basket-trading-control"
  | "data-source-basket-trading-search"
  | "data-source-basket-trading-constituent-join"
  | "data-source-instruments"
  | "data-source-scheduler"
  ;

const NO_FILTER = { filter: "" };

export const useSchedulerDatasources = ({
  basketSchema,
  basketInstanceId,
  basketTradingSchema,
  basketTradingConstituentJoinSchema,
  instrumentsSchema,
  schedulerSchema
}: SchedulerFeatureProps & { basketInstanceId: string }) => {

  console.log({schedulerSchema})
  const { id, loadSession, saveSession, title } = useViewContext();

  const [
    dataSourceScheduler,
  ] = useMemo(() => {
    const schedulerFilter: VuuFilter = NO_FILTER;
    const dataSourceConfig: [
      SchedulerDataSourceKey,
      TableSchema,
      number,
      VuuFilter?
    ][] = [
      [
        "data-source-scheduler",
        schedulerSchema,
        100,
        schedulerFilter,
      ]
    ];

    const dataSources: DataSource[] = [];
    for (const [key, schema, bufferSize, filter] of dataSourceConfig) {
      let dataSource = loadSession?.(key) as RemoteDataSource;
      if (dataSource === undefined) {
        dataSource = new RemoteDataSource({
          bufferSize,
          filter,
          viewport: `${id}-${key}`,
          table: schema.table,
          columns: schema.columns.map((col) => col.name),
          title,
        });
        saveSession?.(dataSource, key);
      }
      dataSources.push(dataSource);
    }
    return dataSources;
  }, [
    basketSchema,
    basketTradingSchema,
    basketInstanceId,
    basketTradingConstituentJoinSchema,
    instrumentsSchema,
    schedulerSchema,
    loadSession,
    id,
    title,
    saveSession,
  ]);

console.log({dataSourceScheduler})

  return {
    dataSourceScheduler,
  };
};
