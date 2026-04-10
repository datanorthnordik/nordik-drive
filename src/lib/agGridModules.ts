import {
  CellStyleModule,
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  ColumnApiModule,
  ColumnAutoSizeModule,
  DateFilterModule,
  EventApiModule,
  ExternalFilterModule,
  Module,
  ModuleRegistry,
  NumberFilterModule,
  QuickFilterModule,
  RenderApiModule,
  RowApiModule,
  RowSelectionModule,
  RowStyleModule,
  ScrollApiModule,
  TextEditorModule,
  TextFilterModule,
  TooltipModule,
} from "ag-grid-community";

export const readOnlyAgGridModules: Module[] = [
  ClientSideRowModelModule,
  ClientSideRowModelApiModule,
  ColumnApiModule,
  RowApiModule,
  ScrollApiModule,
  EventApiModule,
  QuickFilterModule,
  ExternalFilterModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  RowSelectionModule,
  TooltipModule,
  CellStyleModule,
  RowStyleModule,
];

export const editableAgGridModules: Module[] = [
  ...readOnlyAgGridModules,
  ColumnAutoSizeModule,
  RenderApiModule,
  TextEditorModule,
];

const registeredAgGridModules = new Set<Module>();

export function registerAgGridModules(modules: Module[]) {
  const nextModules = modules.filter((module) => !registeredAgGridModules.has(module));

  if (nextModules.length === 0) return;

  nextModules.forEach((module) => registeredAgGridModules.add(module));
  ModuleRegistry.registerModules(nextModules);
}
