import axios from "axios";

export default async function sendPasswordReset(email: string) {
  const apiKey = process.env.FIREBASE_API_KEY ?? null;
  if (!apiKey) return;
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;

  try {
    await axios.post(url, {
      requestType: "PASSWORD_RESET",
      email,
    });
  } catch (error) {
    console.log(error);
  }
}
