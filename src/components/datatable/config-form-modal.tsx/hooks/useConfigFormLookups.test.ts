import { act, renderHook, waitFor } from "@testing-library/react";
import useConfigFormLookups from "./useConfigFormLookups";
import type { BaseLeafColCfg, FormCfg, TableCfg } from "../shared";
import { fetchLookupJSON } from "../../../../hooks/useFetch";

jest.mock("../../../../hooks/useFetch", () => ({
  fetchLookupJSON: jest.fn(),
}));

const mockedFetchLookupJSON = fetchLookupJSON as jest.MockedFunction<typeof fetchLookupJSON>;

describe("useConfigFormLookups", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const hospitalCol: BaseLeafColCfg = {
    key: "hospital_id",
    label: "Hospital",
    type: "dropdown",
    is_server: true,
    api: "/lookup/hospitals/{province}",
  };

  const hospitalNameCol: BaseLeafColCfg = {
    key: "hospital_name",
    label: "Hospital Name",
    type: "text",
    value_key: "name",
    value_from: "hospital_id",
  };

  const baseTable: TableCfg = {
    key: "admissions",
    type: "table",
    columns: [
      { key: "province", label: "Province", type: "text" },
      hospitalCol,
      hospitalNameCol,
    ],
  };

  const makeFormConfig = (table: TableCfg = baseTable): FormCfg => ({
    key: "test_form",
    type: "form",
    sections: [
      {
        key: "sec1",
        title: "Section 1",
        tables: [table],
      },
    ],
  });

  test("getLookupPathForColumn returns normalized path and handles non-server / missing api cases", () => {
    const setAnswers = jest.fn();

    const { result } = renderHook(() =>
      useConfigFormLookups({
        formConfig: null,
        answers: {},
        setAnswers,
      })
    );

    expect(
      result.current.getLookupPathForColumn(
        {
          key: "x",
          label: "X",
          type: "dropdown",
          is_server: true,
          api: "///lookup/{province}",
        },
        { province: "ON" }
      )
    ).toBe("lookup/ON");

    expect(
      result.current.getLookupPathForColumn(
        {
          key: "x",
          label: "X",
          type: "dropdown",
          is_server: false,
          api: "/lookup/{province}",
        },
        { province: "ON" }
      )
    ).toBe("");

    expect(
      result.current.getLookupPathForColumn(
        {
          key: "x",
          label: "X",
          type: "dropdown",
          is_server: "true",
        },
        { province: "ON" }
      )
    ).toBe("");

    expect(
      result.current.getLookupPathForColumn(
        {
          key: "x",
          label: "X",
          type: "dropdown",
          is_server: "false",
          api: "/lookup/{province}",
        },
        { province: "ON" }
      )
    ).toBe("");
  });

  test("loads unique lookup options for visible server-backed columns and exposes selected option", async () => {
    mockedFetchLookupJSON.mockResolvedValueOnce([
      { id: 2, name: "Hospital Two" },
      { id: 3, name: "Hospital Three" },
    ] as any);

    const answers = {
      admissions: [
        { province: "ON", hospital_id: 2, hospital_name: "" },
        { province: "ON", hospital_id: 3, hospital_name: "" }, // same path -> should not refetch
      ],
    };

    const setAnswers = jest.fn();

    const { result } = renderHook(() =>
      useConfigFormLookups({
        formConfig: makeFormConfig(),
        answers,
        setAnswers,
      })
    );

    await waitFor(() => {
      expect(mockedFetchLookupJSON).toHaveBeenCalledTimes(1);
    });

    expect(mockedFetchLookupJSON).toHaveBeenCalledWith("lookup/hospitals/ON");

    await waitFor(() => {
      expect(result.current.lookupLoadingByPath["lookup/hospitals/ON"]).toBe(false);
      expect(result.current.lookupOptionsByPath["lookup/hospitals/ON"]).toEqual([
        { id: 2, name: "Hospital Two" },
        { id: 3, name: "Hospital Three" },
      ]);
    });

    const selected = result.current.getSelectedLookupOption(hospitalCol, answers.admissions[0]);
    expect(selected).toEqual({ id: 2, name: "Hospital Two" });
  });

  test("stores lookup error on fetch failure and resetLookupState clears all lookup state", async () => {
    mockedFetchLookupJSON.mockRejectedValueOnce(new Error("lookup failed"));

    const answers = {
      admissions: [{ province: "ON", hospital_id: 2, hospital_name: "" }],
    };

    const setAnswers = jest.fn();

    const { result } = renderHook(() =>
      useConfigFormLookups({
        formConfig: makeFormConfig(),
        answers,
        setAnswers,
      })
    );

    await waitFor(() => {
      expect(mockedFetchLookupJSON).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(result.current.lookupLoadingByPath["lookup/hospitals/ON"]).toBe(false);
      expect(result.current.lookupErrorsByPath["lookup/hospitals/ON"]).toBe("lookup failed");
    });

    act(() => {
      result.current.resetLookupState();
    });

    expect(result.current.lookupOptionsByPath).toEqual({});
    expect(result.current.lookupLoadingByPath).toEqual({});
    expect(result.current.lookupErrorsByPath).toEqual({});
  });

  test("applyConfiguredRowRules fills dependent value_key and clears invalid server values", async () => {
    mockedFetchLookupJSON.mockResolvedValueOnce([
      { id: 2, name: "Hospital Two" },
    ] as any);

    const answers = {
      admissions: [{ province: "ON", hospital_id: 2, hospital_name: "" }],
    };

    const setAnswers = jest.fn();

    const { result } = renderHook(() =>
      useConfigFormLookups({
        formConfig: makeFormConfig(),
        answers,
        setAnswers,
      })
    );

    await waitFor(() => {
      expect(result.current.lookupOptionsByPath["lookup/hospitals/ON"]).toEqual([
        { id: 2, name: "Hospital Two" },
      ]);
    });

    const filled = result.current.applyConfiguredRowRules(baseTable, {
      province: "ON",
      hospital_id: 2,
      hospital_name: "",
    });

    expect(filled).toEqual({
      province: "ON",
      hospital_id: 2,
      hospital_name: "Hospital Two",
    });

    const invalidSelection = result.current.applyConfiguredRowRules(baseTable, {
      province: "ON",
      hospital_id: 999,
      hospital_name: "Old name",
    });

    expect(invalidSelection).toEqual({
      province: "ON",
      hospital_id: "",
      hospital_name: "",
    });

    const missingDependency = result.current.applyConfiguredRowRules(baseTable, {
      province: "   ",
      hospital_id: 2,
      hospital_name: "Old name",
    });

    expect(missingDependency).toEqual({
      province: "   ",
      hospital_id: "",
      hospital_name: "",
    });
  });

  test("reconciliation effect calls setAnswers updater and produces changed rows when lookup data arrives", async () => {
    mockedFetchLookupJSON.mockResolvedValueOnce([
      { id: 2, name: "Hospital Two" },
    ] as any);

    const answers = {
      admissions: [{ province: "ON", hospital_id: 2, hospital_name: "" }],
    };

    const setAnswers = jest.fn();

    renderHook(() =>
      useConfigFormLookups({
        formConfig: makeFormConfig(),
        answers,
        setAnswers,
      })
    );

    await waitFor(() => {
      expect(mockedFetchLookupJSON).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(setAnswers).toHaveBeenCalled();
      expect(setAnswers.mock.calls.length).toBeGreaterThan(1);
    });

    const lastUpdater = setAnswers.mock.calls[setAnswers.mock.calls.length - 1][0];
    expect(typeof lastUpdater).toBe("function");

    const updated = lastUpdater(answers);

    expect(updated).toEqual({
      admissions: [{ province: "ON", hospital_id: 2, hospital_name: "Hospital Two" }],
    });
    expect(updated).not.toBe(answers);
  });

  test("reconciliation effect returns previous object when nothing changes", () => {
    const table: TableCfg = {
      key: "admissions",
      type: "table",
      columns: [{ key: "province", label: "Province", type: "text" }],
    };

    const answers = {
      admissions: [{ province: "ON" }],
    };

    const setAnswers = jest.fn();

    renderHook(() =>
      useConfigFormLookups({
        formConfig: makeFormConfig(table),
        answers,
        setAnswers,
      })
    );

    expect(setAnswers).toHaveBeenCalled();

    const updater = setAnswers.mock.calls[0][0];
    const resultValue = updater(answers);

    expect(resultValue).toBe(answers);
  });

  test("skips hidden sections/tables and does not fetch when formConfig is null", async () => {
    const hiddenTable: TableCfg = {
      ...baseTable,
      visible_if: { field: "show_table", equals: true },
    };

    const hiddenForm: FormCfg = {
      key: "hidden_form",
      type: "form",
      sections: [
        {
          key: "sec_hidden",
          visible_if: { field: "show_section", equals: true },
          tables: [baseTable],
        },
        {
          key: "sec_table_hidden",
          tables: [hiddenTable],
        },
      ],
    };

    const setAnswers = jest.fn();

    const { rerender } = renderHook(
      (props: { formConfig: FormCfg | null; answers: Record<string, any> }) =>
        useConfigFormLookups({
          formConfig: props.formConfig,
          answers: props.answers,
          setAnswers,
        }),
      {
        initialProps: {
          formConfig: null,
          answers: { admissions: [{ province: "ON", hospital_id: 2 }], show_section: false, show_table: false },
        },
      }
    );

    expect(mockedFetchLookupJSON).not.toHaveBeenCalled();

    rerender({
      formConfig: hiddenForm,
      answers: { admissions: [{ province: "ON", hospital_id: 2 }], show_section: false, show_table: false },
    });

    await waitFor(() => {
      expect(mockedFetchLookupJSON).not.toHaveBeenCalled();
    });
  });

  test("getSelectedLookupOption returns null for blank selected values or unresolved paths", async () => {
    mockedFetchLookupJSON.mockResolvedValueOnce([{ id: 2, name: "Hospital Two" }] as any);

    const answers = {
      admissions: [{ province: "ON", hospital_id: 2, hospital_name: "" }],
    };

    const setAnswers = jest.fn();

    const { result } = renderHook(() =>
      useConfigFormLookups({
        formConfig: makeFormConfig(),
        answers,
        setAnswers,
      })
    );

    await waitFor(() => {
      expect(result.current.lookupOptionsByPath["lookup/hospitals/ON"]).toBeDefined();
    });

    expect(
      result.current.getSelectedLookupOption(hospitalCol, {
        province: "ON",
        hospital_id: "",
      })
    ).toBeNull();

    expect(
      result.current.getSelectedLookupOption(
        {
          ...hospitalCol,
          api: "/lookup/hospitals/{missing_token}",
        },
        {
          province: "ON",
          hospital_id: 2,
        }
      )
    ).toBeNull();

    expect(
      result.current.getSelectedLookupOption(
        {
          ...hospitalCol,
          is_server: false,
        },
        {
          province: "ON",
          hospital_id: 2,
        }
      )
    ).toBeNull();
  });
});