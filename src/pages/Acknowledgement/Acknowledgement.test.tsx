import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({ __esModule: true, useNavigate: () => mockNavigate }),
  { virtual: true }
);

jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    __esModule: true,
    ...actual,
    useTheme: () => ({
      breakpoints: {
        down: () => "md",
      },
    }),
    useMediaQuery: jest.fn(() => false),
  };
});

const Acknowledgement = require("./Acknowledgement").default;

describe("Acknowledgement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  test("renders heading and body content", () => {
    render(<Acknowledgement />);

    expect(screen.getByText("Acknowledgement")).toBeInTheDocument();

    expect(
      screen.getByText(
        /The Children of Shingwauk Alumni Association’s \(CSAA\) mission is to provide for the/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(/The CSAA facilitates the ongoing development of a partnership/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/Sharing, Healing and Learning\./i)).toBeInTheDocument();

    expect(
      screen.getByText(/The CSAA provides: A non-political voice for survivors’ concerns/i)
    ).toBeInTheDocument();
  });

  test("does not navigate automatically", () => {
    render(<Acknowledgement />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
