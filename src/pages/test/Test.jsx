import { useState } from "react";
import { auth } from "./firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const TestFirebaseOTP = () => {
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Setup reCAPTCHA verifier (attach to window!)
  const setUpRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }
    return window.recaptchaVerifier;
  };

  const sendOTP = async () => {
    try {
      const appVerifier = setUpRecaptcha();
      const phoneNumber = "+12496223560"; // test number
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      alert("OTP sent! Check your phone.");
    } catch (err) {
      console.error("Error sending OTP:", err);
    }
  };

  const verifyOTP = async () => {
    if (!confirmationResult) return;
    try {
      const userCredential = await confirmationResult.confirm(otp);
      console.log("Verified user:", userCredential.user);
      alert("OTP verified!");
    } catch (err) {
      console.error("Invalid OTP:", err);
      alert("Invalid OTP. Try again.");
    }
  };

  return (
    <div>
      <button onClick={sendOTP}>Send OTP</button>
      <div id="recaptcha-container"></div>

      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />
      <button onClick={verifyOTP}>Verify OTP</button>
    </div>
  );
};

export default TestFirebaseOTP;
