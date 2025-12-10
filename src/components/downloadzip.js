import { pdf, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import moment from 'moment';

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    lineHeight: 1.5,
  },

  section: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
  },

  heading: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },

  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },

  label: {
    width: '30%',
    fontWeight: 'bold',
    color: '#374151',
  },

  value: {
    width: '70%',
    color: '#111827',
  },

  paymentItem: {
    marginBottom: 6,
    padding: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
});

const CustomerPDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.heading}>Customer Information</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{data.customer.name}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{data.customer.email}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Group</Text>
          <Text style={styles.value}>{data.customer.customer_group}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Industry</Text>
          <Text style={styles.value}>{data.customer.industry}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Owner</Text>
          <Text style={styles.value}>{data.customer.owner}</Text>
        </View>
      </View>

      {/* Machine Info */}
      <View style={styles.section}>
        <Text style={styles.heading}>Machine Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Serial No</Text>
          <Text style={styles.value}>{data.machine.serial_no}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Power</Text>
          <Text style={styles.value}>{data.machine.power}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Source</Text>
          <Text style={styles.value}>{data.machine.source}</Text>
        </View>
      </View>

      {/* Payments */}
      <View style={styles.section}>
        <Text style={styles.heading}>Payment History</Text>

        {data.machine.payments.map((p, index) => (
          <View key={index} style={styles.paymentItem}>
            <Text>
              <Text style={{ fontWeight: 'bold' }}>Transaction #{p.track}</Text>
              {'  '}| {p.amount} | {p.mode} |{' '}
              {p.transaction_date
                ? moment(p.transaction_date).format('YYYY-MM-DD')
                : '-'}
            </Text>
          </View>
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
  const paymentsFolder = zip.folder('Payments');

for (const payment of data.machine.payments) {
  try {
    let imageUrl = payment.image;

    if (!imageUrl.startsWith('https://')) {
      const imageRef = ref(storage, imageUrl);
      imageUrl = await getDownloadURL(imageRef);
    }

    const res = await fetch(imageUrl);
    const blob = await res.blob();

    const ext = imageUrl.split('.').pop()?.split('?')[0] || 'png';
    paymentsFolder.file(`payment_${payment.track}.png`, blob);

  } catch (error) {
    console.warn(`Could not fetch image for track ${payment.track}`, error);
  }
}

  const contractImages = data.machine.contract_images_png || [];

  if (contractImages.length) {
    const contractFolder = zip.folder('Contract');

    for (let i = 0; i < contractImages.length; i++) {
      try {
        let imageUrl = contractImages[i];

        // If not a full URL, resolve via Firebase
        if (!imageUrl.startsWith('https://')) {
          const imageRef = ref(storage, imageUrl);
          imageUrl = await getDownloadURL(imageRef);
        }

        const res = await fetch(imageUrl);
        const blob = await res.blob();

        // Preserve extension if possible
        const ext = imageUrl.split('.').pop()?.split('?')[0] || 'png';
        contractFolder.file(`contract_${i + 1}.png`, blob);
      } catch (error) {
        console.warn(`Could not fetch contract image ${i + 1}`, error);
      }
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${folderName}.zip`);
  return true
};
