package org.finos.vuu.feature.ignite.schema

import org.finos.vuu.core.module.vui.VuiStateModule.stringToFieldDef
import org.finos.vuu.core.table.{Column, Columns, SimpleColumn}
import org.finos.vuu.feature.ignite.schema.SchemaMapper.InvalidSchemaMapException
import org.finos.vuu.feature.ignite.schema.SchemaMapperTest.{fieldsMap, tableColumns}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class SchemaMapperTest extends AnyFeatureSpec with Matchers {

  private val testExternalSchema = new TestEntitySchema
  private val schemaMapper = SchemaMapper(testExternalSchema, tableColumns, fieldsMap)

  Feature("toTableRowData") {
    Scenario("can convert an ordered list of external values to a map conforming to internal schema") {
      val rowData = schemaMapper.toTableRowData(List(3, "ric", "type", 10.5))
      rowData shouldEqual Map(
        "id" -> 3,
        "ric" -> "ric",
        "type" -> "type",
        "price" -> 10.5
      )
    }
  }

  Feature("externalSchemaField") {
    Scenario("can get external schema field from internal column name") {
      val f = schemaMapper.externalSchemaField("ric")
      f.get shouldEqual SchemaField("externalRic", classOf[String], 1)
    }
  }

  Feature("tableColumn") {
    Scenario("can get internal column from external field name") {
      val column = schemaMapper.tableColumn("externalRic")
      column.get shouldEqual SimpleColumn("ric", 1, classOf[String])
    }
  }


  Feature("validation on instantiation") {
    Scenario("fails when mapped external field not found in external schema") {
      val exception = intercept[InvalidSchemaMapException](
        SchemaMapper(testExternalSchema, Columns.fromNames("ric".int()), Map("non-existent" -> "ric"))
      )
      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex s"[Ff]ield `non-existent` not found"
    }

    Scenario("fails when mapped internal field not found in internal columns") {
      val exception = intercept[InvalidSchemaMapException](
        SchemaMapper(testExternalSchema, Columns.fromNames("id".int()), Map("externalId" -> "absent-col"))
      )
      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex "[Cc]olumn `absent-col` not found"
    }

    Scenario("fails when external->internal map contains duplicated internal field") {
      val exception = intercept[InvalidSchemaMapException](SchemaMapper(
        testExternalSchema,
        Columns.fromNames("id".int(), "ric".string()),
        Map("externalId" -> "id", "externalRic" -> "id")
      ))
      exception shouldBe a[RuntimeException]
      exception.getMessage should include("duplicated column names")
    }
  }
}

private class TestEntitySchema extends ExternalStoreEntitySchema {
  override val schemaFields: List[SchemaField] = List(
    SchemaField("externalId", classOf[Int], 0),
    SchemaField("externalRic", classOf[String], 1),
    SchemaField("type", classOf[String], 2),
    SchemaField("price", classOf[Double], 3),
  )
}

private object SchemaMapperTest {

  val tableColumns: Array[Column] = Columns.fromNames(
      "id".int(),
      "ric".string(),
      "type".string(),
      "price".double(),
  )

  val fieldsMap: Map[String, String] = Map(
    "externalId" -> "id",
    "externalRic" -> "ric",
    "type" -> "type",
    "price" -> "price"
  )

}