import { auth } from "@/config/firebase";
import { LOCAL_AUTH_EMAIL } from "@/lib/auth/local-auth-config";
import { signOut } from "firebase/auth";

export async function logout() {
  const localEmail = sessionStorage.getItem("local_auth_email");

  if (localEmail?.toLowerCase() === LOCAL_AUTH_EMAIL) {
    sessionStorage.removeItem("local_auth_email");
    window.location.assign("/login");
    return;
  }

  await signOut(auth).catch(() => undefined);
  window.location.assign("/login");
}
