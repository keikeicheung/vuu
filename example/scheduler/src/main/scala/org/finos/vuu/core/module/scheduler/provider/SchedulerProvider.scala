package org.finos.vuu.core.module.scheduler.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.RunOnceLifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.scheduler.SchedulerModule.SchedulerColumnNames
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.DefaultProvider

class SchedulerProvider(val table: DataTable)(implicit lifecycle: LifecycleContainer, clock: Clock) extends DefaultProvider {

  private val runner = new RunOnceLifeCycleRunner("SchedulerProvider", runOnce)

  lifecycle(this).dependsOn(runner)

  def runOnce(): Unit = {
    table.processUpdate(SchedulerColumnNames.SchedulerId, RowWithData(SchedulerColumnNames.SchedulerId, Map(
      SchedulerColumnNames.SchedulerId -> "test2-id"
    )), clock.now())
  }

  override val lifecycleId: String = "org.finos.vuu.core.module.scheduler.provider.SchedulerProvider"
}
