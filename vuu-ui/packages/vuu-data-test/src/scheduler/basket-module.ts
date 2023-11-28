import { VuuModule } from "../vuu-modules";
import { ColumnMap, metadataKeys } from "@finos/vuu-utils";
import { SchedulerTableName } from "./scheduler-schemas";
import { TickingArrayDataSource } from "../TickingArrayDataSource";
import { schemas } from "./scheduler-schemas";
import { VuuMenu, VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { Table } from "../Table";

// This is a 'local' columnMap
const buildDataColumnMap = (tableName: SchedulerTableName) =>
  Object.values(schemas[tableName].columns).reduce<ColumnMap>(
    (map, col, index) => {
      map[col.name] = index;
      return map;
    },
    {}
  );

const tableMaps: Record<SchedulerTableName, ColumnMap> = {
  scheduler: buildDataColumnMap("scheduler"),
};

//---------------

const { KEY } = metadataKeys;



const scheduler = new Table(
  schemas.scheduler,
  [],
  tableMaps.scheduler
);


export const tables: Record<SchedulerTableName, Table> = {
  scheduler
};

const menus: Record<SchedulerTableName, VuuMenu | undefined> = {
  scheduler: undefined,
};

type RpcService = {
  rpcName: string;
  service: (rpcRequest: any) => Promise<unknown>;
};

const services: Record<SchedulerTableName, RpcService[] | undefined> = {
  scheduler: undefined,
};

const getColumnDescriptors = (tableName: SchedulerTableName) => {
  const schema = schemas[tableName];
  return schema.columns;
};

const createDataSource = (tableName: SchedulerTableName) => {
  const columnDescriptors = getColumnDescriptors(tableName);
  const { key } = schemas[tableName];
  return new TickingArrayDataSource({
    columnDescriptors,
    dataMap: tableMaps[tableName],
    keyColumn: key,
    menu: menus[tableName],
    rpcServices: services[tableName],
    table: tables[tableName],
    // updateGenerator: createUpdateGenerator?.(),
  });
};

const schedulerModule: VuuModule<SchedulerTableName> = {
  createDataSource,
};

export default schedulerModule;
