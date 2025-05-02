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
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 20,
        padding: "0 10px",
    },
    summaryBox: {
        width: "50%",
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


const AccountsPdf = ({ data, headings, total }) => {

    return (
        <Document>
            <Page style={{
                padding: 20,
                width: '100%',
            }}>
                <Header />
                <View style={{ padding: '5px', borderWidth: 2, borderColor: '#0072BC', borderRadius: 20, paddingTop: 20 }}>
                    <View style={{ flexDirection: 'row', width: '100%' }}>

                        <FormField data={headings} />
                        <View style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
                            <CompanyDetails />
                           
                        </View>

                    </View>

                    {/* Invoice Table */}
                    <View style={{ width: '100%', marginTop:10 }}>
                        <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: '#0072BC', border: '1px solid #D1D5DB', }}>
                            {['EMPLOYEE', 'SALARY'].map((header, index) => (
                                <View key={index} style={[{ textAlign: 'center', display: 'flex', justifyContent: 'center', height: 25, paddingLeft: 5, borderLeftWidth: index !== 0 && 1, borderLeftColor: "#D1D5DB", flex:1 }]}>
                                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: 'white' }}>{header}</Text>
                                </View>
                            ))}
                        </View>

                        {data?.map((item, index) => (
                            <View key={index} style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: index % 2 === 0 ? "#f1f1f1" : "white", border: '1px solid #D1D5DB', borderTopWidth: index !== 0 && 0 }}>
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, flex:1 }]}>
                                    <Text style={{ fontSize: 9, color: 'black' }}>{item?.name}</Text>
                                </View>
                                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5,  borderLeftWidth: 1, borderLeftColor: "#D1D5DB", flex:1 }]}>
                                    <Text style={{ fontSize: 9, color: 'black' }}>{formatCurrency(Number(item?.payable) || 0)}</Text>
                                </View>
                                
                            </View>
                        ))}

                       
                    </View>
                    <View style={styles.summaryContainer}>
                                <View style={[styles.summaryBox, styles.totalAmount]}>
                                    <Text style={styles.summaryLabel}>Total Payable</Text>
                                    <Text style={styles.summaryValue}>Rs. {formatCurrency(Number(total || 0))}</Text>
                                </View>
                            </View>
                    <Disclaimer />

                </View>
                <Footer />
            </Page>
        </Document>
    );
};




const FormField = ({ data }) => {
    return (
        <View style={{ marginBottom: 5, flex: 1 }}>
            {[
                'Salary Month',
            ].map((label, index) => (
                <View key={label} style={{ display: 'flex', flexDirection: 'column', marginBottom: 5 }}>
                    <Text style={{ color: '#7F7F7FFF', marginLeft: 10, fontFamily: 'Helvetica-Bold', fontSize: 11 }}>
                        {label}:
                    </Text>
                    <View
                        style={{
                            backgroundColor: '#dce4f1',
                            paddingLeft: 10,
                            border: '1px solid #E5E7EB',
                            maxWidth: '360px',
                            height: 20,
                            fontSize: 9,
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <Text>
                            {index === 0
                                ? moment(data?.salary_month).format("MMMM YYYY")
                                : ''}
                        </Text>
                    </View>
                </View>
            ))}
        </View>

    )
}

const CompanyDetails = () => {

    return (
        <View style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'flex-end' }}>
            <View style={{ marginRight: 10, gap: 0, fontSize: '10px', }}>
                <Text style={{
                    fontFamily: 'Helvetica-Bold', color: '#0072BC',
                    fontSize: 12,
                }}>SENFENG PAKISTAN</Text>
                <Text style={{ color: '#7F7F7FFF', fontWeight: '600', fontSize: 10 }}>Street# 2, Sharif Garden Daroghawala,</Text>
                <Text style={{ color: '#7F7F7FFF', fontWeight: '600', fontSize: 10 }}>Lahore, Punjab 54000, Pakistan</Text>
                <Text style={{ color: '#7F7F7FFF', fontWeight: '600', fontSize: 10 }}>senfenglaserpakistan@gmail.com</Text>
            </View>
        </View>
    )
}

