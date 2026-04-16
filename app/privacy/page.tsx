"use client";

import PageContainer from "@/components/page-container";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  return (
    <PageContainer scrollable={true}>
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground">Last Updated: January 8, 2025</p>
      </div>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Introduction</h2>
        <p>
          Welcome to our SENFENG App. Your privacy is important to us, and we are
          committed to protecting any personal information you share with us.
          This policy explains how we collect, use, and safeguard your
          information.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Information We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Personal Information (e.g., name, email address).</li>
          <li>Usage Data (e.g., your interaction with the app).</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">How We Use Your Information</h2>
        <p>The information we collect is used to:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Enhance your experience with our app.</li>
          <li>Provide customer support.</li>
          <li>Improve our services.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Sharing Your Information</h2>
        <p>
          We do not sell or share your personal information with third parties,
          except as required by law or with your consent.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Data Security</h2>
        <p>
          We take reasonable steps to protect your information from
          unauthorized access or disclosure. However, no method of transmission
          over the internet is completely secure.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Access the personal information we hold about you.</li>
          <li>Request the correction or deletion of your data.</li>
          <li>Withdraw your consent for data usage at any time.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact
          us at:
        </p>
        <p className="font-medium text-blue-600 mt-1">laserzone.pk@gmail.com</p>
      </section>
    </div>
    </PageContainer>
  );
}
