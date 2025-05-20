import { pdf, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import moment from 'moment';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 12, fontFamily: 'Helvetica' },
  section: { marginBottom: 16 },
  heading: { fontSize: 16, marginBottom: 8, fontWeight: 'bold' },
  line: { marginBottom: 4 },
});

const CustomerPDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.heading}>Customer Information</Text>
        <Text style={styles.line}>Name: {data.customer.name}</Text>
        <Text style={styles.line}>Email: {data.customer.email}</Text>
        <Text style={styles.line}>Group: {data.customer.customer_group}</Text>
        <Text style={styles.line}>Industry: {data.customer.industry}</Text>
        <Text style={styles.line}>Owner: {data.customer.owner}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Machine</Text>
        <Text style={styles.line}>Serial: {data.machine.serial_no}</Text>
        <Text style={styles.line}>Power: {data.machine.power}</Text>
        <Text style={styles.line}>Source: {data.machine.source}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Payments</Text>
        {data.machine.payments.map((p, index) => (
          <Text key={index} style={styles.line}>
            Transaction {p.track}: {p.amount} - {p.mode} - {p.transaction_date ? moment(p.transaction_date).format('YYYY-MM-DD') : '-'}
          </Text>
        ))}
      </View>
    </Page>
  </Document>
);

export const downloadCustomerZip = async (data) => {
  const customerName = data.customer.name || data.customer.owner || 'Customer';
  const folderName = customerName.replace(/\s+/g, '_');
  const zip = new JSZip();
  const pdfBlob = await pdf(<CustomerPDF data={data} />).toBlob();
  zip.file('info.pdf', pdfBlob);

  const storage = getStorage();
  const paymentFolder = zip.folder('payment');

  for (const payment of data.machine.payments) {
    const trackFolder = paymentFolder.folder(String(payment.track));
    try {
      let imageUrl = payment.image;
      if (!imageUrl.includes('https://')) {
        const imageRef = ref(storage, payment.image);
        imageUrl = await getDownloadURL(imageRef);
      }

      const res = await fetch(imageUrl);
      const blob = await res.blob();
      trackFolder.file('image.png', blob);
    } catch (error) {
      console.warn(`Could not fetch image for track ${payment.track}`, error);
    }
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${folderName}.zip`);
  return true
};
