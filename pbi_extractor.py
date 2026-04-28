import json
import os
import argparse
import re

def find_pbi_root(root_path):
    """
    Recursively scans the root_path to find the first directory that looks like 
    a Power BI project (.SemanticModel folder or .pbip file or .bim file).
    """
    if not os.path.isdir(root_path):
        return root_path if os.path.exists(root_path) else None

    # Priority 1: Check if the current dir is a SemanticModel or contains .pbip
    for item in os.listdir(root_path):
        item_path = os.path.join(root_path, item)
        if item.endswith('.SemanticModel') and os.path.isdir(item_path):
            return item_path
        if item.endswith('.pbip') and os.path.isfile(item_path):
            return root_path # The parent of the .pbip is usually our project root

    # Priority 2: Recursively search
    for root, dirs, files in os.walk(root_path):
        # Exclude hidden folders like .git or .SemanticModel folders themselves (from further walk)
        if '.git' in dirs: dirs.remove('.git')
        
        for d in dirs:
            if d.endswith('.SemanticModel'):
                return os.path.join(root, d)
        for f in files:
            if f.endswith('.pbip') or f.endswith('.bim'):
                return os.path.join(root, f)
    
    return root_path

def extract_pbi_metadata(input_path):
    """
    Parses a Power BI project and converts it to the format 
    expected by the Semantic Explorer UI.
    Now supports nested discovery for Zip/Git sessions.
    """
    real_path = find_pbi_root(input_path)
    if not real_path or not os.path.exists(real_path):
        print(f"Error: No valid Power BI project found in {input_path}")
        return None

    if os.path.isdir(real_path):
        # Handle TMDL Folder (Semantic Model)
        model = extract_from_tmdl(real_path)
        
        # Auto-detect sibling Report folder for PBIP
        # If it was a nested .SemanticModel, look for .Report nearby
        report_folder = real_path.replace('.SemanticModel', '.Report')
        if os.path.exists(report_folder) and os.path.isdir(report_folder):
            model["reports"] = extract_from_pbir(report_folder)
        
        # Post-process
        if model:
            model = detect_unused_items(model)
            model = resolve_dependencies(model)
            
        return model
    else:
        # Handle .bim File or single .tmdl
        if real_path.endswith('.tmdl'):
            table_data = parse_tmdl_table_file(real_path)
            model = {
                "name": os.path.basename(real_path),
                "tables": [table_data] if table_data else [],
                "relationships": []
            }
        else:
            model = extract_from_bim(real_path)
            
        if model:
            model = detect_unused_items(model)
            model = resolve_dependencies(model)
        return model

def detect_unused_items(model):
    """
    Identifies measures and columns that are not used in other DAX expressions 
    or in any report visuals.
    """
    all_measures = []
    all_expressions = ""
    report_usage = ""

    # 1. Collect all names and expressions
    for table in model.get('tables', []):
        for measure in table.get('measures', []):
            all_measures.append(measure)
            all_expressions += f" {measure.get('expression', '')} "
        
    # 2. Build usages for each measure
    for measure in all_measures:
        m_name = measure['name']
        m_name_lower = m_name.lower()
        
        # Check DAX usage (Search for [MeasureName])
        pattern = f"[{m_name_lower}]"
        is_used_in_dax = pattern in all_expressions.lower()
        
        # Check Report usage
        report_usages = []
        for report in model.get('reports', []):
            for page in report.get('pages', []):
                for visual in page.get('visuals', []):
                    # Deep check in visual metadata
                    # Some visuals use the property name directly, others use [Name]
                    v_str = json.dumps(visual).lower()
                    used_props = [p.lower() for p in visual.get('usedMeasures', [])]
                    
                    if f"[{m_name_lower}]" in v_str or m_name_lower in used_props or f'"{m_name_lower}"' in v_str:
                        report_usages.append({
                            "page": page['name'],
                            "visual": visual.get('title') or f"{visual['type']} visual"
                        })
        
        measure['reportUsage'] = report_usages
        measure['isUsed'] = is_used_in_dax or len(report_usages) > 0

    return model

