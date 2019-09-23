/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 19/01/2016.

  */
package io.venuu.vuu.core.table

import io.venuu.toolbox.jmx.MetricsProviderImpl
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.DefaultTimeProvider
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.core.table.TableTestHelper._
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.provider.{JoinTableProviderImpl, RpcProvider}
import io.venuu.vuu.viewport.{DefaultRange, ViewPortContainer}
import org.scalatest.{FeatureSpec, Matchers, OneInstancePerTest}

class RpcTableTest extends FeatureSpec with Matchers with OneInstancePerTest {

  feature("Check we can create rpc tables and tick them") {

    scenario("simple rpc table") {

      //val sessionTable = new GroupBySessionTable(null, null)

      //println(sessionTable.isInstanceOf[SessionTable])

      implicit val time = new DefaultTimeProvider
      implicit val lifecycle = new LifecycleContainer
      implicit val metrics = new MetricsProviderImpl

      val joinProvider   = new JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val (outQueue, highPriorityQueue) = getQueues
      //val highPriorityQueue = new OutboundRowPublishQueue()

      val viewPortContainer = new ViewPortContainer(tableContainer)

      val orderEntryDef = TableDef("orderEntry", "clOrderId", Columns.fromNames("clOrderId:String", "ric:String", "quantity: Double", "orderType:String", "price: Double", "priceLevel: String"), "ric")

      val canons = orderEntryDef.columns.map( c => c.dataType.getCanonicalName )

      val typeNames = orderEntryDef.columns.map( c => c.dataType.getTypeName )

      val orderEntry = new SimpleDataTable(orderEntryDef, joinProvider)

      val provider = new RpcProvider(orderEntry)

      val session = new ClientSessionId("sess-01", "chris")

      val vpcolumns = List("clOrderId:String", "ric:String", "quantity:Double", "orderType:String", "price:Double", "priceLevel:String").map(orderEntry.getTableDef.columnForName(_))

      val viewPort = viewPortContainer.create(session, outQueue, highPriorityQueue, orderEntry, DefaultRange, vpcolumns)

      provider.tick("CLORDID-1", Map("clOrderId" ->  "CLORDID-1", "ric" -> "VOD.L", "quantity" -> 200))

      orderEntry.primaryKeys.length should equal (1)

      viewPortContainer.runOnce()

      val viewPortUpdate = combineQs(viewPort)

      viewPortUpdate(1).key.key should equal("CLORDID-1")
    }

  }

}