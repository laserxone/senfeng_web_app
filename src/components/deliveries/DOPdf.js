import { Document, Image, Page, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import moment from 'moment';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: "Helvetica",
    },
    container: {
        border: "1px solid #1a75a5",
        borderRadius: 10,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    companyName: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#1a75a5",
        marginLeft: 10,
    },
    accountStatementBox: {
        backgroundColor: "#1a75a5",
        color: "white",
        padding: 10,
        borderRadius: 5,
        fontSize: 16,
        fontWeight: "bold",
    },
    formContainer: {
        flexDirection: "row",
        padding: 10,
    },
    formLeft: {
        width: "50%",
    },
    formRight: {
        width: "50%",
    },
    formRow: {
        marginBottom: 10,
    },
    formLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    formField: {
        backgroundColor: "#e6f0f7",
        padding: 8,
        fontSize: 10,
        borderRadius: 2,
    },
    companyInfo: {
        fontSize: 10,
        marginBottom: 5,
    },
    companyTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1a75a5",
        marginBottom: 5,
    },
    summaryContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        marginBottom: 20,
        padding: "0 10px",
    },
    summaryBox: {
        width: "30%",
        padding: 10,
        borderRadius: 10,
        justifyContent: 'space-between'
    },
    summaryLabel: {
        fontSize: 14,
        color: "#1a75a5",
        textAlign: "center",
        marginBottom: 10,
    },
    summaryValue: {
        fontSize: 10,
        textAlign: "center",
    },
    totalAmount: {
        backgroundColor: "#EFEFEFFF",
        border: "1px solid #ccc",
    },
    received: {
        backgroundColor: "#c1e6c1",
    },
    balance: {
        backgroundColor: "#f7c4c4",
    },
    table: {
        margin: "0 10px",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#1a75a5",
        color: "white",
        padding: 8,
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
    },
    tableRow: {
        flexDirection: "row",
        padding: 8,
        fontSize: 10,
        borderBottom: "1px solid #e0e0e0",
    },
    tableRowEven: {
        backgroundColor: "#f5f5f5",
    },
    tableCell: {
        flex: 1,
        textAlign: "center",
    },
    disclaimer: {
        fontSize: 10,
        color: "#666",
        textAlign: "center",
        margin: "20px 10px",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        margin: "0 10px",
    },
    footerItem: {
        flexDirection: "row",
        alignItems: "center",
        fontSize: 12,
        color: "#1a75a5",
    },
    footerIcon: {
        width: 15,
        height: 15,
        marginRight: 5,
    },
})



const DOPDF = ({ data }) => {

    return (
        <Document>
            <Page style={{
                padding: 20,
                width: '100%',
            }}>
                {/* Header */}
                <Header />
                <View style={{ padding: '5px', borderWidth: 2, borderColor: '#0072BC', borderRadius: 20, paddingTop: 20 }}>
                    <View style={{ flexDirection: 'row', width: '100%' }}>

                        <FormField data={data} />
                        <View style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
                            <CompanyDetails />
                            <View style={styles.summaryContainer}>
                                <View style={[styles.summaryBox, styles.totalAmount]}>
                                    <Text style={styles.summaryLabel}>Total</Text>
                                    <Text style={styles.summaryValue}>Rs. {formatCurrency(data?.total || 0)}</Text>
                                </View>

                                <View style={[styles.summaryBox, styles.received]}>
                                    <Text style={styles.summaryLabel}>Received</Text>
                                    <Text style={styles.summaryValue}>Rs. {formatCurrency(data?.received || 0)}</Text>
                                </View>

                                <View style={[styles.summaryBox, styles.balance]}>
                                    <Text style={styles.summaryLabel}>Balance</Text>
                                    <Text style={styles.summaryValue}>Rs. {formatCurrency((data?.total || 0) - (data?.received || 0))}</Text>
                                </View>
                            </View>
                        </View>

                    </View>

                    {/* Invoice Table */}
                    <View style={{ width: '100%' }}>
                        <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: '#0072BC', border: '1px solid #D1D5DB', }}>
                            {['DATE', 'TID', 'BANK', 'MODE', 'PAYMENT', 'BALANCE'].map((header, index) => (
                                <View key={index} style={[{ textAlign: 'center', display: 'flex', justifyContent: 'center', height: 25, paddingLeft: 5, width: 100, borderLeftWidth: index !== 0 && 1, borderLeftColor: "#D1D5DB" }]}>
                                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: 'white' }}>{header}</Text>
                                </View>
                            ))}
                        </View>

                        {data?.payments && data?.payments.map((item, index) => (
                            <View key={index} style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: index % 2 === 0 ? "#f1f1f1" : "white", border: '1px solid #D1D5DB', borderTopWidth: index !== 0 && 0 }}>
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, }]}>
                                    <Text style={{ fontSize: 9, color: 'black' }}>{item?.transaction_date ? moment(item?.transaction_date).format("YYYY-MM-DD") : null}</Text>
                                </View>
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]}>
                                    <Text style={{ fontSize: 9, color: 'black' }}>{truncateText(item?.note || "")}</Text>
                                </View>
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]}>
                                    <Text style={{ fontSize: 9, color: 'black' }}>{truncateText(item?.received_by || "")}</Text>
                                </View>
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]}>
                                    <Text style={{ fontSize: 9, color: 'black' }}>{item?.mode}</Text>
                                </View>
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]}>
                                    <Text style={{ fontSize: 9, color: 'black' }}>{formatCurrency(item?.amount || 0)}</Text>
                                </View>
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]}>
                                    <Text style={{ fontSize: 9, color: 'black' }}>{formatCurrency(item?.balance || 0)}</Text>
                                </View>
                            </View>
                        ))}

                        {data?.payments && data?.payments.length <= 20 && [...Array(20 - data?.payments.length)].map((_, i) => (
                            <View key={i} style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: i % 2 === 0 ? "#f1f1f1" : "white", border: '1px solid #D1D5DB', borderTopWidth: i !== 0 && 0 }}>
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, }]}>
                                    <Text style={{ fontSize: 10, color: 'black' }}></Text>
                                </View>
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]} />
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]} />
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]} />
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]} />
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]} />
                            </View>

                        ))}
                    </View>





                    <Disclaimer />

                </View>
                <Footer />
            </Page>
        </Document>
    );
};

export default DOPDF