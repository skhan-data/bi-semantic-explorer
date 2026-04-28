/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PBIModel {
  name: string;
  tables: PBITable[];
  relationships: PBIRelationship[];
  reports?: PBIReport[];
}

export interface PBITable {
  name: string;
  description?: string;
  expression?: string; // For calculated tables
  storageMode?: string; // Import, DirectQuery, etc.
  columns: PBIColumn[];
  measures: PBIMeasure[];
  isHidden?: boolean;
}

export interface PBIColumn {
  name: string;
  tableName?: string; // Metadata added during extraction
  dataType: string;
  description?: string;
  expression?: string; // For calculated columns
  isHidden?: boolean;
  isUsed?: boolean;
  sourceColumn?: string;
  displayFolder?: string;
  dependencies?: {
    measures: string[];
    columns: string[];
  };
}

export interface PBIMeasure {
  name: string;
  tableName?: string; // Metadata added during extraction
  expression: string; // DAX
  description?: string;
  formatString?: string;
  isHidden?: boolean;
  isUsed?: boolean;
  displayFolder?: string;
  dependencies?: {
    measures: string[];
    columns: string[];
  };
  aiExplanation?: string;
  reportUsage?: {
    page: string;
    visual: string;
  }[];
}

export interface PBIRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  fromCardinality?: string;
  toCardinality?: string;
  crossFilteringBehavior: string;
}

export interface PBIReport {
  name: string;
  pages: PBIReportPage[];
}

export interface PBIReportPage {
  name: string;
  visuals: PBIVisual[];
}

export interface PBIVisual {
  type: string;
  title?: string;
  usedMeasures: string[];
  usedColumns: string[];
}
