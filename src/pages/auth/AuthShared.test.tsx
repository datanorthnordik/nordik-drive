import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import {
  OrDivider,
  AuthPasswordField,
  AuthControlledTextField,
  AuthPrimaryButton,
} from "./AuthShared";

function TestForm({
  errorMessage,
}: {
  errorMessage?: string;
}) {
  const { control } = useForm({
    defaultValues: { password: "", email: "" },
  });

  return (
    <div>
      <AuthControlledTextField
        name="email"
        control={control as any}
        label="Email"
        placeholder="Email address"
        errorMessage={errorMessage}
      />
      <AuthPasswordField
        name="password"
        control={control as any}
        label="Password"
        placeholder="Password"
      />
    </div>
  );
}

describe("AuthShared", () => {
  test("OrDivider renders OR text", () => {
    render(<OrDivider />);
    expect(screen.getByText("OR")).toBeInTheDocument();
  });

  test("AuthPasswordField toggles visibility", async () => {
    const user = userEvent.setup();
    render(<TestForm />);

    const passwordInput = screen.getByPlaceholderText(/password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    await user.click(screen.getByLabelText(/show password/i));
    expect(passwordInput.type).toBe("text");

    await user.click(screen.getByLabelText(/hide password/i));
    expect(passwordInput.type).toBe("password");
  });

  test("AuthControlledTextField shows helper text when errorMessage is provided", () => {
    render(<TestForm errorMessage="Email is required" />);
    expect(screen.getByText("Email is required")).toBeInTheDocument();
  });

  test("AuthPrimaryButton renders and handles click", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<AuthPrimaryButton onClick={onClick}>Click</AuthPrimaryButton>);
    await user.click(screen.getByRole("button", { name: /click/i }));

    expect(onClick).toHaveBeenCalled();
  });
});