def extract_from_bim(bim_path):
    with open(bim_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    model_data = data.get('model', {})
    
    result = {
        "name": model_data.get('name', 'Unnamed Model'),
        "tables": [],
        "relationships": [],
        "reports": []
    }

    # Extract Tables
    for table in model_data.get('tables', []):
        name = table.get('name', '')
        if "DateTableTemplate_" in name or "LocalDateTable_" in name:
            continue
            
        t_data = {
            "name": name,
            "description": table.get('description', ''),
            "isHidden": table.get('isHidden', False),
            "storageMode": table.get('storageMode', 'import'),
            "columns": [],
            "measures": []
        }

        # Columns
        for col in table.get('columns', []):
            t_data["columns"].append({
                "name": col.get('name'),
                "tableName": name,
                "dataType": col.get('dataType', 'Unknown'),
                "description": col.get('description', ''),
                "displayFolder": col.get('displayFolder', ''),
                "isHidden": col.get('isHidden', False)
            })

        # Measures
        for measure in table.get('measures', []):
            expression = measure.get('expression', '')
            m_obj = create_measure_object(measure.get('name'), expression, measure.get('description', ''), measure.get('formatString', ''))
            m_obj["tableName"] = name
            m_obj["displayFolder"] = measure.get('displayFolder', '')
            m_obj["isHidden"] = measure.get('isHidden', False)
            t_data["measures"].append(m_obj)

        result["tables"].append(t_data)

    # Extract Relationships
    for rel in model_data.get('relationships', []):
        from_table = rel.get('fromTable', '')
        to_table = rel.get('toTable', '')
        
        # Skip relationships involving system tables
        if "DateTableTemplate_" in from_table or "LocalDateTable_" in from_table or \
           "DateTableTemplate_" in to_table or "LocalDateTable_" in to_table:
            continue
            
        result["relationships"].append({
            "fromTable": from_table,
            "fromColumn": rel.get('fromColumn'),
            "toTable": to_table,
            "toColumn": rel.get('toColumn'),
            "fromCardinality": rel.get('fromCardinality', 'many'),
            "toCardinality": rel.get('toCardinality', 'one'),
            "crossFilteringBehavior": rel.get('crossFilteringBehavior', 'oneWay')
        })

    return result

def extract_from_tmdl(folder_path):
    # Determine the model name from the folder name
    model_name = os.path.basename(folder_path).replace('.SemanticModel', '')
    
    result = {
        "name": model_name,
        "tables": [],
        "relationships": [],
        "reports": []
    }

    # Path to definition files
    definition_path = os.path.join(folder_path, 'definition')
    if not os.path.exists(definition_path):
        # Try if input_path is already the definition folder
        definition_path = folder_path if 'tables' in os.listdir(folder_path) else None
        if not definition_path:
            print("Error: Could not find 'definition' folder or 'tables' folder.")
            return None

    # 1. Parse Tables
    tables_path = os.path.join(definition_path, 'tables')
    if os.path.exists(tables_path):
        for filename in os.listdir(tables_path):
            if filename.endswith('.tmdl'):
                table_data = parse_tmdl_table_file(os.path.join(tables_path, filename))
                if table_data:
                    # Inject tableName into children for easier frontend mapping
                    for m in table_data.get('measures', []): m['tableName'] = table_data['name']
                    for c in table_data.get('columns', []): c['tableName'] = table_data['name']
                    result["tables"].append(table_data)

    # 2. Parse Relationships
    rel_path = os.path.join(definition_path, 'relationships.tmdl')
    if os.path.exists(rel_path):
        result["relationships"] = parse_tmdl_relationships_file(rel_path)

    return result

def parse_tmdl_table_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Get table name and potentially its expression (if it's a calculated table)
    # TMDL format: table TableName [= Expression]
    table_match = re.search(r'^table\s+[\'"]?(.+?)[\'"]?(?:\s*=\s*(.*))?$', content, re.MULTILINE)
    if not table_match:
        return None
    
    table_name = table_match.group(1)
    table_expr = table_match.group(2).strip() if table_match.group(2) else ""
    
    if "DateTableTemplate_" in table_name or "LocalDateTable_" in table_name:
        return None
    
    table_data = {
        "name": table_name,
        "description": "", 
        "expression": table_expr,
        "storageMode": "import", # Default
        "isHidden": bool(re.search(r'^\s*isHidden\s*$', content[:500], re.MULTILINE)),
        "columns": [],
        "measures": []
    }

    storage_match = re.search(r'^\s*storageMode:\s*[\'"]?(.+?)[\'"]?\s*$', content, re.MULTILINE)
    if storage_match:
        table_data["storageMode"] = storage_match.group(1)

    lines = content.split('\n')
    current_item = None
    
    for line in lines:
        measure_match = re.search(r'^\s*measure\s+[\'"]?(.+?)[\'"]?\s*=\s*(.*)$', line)
        if measure_match:
            name, expr = measure_match.groups()
            current_item = create_measure_object(name, expr, "", "")
            table_data["measures"].append(current_item)
            continue
        
        column_match = re.search(r'^\s*column\s+[\'"]?(.+?)[\'"]?(?:\s*=\s*(.*))?$', line)
        if column_match:
            col_name = column_match.group(1)
            col_expr = column_match.group(2).strip() if column_match.group(2) else ""
            current_item = {
                "name": col_name,
                "dataType": "Unknown",
                "expression": col_expr,
                "description": ""
            }
            table_data["columns"].append(current_item)
            continue
        
        # Check if this line is a property of the current measure/column
        is_indented = line.startswith('\t\t') or line.startswith('  ')
        if current_item and is_indented:
            tmdl_property_match = re.search(r'^\s*(formatString|lineageTag|displayFolder|description|sourceLineageTag|isHidden|summarizeBy|dataCategory|dataType|source|annotation)\s*:', line)
            if tmdl_property_match:
                prop_name = tmdl_property_match.group(1)
                prop_val_match = re.search(f'{prop_name}:\\s*[\'"]?(.+?)[\'"]?\\s*$', line)
                if prop_val_match:
                    val = prop_val_match.group(1).strip()
                    if prop_name == "description":
                        current_item["description"] = val
                    elif prop_name == "formatString" and "formatString" in current_item:
                        current_item["formatString"] = val
                    elif prop_name == "displayFolder":
                        current_item["displayFolder"] = val
                    elif prop_name == "isHidden":
                        current_item["isHidden"] = (val.lower() == "true")
                continue # Don't append property lines to DAX expression
            
            # If not a property, it must be a continuing DAX expression line
            # Only append to expression if it's a measure or a calculated column
            if "expression" in current_item:
                if current_item["expression"]:
                    current_item["expression"] += "\n" + line.strip()
                else:
                    current_item["expression"] = line.strip()
        elif not is_indented:
            current_item = None

    return table_data

def parse_tmdl_relationships_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    relationships = []
    # Pattern: relationship ... \n  fromColumn: table.col \n toColumn: table.col
    blocks = re.split(r'^relationship\s+', content, flags=re.MULTILINE)
    for block in blocks[1:]:
        from_match = re.search(r'fromColumn:\s+[\'"]?(.+?)[\'"]?\.[\'"]?(.+?)[\'"]?$', block, re.MULTILINE)
        to_match = re.search(r'toColumn:\s+[\'"]?(.+?)[\'"]?\.[\'"]?(.+?)[\'"]?$', block, re.MULTILINE)
        
        if from_match and to_match:
            from_table = from_match.group(1)
            to_table = to_match.group(1)
            
            # Skip relationships involving system tables
            if "DateTableTemplate_" in from_table or "LocalDateTable_" in from_table or \
               "DateTableTemplate_" in to_table or "LocalDateTable_" in to_table:
                continue
            
            from_card_match = re.search(r'fromCardinality:\s+(\w+)', block)
            to_card_match = re.search(r'toCardinality:\s+(\w+)', block)
            cross_filter_match = re.search(r'crossFilteringBehavior:\s+(\w+)', block)
            
            relationships.append({
                "fromTable": from_table,
                "fromColumn": from_match.group(2),
                "toTable": to_table,
                "toColumn": to_match.group(2),
                "fromCardinality": from_card_match.group(1).lower() if from_card_match else "many",
                "toCardinality": to_card_match.group(1).lower() if to_card_match else "one",
                "crossFilteringBehavior": cross_filter_match.group(1).lower() if cross_filter_match else "oneWay"
            })
    return relationships

def extract_from_pbir(report_folder):
    definition_path = os.path.join(report_folder, 'definition')
    if not os.path.exists(definition_path):
        return []
        
    pages = []
    pages_path = os.path.join(definition_path, 'pages')
    if os.path.exists(pages_path):
        for page_dir in os.listdir(pages_path):
            page_full_path = os.path.join(pages_path, page_dir)
            if not os.path.isdir(page_full_path):
                continue
                
            page_json_path = os.path.join(page_full_path, 'page.json')
            if not os.path.exists(page_json_path):
                continue
                
            with open(page_json_path, 'r', encoding='utf-8') as f:
                page_meta = json.load(f)
                
            page_data = {
                "name": page_meta.get('displayName', page_dir),
                "visuals": []
            }
            
            visuals_path = os.path.join(page_full_path, 'visuals')
            if os.path.exists(visuals_path):
                for visual_dir in os.listdir(visuals_path):
                    visual_full_path = os.path.join(visuals_path, visual_dir)
                    if not os.path.isdir(visual_full_path):
                        continue
                        
                    visual_json_path = os.path.join(visual_full_path, 'visual.json')
                    if os.path.exists(visual_json_path):
                        with open(visual_json_path, 'r', encoding='utf-8') as f:
                            v_meta = json.load(f)
                            
                        # Extract visual type
                        v_type = v_meta.get('visual', {}).get('visualType', 'unknown')
                        
                        # Extract title (if exists)
                        v_title = ""
                        title_expr = v_meta.get('visual', {}).get('title', {}).get('text', {}).get('expression', {})
                        if 'Literal' in title_expr:
                            v_title = title_expr['Literal'].get('Value', '')

                        # Find all field references (measures or columns)
                        v_str = json.dumps(v_meta)
                        used_properties = list(set(re.findall(r'"Property":\s*"(.+?)"', v_str)))
                        
                        page_data["visuals"].append({
                            "type": v_type,
                            "title": v_title or f"{v_type} visual",
                            "usedMeasures": used_properties,
                            "usedColumns": used_properties
                        })
            
            pages.append(page_data)
            
    report_name = os.path.basename(report_folder).replace('.Report', '')
    return [{"name": report_name, "pages": pages}]

def create_measure_object(name, expression, description, format_string):
    # Description extraction is now handled in the resolve_dependencies post-processing
    # to ensure fixed/multi-line expressions are captured fully first.
    return {
        "name": name,
        "expression": expression,
        "description": description,
        "formatString": format_string,
        "dependencies": {
            "measures": [], 
            "columns": []
        },
        "aiExplanation": description or f"Calculates values using: {expression[:50]}..."
    }

def resolve_dependencies(model):
    """
    Post-processing: Scan each measure's and calculated column's DAX expression 
    for references to other measures and columns.
    """
    # Build lookup sets
    all_measure_names = set()
    all_table_names = set()
    
    for table in model.get('tables', []):
        all_table_names.add(table['name'])
        for m in table.get('measures', []):
            all_measure_names.add(m['name'])

    # Now scan each logic item's expression
    for table in model.get('tables', []):
        # Logic items = Measures + Calculated Columns
        logic_items = table.get('measures', []) + [c for c in table.get('columns', []) if c.get('expression')]
        
        for item in logic_items:
            expr = item.get('expression', '')
            dep_measures = set()
            dep_columns = set()

            # --- Description Extraction Fix (First '//' comment as description) ---
            if not item.get('description'):
                comment_match = re.search(r'//\s*(.*)$', expr, re.MULTILINE)
                if comment_match:
                    item['description'] = comment_match.group(1).strip()

            # Update AI Explanation if we now have a description
            if (not item.get('aiExplanation') or "Calculates values using" in item.get('aiExplanation')) and item.get('description'):
                item['aiExplanation'] = item['description']

            # --- Unified Lineage Detection ---
            # Pattern 1: [MeasureName] (Simple square brackets)
            bracket_refs = re.findall(r'\[([^\]]+)\]', expr)
            for ref in bracket_refs:
                # If it's a known measure, it's a measure dependency
                if ref in all_measure_names and ref != item['name']:
                    dep_measures.add(ref)

            # Pattern 2: 'Table Name'[Field] or TableName[Field]
            # Capture table and field inside brackets
            table_field_refs = re.findall(r"(?:'([^']+)'|(\w+))\[([^\]]+)\]", expr)
            for quoted_tbl, unquoted_tbl, field in table_field_refs:
                tbl = quoted_tbl or unquoted_tbl
                if tbl in all_table_names:
                    # Is this field a measure or a column?
                    if field in all_measure_names:
                        dep_measures.add(field)
                    else:
                        dep_columns.add(f"{tbl}[{field}]")

            item['dependencies'] = {
                'measures': list(dep_measures),
                'columns': list(dep_columns)
            }

    return model

def main():
    parser = argparse.ArgumentParser(description='Extract Power BI Metadata to JSON for Semantic Explorer.')
    parser.add_argument('input', help='Path to the .bim file or PBIP SemanticModel folder')
    parser.add_argument('--output', '-o', default='pbi_model_export.json', help='Output JSON filename')
    parser.add_argument('--dev', action='store_true', help='Update src/mockData.ts directly for instant UI updates')

    args = parser.parse_args()

    print(f"--- Power BI Metadata Extractor ---")
    print(f"Reading: {args.input}")
    
    extracted_data = extract_pbi_metadata(args.input)
    
    if extracted_data:
        # Save standard JSON
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(extracted_data, f, indent=2)
        print(f"Success! Exported to {args.output}")

        # Handle --dev flag (Overwrites UI default data)
        if args.dev:
            mock_data_path = os.path.join(os.path.dirname(__file__), 'src', 'mockData.ts')
            if os.path.exists(os.path.dirname(mock_data_path)):
                with open(mock_data_path, 'w', encoding='utf-8') as f:
                    f.write("import { PBIModel } from './types';\n\n")
                    f.write("export const mockModel: PBIModel = ")
                    json.dump(extracted_data, f, indent=2)
                    f.write(";\n")
                print(f"--- DEV MODE ---")
                print(f"Updated live data at: {mock_data_path}")
                print(f"Refresh your browser (http://localhost:3000) to see changes instantly!")
            else:
                print("Warning: Could not find src folder. --dev flag only works if run from the project root.")
        else:
            print(f"You can now upload this file to the Semantic Explorer UI.")
    else:
        print("Failed to extract metadata.")

if __name__ == "__main__":
    main()
