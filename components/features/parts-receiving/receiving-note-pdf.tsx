import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import moment from "moment";
import type { ReactNode } from "react";

type ReceivingNoteData = {
  receiptId: number;
  receiptNumber: string;
  customerName: string;
  customerContact: string;
  customerLocation: string;
  machine: string;
  machineModel: string;
  partName: string;
  partModel: string;
  partQty: number;
  partSerial: string;
  warrantyStatus: string;
  conditions: string[];
  accessories: string;
  problem: string;
  deliveredBy: string;
  receivedBy: string;
  receivingDate: string;
  assignedTo: string;
  priority: string;
  expectedReturn: string | null;
  estimatedExpenses: number | string | null;
};

const navy = "#1e416e";
const ink = "#2e3a4d";
const line = "#bdcadb";
const shade = "#f2f5f8";
const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingHorizontal: 34,
    paddingBottom: 26,
    fontFamily: "Helvetica",
    fontSize: 8.2,
    color: ink,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: `1.4pt solid ${navy}`,
    paddingBottom: 12,
    marginBottom: 8,
  },
  brand: { color: navy, fontFamily: "Helvetica-Bold", fontSize: 15 },
  brandSmall: { fontSize: 10.5 },
  headerText: {
    marginTop: 3,
    color: "#64748b",
    fontSize: 7.1,
    lineHeight: 1.32,
  },
  headerRight: { alignItems: "flex-end" },
  documentTitle: {
    color: navy,
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  documentMeta: { fontFamily: "Helvetica-Bold", fontSize: 8.3 },
  muted: { color: "#6c7d95", fontSize: 7.1, marginTop: 5 },
  section: {
    marginTop: 10,
    borderLeft: `0.6pt solid ${line}`,
    borderRight: `0.6pt solid ${line}`,
    borderBottom: `0.6pt solid ${line}`,
  },
  sectionTitle: {
    backgroundColor: navy,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 8.4,
  },
  row: { flexDirection: "row" },
  cell: {
    minHeight: 23,
    borderTop: `0.6pt solid ${line}`,
    borderRight: `0.6pt solid ${line}`,
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  last: { borderRight: 0 },
  label: {
    backgroundColor: shade,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.7,
  },
  value: { fontSize: 8.1, lineHeight: 1.2 },
  valueBold: { fontSize: 8.1, fontFamily: "Helvetica-Bold", lineHeight: 1.2 },
  tall: { minHeight: 62 },
  signature: {
    minHeight: 60,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 5,
  },
  signatureTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.6,
    marginBottom: 18,
  },
  signatureLine: {
    borderTop: `0.6pt solid ${ink}`,
    width: "92%",
    textAlign: "center",
    paddingTop: 2,
    fontSize: 7,
  },
  terms: { fontSize: 6.2, color: "#677890", lineHeight: 1.35, marginTop: 5 },
  detach: {
    borderTop: "0.8pt dashed #72829a",
    marginTop: 9,
    paddingTop: 5,
    textAlign: "center",
    color: "#667890",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
  },
});

function Cell({
  children,
  width = 1,
  label = false,
  last = false,
  tall = false,
}: {
  children: ReactNode;
  width?: number;
  label?: boolean;
  last?: boolean;
  tall?: boolean;
}) {
  return (
    <View
      style={[
        styles.cell,
        { flex: width },
        label && styles.label,
        last && styles.last,
        tall && styles.tall,
      ]}
    >
      {children}
    </View>
  );
}
function Value({
  children,
  bold = false,
}: {
  children: ReactNode;
  bold?: boolean;
}) {
  return (
    <Text style={bold ? styles.valueBold : styles.value}>{children || ""}</Text>
  );
}
const date = (value: string | null) =>
  value ? moment(value).format("DD/MM/YYYY") : "____/____/______";
const tick = (active: boolean) => (active ? "[x]" : "[ ]");
const selected = (value: string, expected: string) =>
  value.toLowerCase() === expected.toLowerCase();

