package org.finos.vuu.core.module.scheduler

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api._
import org.finos.vuu.core.module.scheduler.provider._
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns

object SchedulerModule extends DefaultModule {

  final val NAME = "SCHEDULER"

  final val SchedulerTable = "scheduler"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = SchedulerTable,
          keyField = SchedulerColumnNames.SchedulerId,
          columns = Columns.fromNames(SchedulerColumnNames.SchedulerId.string()),
          VisualLinks(),
          joinFields = SchedulerColumnNames.SchedulerId
        ),
        (table, _) => new SchedulerProvider(table),
      )
      .asModule()
  }


  object SchedulerColumnNames {
    final val SchedulerId = "schedulerId"

  }
}
