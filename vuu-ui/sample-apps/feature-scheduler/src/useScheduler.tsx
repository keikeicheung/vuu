import { useVuuMenuActions } from "@finos/vuu-data-react";
import { DataSourceRow } from "@finos/vuu-data-types";
import { useViewContext } from "@finos/vuu-layout";
import { buildColumnMap, ColumnMap } from "@finos/vuu-utils";
import { ContextMenuConfiguration } from "@finos/vuu-popups";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SchedulerTableLive } from "./scheduler-table-live";
import { useSchedulerDatasources } from "./useSchedulerDatasources";
import { SchedulerFeatureProps } from "./VuuSchedulerFeature";
import { VuuDataRow, VuuDataRowDto } from "packages/vuu-protocol-types";

export class Scheduler {
  schedulerId: string;
  schedulerName: string;
  dataSourceRow: DataSourceRow;

  constructor(data: DataSourceRow, columnMap: ColumnMap) {
    this.dataSourceRow = data;
    this.schedulerId = data[columnMap.basketId] as string;
    this.schedulerName = data[columnMap.basketName] as string;
  }
}

export type BasketTradingHookProps = Pick<
  SchedulerFeatureProps,
  | "basketSchema"
  | "basketTradingSchema"
  | "basketTradingConstituentJoinSchema"
  | "instrumentsSchema"
  | "schedulerSchema"
>;

const toDataDto = (dataSourceRow: VuuDataRow, columnMap: ColumnMap) => {
  Object.entries(columnMap).reduce<VuuDataRowDto>((dto, [colName, index]) => {
    dto[colName] = dataSourceRow[index];
    return dto;
  }, {});
};

type BasketState = {
  basketInstanceId?: string;
  dialog?: JSX.Element;
};

const NO_STATE = { basketId: undefined } as any;

