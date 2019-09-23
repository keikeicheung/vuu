package io.venuu.vuu.viewport

import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.time.TimeProvider
import io.venuu.vuu.core.table.TableContainer

/**
  * Created by chris on 02/09/2016.
  */
object ViewPortTestFns {

  def setupViewPort(tableContainer: TableContainer)(implicit time: TimeProvider, metrics: MetricsProvider): (ViewPortContainer) = {

    val viewPortContainer = new ViewPortContainer(tableContainer)

    (viewPortContainer)
  }

}