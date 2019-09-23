package io.venuu.vuu.core.table

import java.util.concurrent.ConcurrentHashMap

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.{JmxAble, MetricsProvider}
import io.venuu.vuu.api.{JoinTableDef, TableDef}
import io.venuu.vuu.core.groupby.{GroupBySessionTable, SessionTable}
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.provider.JoinTableProvider
import io.venuu.vuu.viewport.RowSource

trait TableContainerMBean{
  def tableList: String
  def toAscii(name: String): String
  def toAsciiRange(name: String, start: Int, end: Int): String
  def getTableNames(): Array[String]
  def getSubscribedKeys(name: String): String
}


/**
 * Created by chris on 26/02/2014.
 */
class TableContainer(joinTableProvider: JoinTableProvider)(implicit val metrics: MetricsProvider) extends JmxAble with TableContainerMBean with StrictLogging{

  private val tables = new ConcurrentHashMap[String, DataTable]()

  //private val sessionTables = new ConcurrentHashMap[String, GroupBySessionTable]()

  override def getSubscribedKeys(name: String): String = {
    val table = tables.get(name)

    if(table == null)
      s"table not found with name ${name}"
    else{
      val obByKey = table.getObserversByKey()
      obByKey.map({ case(key, obs) => s"key=$key,obs=${obs.mkString(",")}"}).mkString("\n")
    }
  }

  override def toAscii(name: String): String = {
    val table = tables.get(name)

    if(table == null)
      "Table not found"
    else
      table.toAscii(500)
  }

  override def toAsciiRange(name: String, start: Int, end: Int): String = {
    val table = tables.get(name)

    if(table == null)
      "Table not found"
    else
      table.toAscii(start, end)
  }


  override def tableList: String = {
    import scala.collection.JavaConversions._
    tables.keySet().iterator().mkString("\n")
  }

//  override def sessionTableList: String = {
//    import scala.collection.JavaConversions._
//    sessionTables.keySet().iterator().mkString("\n")
//  }

  def getTableNames(): Array[String] = {
    import scala.collection.JavaConversions._
    tables.keys().map(_.toString).toArray[String]
  }

  def getTable(name: String): DataTable = {
    tables.get(name)
  }

  def createAutoSubscribeTable(tableDef: TableDef) : DataTable = {

    val table = new AutoSubscribeTable(tableDef, joinTableProvider)

    tables.put(table.getTableDef.name, table)

    table
  }

  def createTable(tableDef: TableDef) : DataTable = {
    val table = new SimpleDataTable(tableDef, joinTableProvider)
    tables.put(table.getTableDef.name, table)
    table
  }

  def createGroupBySessionTable(source: RowSource, session: ClientSessionId): GroupBySessionTable = {
    val table = new GroupBySessionTable(source, session, joinTableProvider)
    //source.addSessionListener(table)
    val existing = tables.put(table.name, table)
    assert(existing == null, "we should never replace an existing table with session id")
    table
  }

  def createJoinTable(table: JoinTableDef): DataTable = {

    val baseTable      = tables.get(table.baseTable.name)
    val joinTableMap   = table.joins.map(join => (join.table.name -> tables.get(join.table.name) ) ).toMap //tables.get(table.right.name)
    val baseTableMap   = Map[String, DataTable](table.baseTable.name -> baseTable)


    val sourceTables = joinTableMap ++ baseTableMap

    val joinTable = new JoinTable(table, sourceTables, joinTableProvider)

    tables.put(joinTable.getTableDef.name, joinTable)

    joinTableProvider.addJoinTable(joinTable)

    joinTable
  }

  def removeSessionTables(session:ClientSessionId): Unit = {
    import scala.collection.JavaConversions._
    val sessionTables = tables.entrySet()
      .filter( entry => entry.getValue.isInstanceOf[SessionTable])
      .filter( entry => entry.getValue.asInstanceOf[SessionTable].sessionId == session )
      .map(_.getValue.asInstanceOf[SessionTable])
      .toArray

    logger.info(s"Removing ${sessionTables.length} session tables on disconnect of ${session}")

    sessionTables.foreach( sessTable => tables.remove(sessTable.name) )
  }

}