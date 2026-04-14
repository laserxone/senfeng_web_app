"use client";

import PageContainer from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCallback } from "react";

export default function Page() {
  const emailAddress = "laserzone.pk@gmail.com";

  const handleEmailClick = useCallback(() => {
    window.location.href = `mailto:${emailAddress}?subject=Data Deletion Request&body=Please delete my account and associated data. My account email is: [your-email-here]`;
  }, []);

  return (
     <PageContainer scrollable={true}>
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Request Data Deletion</h1>
        <p className="text-muted-foreground">
          If you would like to delete your data associated with our SENFENG App,
          you can send us an email. We respect your privacy and will process
          your request promptly.
        </p>
      </div>

      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-2">How to Request Data Deletion</h2>
        <p>To request the deletion of your personal data and account from our system:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Include the email address associated with your account.</li>
          <li>Clearly state your request for data deletion in the email.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
        <p>You can reach out to us by sending an email to:</p>
        <p className="text-blue-600 font-medium mt-2">{emailAddress}</p>
        <Button className="mt-4" onClick={handleEmailClick}>
          Send Email Request
        </Button>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">What Happens Next?</h2>
        <p>After receiving your request, we will:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Verify the ownership of the account.</li>
          <li>Confirm the deletion of your data via email.</li>
          <li>Permanently delete your account and all associated data from our system.</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-4">
          Note: Some data may be retained if required by law or for legitimate business purposes.
        </p>
      </section>
    </div>
    </PageContainer>
  );
}