const Header = () => {
    return (
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexDirection: 'row' }}>
            {/* <Text fontSize={60} color={'#0072BC'} fontWeight={'800'}>SENFENG</Text> */}
            <Image src={"/logo.png"} alt="My Local Image" style={{ height: '40px', width: '200px' }} />
            <div style={{ backgroundColor: '#0072BC', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginRight: 70, width: '150px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
                <Text style={{ fontSize: '12px', fontFamily: 'Helvetica-Bold', color: 'white', }}>
                    TOTAL SALARIES
                </Text>
            </div>
        </View>
    )
}

const Disclaimer = () => {
    return (
        <View style={{ color: '#0072BC', fontWeight: '600', fontSize: 10, width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
            <Text style={{ textAlign: 'center' }}>DISCLAIMER: This is an auto generated slip and does not require a signature.</Text>
        </View>
    )
}

const Footer = () => {
    return (
        < View style={{ paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0072BC', flexDirection: 'row' }} >
            <View style={{ fontWeight: '600', fontSize: 18, display: 'flex', alignItems: 'center', gap: 5, flexDirection: 'row' }}>
                <Svg viewBox='0 0 48 48' width="15" height="15">
                    <Path fill='#0072bc' d='M13.25 21.59a30.12 30.12 0 0 0 13.18 13.17l4.4-4.41c.55-.55 1.34-.71 2.03-.49C35.1 30.6 37.51 31 40 31c1.11 0 2 .89 2 2v7c0 1.11-.89 2-2 2C21.22 42 6 26.78 6 8a2 2 0 0 1 2-2h7c1.11 0 2 .89 2 2 0 2.49.4 4.9 1.14 7.14.22.69.06 1.48-.49 2.03l-4.4 4.42z' />
                </Svg>
                <Text style={{ fontSize: 10 }}>+92 333 9180410</Text>
            </View>
            <View style={{ fontWeight: '600', fontSize: 18, display: 'flex', alignItems: 'center', gap: 5, flexDirection: 'row' }}>
                <Svg viewBox='0 0 496 512' width="15" height="15">
                    <Path fill='#0072bc' d='M336.5 160C322 70.7 287.8 8 248 8s-74 62.7-88.5 152h177zM152 256c0 22.2 1.2 43.5 3.3 64h185.3c2.1-20.5 3.3-41.8 3.3-64s-1.2-43.5-3.3-64H155.3c-2.1 20.5-3.3 41.8-3.3 64zm324.7-96c-28.6-67.9-86.5-120.4-158-141.6 24.4 33.8 41.2 84.7 50 141.6h108zM177.2 18.4C105.8 39.6 47.8 92.1 19.3 160h108c8.7-56.9 25.5-107.8 49.9-141.6zM487.4 192H372.7c2.1 21 3.3 42.5 3.3 64s-1.2 43-3.3 64h114.6c5.5-20.5 8.6-41.8 8.6-64s-3.1-43.5-8.5-64zM120 256c0-21.5 1.2-43 3.3-64H8.6C3.2 212.5 0 233.8 0 256s3.2 43.5 8.6 64h114.6c-2-21-3.2-42.5-3.2-64zm39.5 96c14.5 89.3 48.7 152 88.5 152s74-62.7 88.5-152h-177zm159.3 141.6c71.4-21.2 129.4-73.7 158-141.6h-108c-8.8 56.9-25.6 107.8-50 141.6zM19.3 352c28.6 67.9 86.5 120.4 158 141.6-24.4-33.8-41.2-84.7-50-141.6h-108z' />
                </Svg>
                <Text style={{ fontSize: 10 }}>www.senfenglaserpk.com</Text>
            </View>
        </View >
    )
}



function formatCurrency(number) {
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
    }).format(number);
}

export default AccountsPdf;
