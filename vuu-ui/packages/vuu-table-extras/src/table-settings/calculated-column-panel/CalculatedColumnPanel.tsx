import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import {
  Button,
  FormField,
  FormFieldLabel,
  Input,
  Panel,
  Text,
} from "@salt-ds/core";
import {
  ChangeEventHandler,
  Dispatch,
  HTMLAttributes,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  ColumnDefinitionExpression,
  ColumnExpressionInput,
  useColumnExpressionSuggestionProvider,
} from "../../column-expression-input";
import { ColumnAction } from "../settings-panel/useGridSettings";

import "./CalculatedColumnPanel.css";

export interface CalculatedColumnPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  columns: ColumnDescriptor[];
  dispatchColumnAction: Dispatch<ColumnAction>;
  table: VuuTable;
}

export const CalculatedColumnPanel = ({
  columns,
  dispatchColumnAction,
  table,
}: CalculatedColumnPanelProps) => {
  const [columnName, setColumnName] = useState("");
  const [, setExpression] = useState<ColumnDefinitionExpression>();
  const sourceRef = useRef<string>("");

  const suggestionProvider = useColumnExpressionSuggestionProvider({
    columns,
    table,
  });

  const handleChangeName: ChangeEventHandler<HTMLInputElement> = useCallback(
    (evt) => {
      const { value } = evt.target as HTMLInputElement;
      setColumnName(value);
    },
    []
  );
  const handleChangeExpression = useCallback((source: string) => {
    sourceRef.current = source;
  }, []);

  const handleSubmitExpression = useCallback(
    (source: string, expression: ColumnDefinitionExpression | undefined) => {
      console.log({ source });
      setExpression(expression);
    },
    []
  );

  const handleSave = useCallback(() => {
    if (sourceRef.current) {
      console.log(
        `save expression ${JSON.stringify(sourceRef.current, null, 2)}`
      );
      dispatchColumnAction({
        type: "addCalculatedColumn",
        columnName,
        expression: sourceRef.current,
        columnType: "string",
      });
    }
  }, [columnName, dispatchColumnAction]);

  return (
    <Panel className="vuuCalculatedColumnPanel" title="Define Computed Column">
      <Text styleAs="h4">Define Computed Column</Text>
      <FormField labelPlacement="left">
        <FormFieldLabel>Column Name</FormFieldLabel>
        <Input value={columnName} onChange={handleChangeName} />
      </FormField>
      <ColumnExpressionInput
        onChange={handleChangeExpression}
        onSubmitExpression={handleSubmitExpression}
        suggestionProvider={suggestionProvider}
      />
      <div style={{ marginTop: 12 }}>
        <Button onClick={handleSave}>Add Column</Button>
      </div>
    </Panel>
  );
};
