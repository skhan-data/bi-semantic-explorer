import { PBIModel } from './types';

export const mockModel: PBIModel = {
  "name": "Test Model",
  "tables": [
    {
      "name": "Sales",
      "description": "",
      "isHidden": false,
      "storageMode": "import",
      "columns": [
        {
          "name": "Amount",
          "tableName": "Sales",
          "dataType": "Decimal",
          "description": "",
          "displayFolder": "",
          "isHidden": false
        }
      ],
      "measures": [
        {
          "name": "Total Sales",
          "expression": "SUM(Sales[Amount]) // This is a test description",
          "description": "This is a test description",
          "formatString": "",
          "dependencies": {
            "measures": [],
            "columns": [
              "Sales[Amount]"
            ]
          },
          "aiExplanation": "This is a test description",
          "tableName": "Sales",
          "displayFolder": "",
          "isHidden": false,
          "reportUsage": [],
          "isUsed": false
        }
      ]
    }
  ],
  "relationships": [
    {
      "fromTable": "Sales",
      "fromColumn": "DateKey",
      "toTable": "Date",
      "toColumn": "DateKey",
      "fromCardinality": "many",
      "toCardinality": "one",
      "crossFilteringBehavior": "oneWay"
    }
  ],
  "reports": []
};