export const useScheduler = ({
  basketSchema,
  basketTradingSchema,
  basketTradingConstituentJoinSchema,
  instrumentsSchema,
}: BasketTradingHookProps) => {
  const { load, save } = useViewContext();

  const basketInstanceId = useMemo<string>(() => {
    const { basketInstanceId } = load?.("basket-state") ?? NO_STATE;
    return basketInstanceId;
  }, [load]);

  const {
    activeTabIndex,
    dataSourceBasket,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituentJoin,
    dataSourceInstruments,
    onSendToMarket,
    onTakeOffMarket,
  } = useSchedulerDatasources({
    basketInstanceId,
    basketSchema,
    basketTradingSchema,
    basketTradingConstituentJoinSchema,
    instrumentsSchema,

  });

  const [scheduler, setScheduler] = useState<Scheduler | undefined>();

  const [basketCount, setBasketCount] = useState(-1);

  const [basketState, setBasketState] = useState<BasketState>({
    basketInstanceId,
    dialog: undefined,
  });

  const columnMapBasketTrading = useMemo(
    () => buildColumnMap(dataSourceBasketTradingControl.columns),
    [dataSourceBasketTradingControl.columns]
  );
  const columnMapInstrument = useMemo(
    () => buildColumnMap(dataSourceInstruments.columns),
    [dataSourceInstruments.columns]
  );

  useMemo(() => {
    dataSourceBasketTradingControl.subscribe(
      {
        range: { from: 0, to: 1 },
      },
      (message) => {
        if (message.type === "viewport-update") {
          if (message.size) {
            setBasketCount(message.size);
          }
          if (message.rows && message.rows.length > 0) {
            const basket = new Scheduler(message.rows[0], columnMapBasketTrading);
            console.log({ basket, row: message.rows[0] });

            setScheduler(new Scheduler(message.rows[0], columnMapBasketTrading));
          }
        }
      }
    );

    // TEMP server is notsending TABLE_ROWS if size is zero
    setTimeout(() => {
      setBasketCount((count) => (count === -1 ? 0 : count));
    }, 800);
  }, [columnMapBasketTrading, dataSourceBasketTradingControl]);

  useEffect(() => {
    return () => {
      dataSourceBasketTradingControl.unsubscribe?.();
    };
  }, [dataSourceBasketTradingControl]);

  const handleCloseNewBasketPanel = useCallback(() => {
    setBasketState((state) => ({
      ...state,
      dialog: undefined,
    }));
  }, []);

  const handleSaveNewBasket = useCallback((basketName, basketId) => {
    setBasketState((state) => ({
      ...state,
      dialog: undefined,
    }));
  }, []);

  const handleSelectBasket = useCallback(
    (basketInstanceId: string) => {
      save?.({ basketInstanceId }, "basket-state");
      const filter = { filter: `instanceId = "${basketInstanceId}"` };
      dataSourceBasketTradingConstituentJoin.filter = filter;
      dataSourceBasketTradingControl.filter = filter;
    },
    [
      dataSourceBasketTradingConstituentJoin,
      dataSourceBasketTradingControl,
      save,
    ]
  );

  const handleAddBasket = useCallback(() => {
    setBasketState((state) => ({
      ...state,
      dialog: (
        <SchedulerTableLive
          basketDataSource={dataSourceBasket}
          basketSchema={basketSchema}
          onClose={handleCloseNewBasketPanel}
          onSaveBasket={handleSaveNewBasket}
        />
      ),
    }));
  }, [
    basketSchema,
    dataSourceBasket,
    handleCloseNewBasketPanel,
    handleSaveNewBasket,
  ]);

  const basketSelectorProps = useMemo<Omit<BasketSelectorProps, "basket">>(
    () => ({
      basketInstanceId,
      dataSourceBasketTradingSearch,
      onClickAddBasket: handleAddBasket,
      onSelectBasket: handleSelectBasket,
    }),
    [
      basketInstanceId,
      dataSourceBasketTradingSearch,
      handleAddBasket,
      handleSelectBasket,
    ]
  );

  const handleCommitBasketChange = useCallback<BasketChangeHandler>(
    (columnName, value) => {
      if (scheduler) {
        console.log(`handleCommitBasketChange ${columnName} => ${value}`);
        const { dataSourceRow } = scheduler;
        return dataSourceBasketTradingControl.applyEdit(
          dataSourceRow,
          columnName,
          value
        );
      }
      return Promise.resolve(true);
    },
    [scheduler, dataSourceBasketTradingControl]
  );

  // const [menuBuilder, menuActionHandler] = useBasketContextMenus({
  //   dataSourceInstruments,
  // });

  const handleRpcResponse = useCallback((response) => {
    console.log("handleRpcResponse", {
      response,
    });
  }, []);

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource: dataSourceBasketTradingConstituentJoin,
    menuActionConfig: undefined,
    onRpcResponse: handleRpcResponse,
  });

  // const contextMenuProps: ContextMenuConfiguration = {
  //   menuActionHandler,
  //   menuBuilder,
  // };

  const basketDesignContextMenuConfig: ContextMenuConfiguration = {
    menuActionHandler: handleMenuAction,
    menuBuilder: buildViewserverMenuOptions,
  };

  const handleDropInstrument = useCallback(
    (dragDropState) => {
      console.log(`useBasketTrading handleDropInstrument`, {
        instrument: dragDropState.payload,
      });
      const key = "steve-00001.AAA.L";
      const data = {
        algo: -1,
        algoParams: "",
        basketId: ".FTSE100",
        description: "Test",
        instanceId: "steve-00001",
        instanceIdRic: "steve-00001.AAA.L",
        limitPrice: 0,
        notionalLocal: 0,
        notionalUsd: 0,
        pctFilled: 0,
        priceSpread: 0,
        priceStrategyId: 2,
        quantity: 0,
        ric: "AAL.L",
        side: "BUY",
        venue: "",
        weighting: 1,
      };
      dataSourceBasketTradingControl.insertRow?.(key, data).then((response) => {
        console.log({ response });
      });
    },
    [dataSourceBasketTradingControl]
  );

  return {
    ...basketState,
    basket: scheduler,
    basketCount,
    basketDesignContextMenuConfig,
    basketSelectorProps,
    // contextMenuProps,
    dataSourceBasketTradingConstituentJoin,
    onClickAddBasket: handleAddBasket,
    onCommitBasketChange: handleCommitBasketChange,
    onDropInstrument: handleDropInstrument,
    onSendToMarket,
    onTakeOffMarket,
  };
};