export default function ReceivingNotePdf({
  data,
}: {
  data: ReceivingNoteData;
}) {
  const receiptNo =
    data.receiptNumber ||
    `${moment(data.receivingDate).format("YYYYMM")}${data.receiptId}`;
  const warranty = data.warrantyStatus.toLowerCase().replaceAll("_", " ");
  const condition = (name: string) =>
    data.conditions.some((item) => item.toLowerCase().includes(name));
  const expense = Number(data.estimatedExpenses ?? 0);
  const turnaroundDays = data.expectedReturn
    ? Math.max(
        1,
        moment(data.expectedReturn)
          .startOf("day")
          .diff(moment(data.receivingDate).startOf("day"), "days") + 1,
      )
    : null;
  return (
    <Document
      title={`${receiptNo} Parts Receiving Note`}
      author="Senfeng Laser"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>
              SENFENG{" "}
              <Text style={styles.brandSmall}>
                LASER | Sales & Service Center
              </Text>
            </Text>
            <Text style={styles.headerText}>
              Street #2, Sharif Garden Daroghawala,{"\n"}Lahore, Punjab 54000,
              Pakistan{"\n"}Phone: +92 333 9180410{"\n"}Email:
              senfenglaserpakistan@gmail.com | Web: www.senfenglaserpk.com
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.documentTitle}>PARTS RECEIVING NOTE</Text>
            <Text style={styles.documentMeta}>
              No: {receiptNo} Date: {date(data.receivingDate)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            1. CUSTOMER & MACHINE INFORMATION
          </Text>
          <View style={styles.row}>
            <Cell label>
              <Value bold>Customer / Company:</Value>
            </Cell>
            <Cell width={1.6}>
              <Value>{data.customerName}</Value>
            </Cell>
            <Cell label>
              <Value bold>Contact Person & No:</Value>
            </Cell>
            <Cell width={1.4} last>
              <Value>{data.customerContact}</Value>
            </Cell>
          </View>
          <View style={styles.row}>
            <Cell label>
              <Value bold>Address / City:</Value>
            </Cell>
            <Cell width={1.6}>
              <Value>{data.customerLocation}</Value>
            </Cell>
            <Cell label>
              <Value bold>Machine Model & S/N:</Value>
            </Cell>
            <Cell width={1.4} last>
              <Value>
                {[data.machineModel, data.machine].filter(Boolean).join(" / ")}
              </Value>
            </Cell>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. PART DETAILS & FAULT DESCRIPTION
          </Text>
          <View style={styles.row}>
            <Cell label>
              <Value bold>Part Name / Description:</Value>
            </Cell>
            <Cell width={1.6}>
              <Value>{data.partName}</Value>
            </Cell>
            <Cell label>
              <Value bold>Part No. / Model:</Value>
            </Cell>
            <Cell width={1.4} last>
              <Value>{data.partModel}</Value>
            </Cell>
          </View>
          <View style={styles.row}>
            <Cell label>
              <Value bold>Quantity Received:</Value>
            </Cell>
            <Cell width={1.6}>
              <Value>
                {data.partQty
                  ? `${data.partQty} Pcs / Sets`
                  : "_____ Pcs / Sets"}
              </Value>
            </Cell>
            <Cell label>
              <Value bold>Warranty Status:</Value>
            </Cell>
            <Cell width={1.4} last>
              <Value>{`${tick(warranty.includes("in warranty"))} In Warranty   ${tick(warranty.includes("out of warranty"))} Out of Warranty\n${tick(warranty.includes("unknown"))} Unknown / Subject to Verification`}</Value>
            </Cell>
          </View>
          <View style={styles.row}>
            <Cell label>
              <Value bold>Condition on Arrival:</Value>
            </Cell>
            <Cell width={4} last>
              <Value>{`${tick(condition("normal"))} Normal Wear   ${tick(condition("damaged"))} Externally Damaged   ${tick(condition("overheated"))} Burnt / Overheated   ${tick(condition("incomplete"))} Incomplete / Disassembled\nAccessories Attached: ${data.accessories || "[ ] Cables   [ ] Connectors   [ ] Optics/Lens   [ ] Power Supply   [ ] Other: ________"}`}</Value>
            </Cell>
          </View>
          <View style={styles.row}>
            <Cell label>
              <Value bold>
                Reported Problem /{"\n"}Fault Description:{"\n\n"}(Provide
                detailed notes)
              </Value>
            </Cell>
            <Cell width={4} last tall>
              <Value>{data.problem}</Value>
            </Cell>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. LOGISTICS, WORK ASSIGNMENT & COST ESTIMATION
          </Text>
          <View style={styles.row}>
            <Cell label>
              <Value bold>Delivered By:</Value>
            </Cell>
            <Cell width={1.6}>
              <Value>{`${tick(selected(data.deliveredBy, "Self Handover"))} Self Handover   ${tick(selected(data.deliveredBy, "Courier"))} Courier\n${tick(selected(data.deliveredBy, "Company Vehicle"))} Company Vehicle\nContact: _________________________`}</Value>
            </Cell>
            <Cell label>
              <Value bold>Received By (Staff):</Value>
            </Cell>
            <Cell width={1.4} last>
              <Value>{`Name: ${data.receivedBy || "________________________"}\n\nDate & Time: ${moment(data.receivingDate).format("DD/MM/YYYY HH:mm")}\nSig: ___________________________`}</Value>
            </Cell>
          </View>
          <View style={styles.row}>
            <Cell label>
              <Value bold>Assigned Technician:</Value>
            </Cell>
            <Cell width={1.6}>
              <Value>
                {data.assignedTo
                  ? `Eng. ${data.assignedTo}`
                  : "Eng. _________________________"}
              </Value>
            </Cell>
            <Cell label>
              <Value bold>Priority Level:</Value>
            </Cell>
            <Cell width={1.4} last>
              <Value>{`${tick(selected(data.priority, "normal"))} Normal   ${tick(selected(data.priority, "urgent"))} Urgent   ${tick(selected(data.priority, "critical"))} Critical`}</Value>
            </Cell>
          </View>
          <View style={styles.row}>
            <Cell label>
              <Value bold>Est. Turnaround Time:</Value>
            </Cell>
            <Cell width={1.6}>
              <Value>
                {turnaroundDays === null
                  ? "_____ Working Days"
                  : `${turnaroundDays} Working Days`}
              </Value>
            </Cell>
            <Cell label>
              <Value bold>Expected Return Date:</Value>
            </Cell>
            <Cell width={1.4} last>
              <Value>{date(data.expectedReturn)}</Value>
            </Cell>
          </View>
          <View style={styles.row}>
            <Cell label>
              <Value bold>Cost Estimation:</Value>
            </Cell>
            <Cell width={1.6}>
              <Value>{`Est. Repair: Rs. ${expense.toLocaleString()}\n${tick(expense === 0 && warranty.includes("in warranty"))} Free Inspection / Under Warranty`}</Value>
            </Cell>
            <Cell label>
              <Value bold>Advance Payment:</Value>
            </Cell>
            <Cell width={1.4} last>
              <Value>
                Amount: ____________{"\n"}Method: [ ] Cash [ ] Card [ ] Wire
              </Value>
            </Cell>
          </View>
        </View>

        <View style={[styles.section, { marginTop: 11 }]}>
          <View style={styles.row}>
            {[
              [
                "Customer Handover Signature",
                "Name & Sign:                         Date",
              ],
              [
                "Service Receiver Signature",
                "Name & Sign:                         Date",
              ],
              [
                "Supervisor Approval (Optional)",
                "Name & Sign:                         Date",
              ],
            ].map(([title, lineText], index) => (
              <Cell key={title} last={index === 2}>
                <View style={styles.signature}>
                  <Text style={styles.signatureTitle}>{title}</Text>
                  <Text style={styles.signatureLine}>{lineText}</Text>
                </View>
              </Cell>
            ))}
          </View>
        </View>
        <Text style={styles.terms}>
          <Text style={{ fontFamily: "Helvetica-Bold", color: navy }}>
            TERMS & CONDITIONS:{" "}
          </Text>
          1. Initial cost estimate is preliminary and subject to modification
          upon detailed engineering inspection. 2. Parts not collected within 30
          days of completion notice may incur storage fees or disposal as per
          policy. 3. SENFENG is not liable for indirect data loss or
          pre-existing unrecorded flaws. For status inquiries, call service
          hotline.
        </Text>
        <Text style={styles.detach}>
          ✂ ----------------------- DETACH HERE - CUSTOMER ACKNOWLEDGMENT
          RECEIPT ----------------------- ✂
        </Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            SENFENG LASER — CUSTOMER RECEIPT STUB (PARTS RECEIVING NOTE)
          </Text>
          <View style={styles.row}>
            <Cell label>
              <Value bold>Receiving Note No:</Value>
            </Cell>
            <Cell width={1.2}>
              <Value>{receiptNo}</Value>
            </Cell>
            <Cell label width={0.85}>
              <Value bold>Date Received:</Value>
            </Cell>
            <Cell width={1.05} last>
              <Value>{date(data.receivingDate)}</Value>
            </Cell>
          </View>
          <View style={styles.row}>
            <Cell label>
              <Value bold>Customer / Company:</Value>
            </Cell>
            <Cell width={1.2}>
              <Value>{data.customerName}</Value>
            </Cell>
            <Cell label width={0.85}>
              <Value bold>Part Description / Qty:</Value>
            </Cell>
            <Cell width={1.05} last>
              <Value>{`${data.partName} / ${data.partQty}`}</Value>
            </Cell>
          </View>
          <View style={styles.row}>
            <Cell label>
              <Value bold>Est. Completion Date:</Value>
            </Cell>
            <Cell width={1.2}>
              <Value>{date(data.expectedReturn)}</Value>
            </Cell>
            <Cell label width={0.85}>
              <Value bold>Received By (Sign):</Value>
            </Cell>
            <Cell width={1.05} last>
              <Value>________________________</Value>
            </Cell>
          </View>
        </View>
      </Page>
    </Document>
  );
}
