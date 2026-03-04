// DatePickerComponent.test.tsx
import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import dayjs from "dayjs";

import DatePickerComponent from "./DateDropDown";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

let latestLocalizationProps: any;
let latestDatePickerProps: any;

jest.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children, ...props }: any) => {
    latestLocalizationProps = props;
    return <div data-testid="localization-provider">{children}</div>;
  },
}));

jest.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: function MockAdapterDayjs() {
    return null;
  },
}));

jest.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: (props: any) => {
    latestDatePickerProps = props;
    return <div data-testid="mock-date-picker">{props.label}</div>;
  },
}));

describe("DatePickerComponent", () => {
  beforeEach(() => {
    latestLocalizationProps = undefined;
    latestDatePickerProps = undefined;
  });

  it("renders inside LocalizationProvider and passes AdapterDayjs", () => {
    render(
      <DatePickerComponent
        label="Date of Birth"
        value=""
        onChange={jest.fn()}
      />
    );

    expect(screen.getByTestId("localization-provider")).toBeInTheDocument();
    expect(screen.getByTestId("mock-date-picker")).toBeInTheDocument();
    expect(latestLocalizationProps.dateAdapter).toBe(AdapterDayjs);
  });

  it("passes label and static picker props", () => {
    render(
      <DatePickerComponent
        label="Admission Date"
        value=""
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText("Admission Date")).toBeInTheDocument();
    expect(latestDatePickerProps.label).toBe("Admission Date");
    expect(latestDatePickerProps.format).toBe("DD.MM.YYYY");
    expect(latestDatePickerProps.openTo).toBe("day");
    expect(latestDatePickerProps.views).toEqual(["year", "month", "day"]);
    expect(latestDatePickerProps.sx).toBeTruthy();
    expect(latestDatePickerProps.slotProps).toBeTruthy();
    expect(latestDatePickerProps.slotProps.desktopPaper).toBeTruthy();
  });

  it("passes a Dayjs value when input contains dots", () => {
    render(
      <DatePickerComponent
        label="DOB"
        value="07.03.2021"
        onChange={jest.fn()}
      />
    );

    expect(latestDatePickerProps.value).not.toBeNull();
    expect(dayjs.isDayjs(latestDatePickerProps.value)).toBe(true);
  });

  it("passes null when input value does not contain dots", () => {
    render(
      <DatePickerComponent
        label="DOB"
        value="2021-03-07"
        onChange={jest.fn()}
      />
    );

    expect(latestDatePickerProps.value).toBeNull();
  });

  it('calls onChange("") when picker returns null', () => {
    const onChange = jest.fn();

    render(
      <DatePickerComponent
        label="DOB"
        value=""
        onChange={onChange}
      />
    );

    act(() => {
      latestDatePickerProps.onChange(null);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("formats selected Dayjs value as DD.MM.YYYY", () => {
    const onChange = jest.fn();

    render(
      <DatePickerComponent
        label="DOB"
        value=""
        onChange={onChange}
      />
    );

    act(() => {
      latestDatePickerProps.onChange(dayjs("2024-11-05"));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("05.11.2024");
  });

  it("updates parsed value when prop value changes", () => {
    const { rerender } = render(
      <DatePickerComponent
        label="DOB"
        value=""
        onChange={jest.fn()}
      />
    );

    expect(latestDatePickerProps.value).toBeNull();

    rerender(
      <DatePickerComponent
        label="DOB"
        value="15.12.1999"
        onChange={jest.fn()}
      />
    );

    expect(latestDatePickerProps.value).not.toBeNull();
    expect(dayjs.isDayjs(latestDatePickerProps.value)).toBe(true);
  });
});