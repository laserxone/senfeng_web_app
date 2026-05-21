"use client"

import { Colors } from "@/constants/data"
import { QuotationData } from "@/lib/types"
import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer"


const MainColor = '#1e3a8a'

const styles = StyleSheet.create({
    bannerLeft: {
        flex: 1,
    },
    page: {
        backgroundColor: "#fff",
        fontFamily: "Helvetica",
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 6,
    },

    tagline: {
        fontSize: 7,
        color: "#1e3a8a",
        marginTop: 1,
        letterSpacing: 0.8,
    },

    headerRight: {
        alignItems: "flex-end",
        fontSize: 7,
        color: "#1e3a8a",
        gap: 2,
    },

    headerLink: {
        marginBottom: 2,
        flexDirection:'row',
        alignItems:'center'
    },

    banner: {
        backgroundColor: "#1e3a8a",
        paddingHorizontal: 18,
        paddingVertical: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    bannerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
        letterSpacing: 1.3,
    },

    bannerSubtitle: {
        fontSize: 8,
        color: "#fff",
        marginTop: 3,
        letterSpacing: 0.6,
    },

    bannerRight: {
        backgroundColor: "#fff",
        padding: 8,
        borderRadius: 3,
        width: 135,
    },

    bannerField: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
        gap: 6,
    },

    bannerFieldLast: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    bannerFieldLabel: {
        fontSize: 7,
        color: "#1e3a8a",
        fontWeight: "bold",
    },

    bannerFieldValue: {
        fontSize: 8,
        color: "#374151",
        marginTop: 1,
    },

    machineSection: {
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 2,
    },

    machineRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },

    machineImage: {
        width: 100,
        objectFit: "contain",
    },
    machineImageSmall: {
        width: 80,
        objectFit: "contain",
    },

    centerBrand: {
        alignItems: "center",
        paddingVertical: 3,
    },

    centerCategories: {
        flexDirection: "row",
        marginTop: 3,
        gap: 4,
    },

    categoryText: {
        fontSize: 6,
        color: Colors.button,
        letterSpacing: 0.5,
    },

    categorySeparator: {
        fontSize: 6,
        color: Colors.button,
        marginHorizontal: 1,
    },

    sectionContainer: {
        paddingHorizontal: 18,
        marginTop: 8,
    },

    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: "#1e3a8a",
        paddingBottom: 3,
    },

    sectionIcon: {
        width: 20,
        height: 20,
        marginRight: 7,
        backgroundColor: "#1e3a8a",
        borderRadius: 3,
        justifyContent: "center",
        alignItems: "center",
    },

    sectionTitle: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#1e3a8a",
        letterSpacing: 0.8,
    },

    quotationTable: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#DCE3EF",
        marginTop: 6,
    },

    quotationRow: {
        flexDirection: "row",
        height: 26,
        borderBottomWidth: 1,
        borderBottomColor: "#DCE3EF",
    },

    iconCell: {
        width: 34,
        alignItems: "center",
        justifyContent: "center",
        borderRightWidth: 1,
        borderRightColor: "#DCE3EF",
    },

    labelCell: {
        width: 190,
        justifyContent: "center",
        paddingHorizontal: 8,
        borderRightWidth: 1,
        borderRightColor: "#DCE3EF",
    },

    valueCell: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 10,
    },

    infoIcon: {
        width: 11,
        height: 11,
        objectFit: "contain",
    },

    tableLabel: {
        fontSize: 8,
        fontWeight: 700,
        color: "#07164A",
    },

    tableValue: {
        fontSize: 8,
        color: "#5B6480",
    },

    summaryTable: {
        marginTop: 6,
        borderWidth: 1,
        borderColor: "#DCE3EF",
    },

    summaryRow: {
        flexDirection: "row",
        minHeight: 24,
        borderBottomWidth: 1,
        borderBottomColor: "#DCE3EF",
        alignItems: "center",
        paddingHorizontal: 10,
    },

    summaryLabel: {
        width: 150,
        fontSize: 8,
        fontWeight: "bold",
        color: "#07164A",
    },

    summaryValue: {
        flex: 1,
        fontSize: 8,
        color: "#5B6480",
    },

    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 4,
        paddingBottom: 10,
    },

    footerTopLine: {
        height: 3,
        backgroundColor: "#0B3B8F",
        marginBottom: 8,
    },

    footerContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
    },

    footerLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },

    qrCode: {
        width: 58,
        height: 58,
        marginRight: 14,
    },

    footerCompanyInfo: {
        flex: 1,
    },

    footerCompanyName: {
        fontSize: 8,
        fontWeight: "bold",
        color: "#0B2B66",
        marginBottom: 8,
    },

    footerInfoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 5,
    },

    footerIcon: {
        width: 10,
        height: 10,
        marginRight: 8,
        marginTop: 1,
    },

    footerText: {
        fontSize: 8,
        color: "#1F2A44",
        lineHeight: 1.35,
    },

    footerDivider: {
        width: 1,
        height: 60,
        backgroundColor: "#C9D3E3",
        marginHorizontal: 18,
    },

    footerRight: {
        flex: 1,
    },

    noteHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },

    noteIcon: {
        width: 12,
        height: 12,
        marginRight: 8,
    },

    noteTitle: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#0B2B66",
    },

    noteText: {
        fontSize: 8,
        color: "#1F2A44",
        lineHeight: 1.35,
    },
})

interface QuotationPDFProps {
    data: QuotationData
}

export function QuotationPDF({ data }: QuotationPDFProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return "DD-MMM-YYYY"
        const date = new Date(dateString)
        const day = date.getDate().toString().padStart(2, "0")
        const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase()
        const year = date.getFullYear()
        return `${day}-${month}-${year}`
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Image src="/logo.png" style={{ width: 200, objectFit: 'contain' }} />
                        <Text style={styles.tagline}>PIONEERING INTELLIGENT MANUFACTURING</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <View style={styles.headerLink}>
                            <Image src={"/png/globe.png"} style={{width:10, height:10, marginRight:4}}/>
                            <Text>https://senfenglaserpk.com/</Text>
                        </View>
                        <View style={styles.headerLink}>
  <Image src={"/png/mail.png"} style={{width:10, height:10, marginRight:4}}/>
                            <Text>info@senfenglaserpk.com</Text>
                        </View>
                    </View>
                </View>

                {/* Blue Banner */}
                <View style={styles.banner}>
                    <View style={styles.bannerLeft}>
                        <Text style={styles.bannerTitle}>MACHINE QUOTATION</Text>
                        <Text style={styles.bannerSubtitle}>TECHNICAL AND COMMERCIAL PROPOSAL</Text>
                    </View>
                    <View style={styles.bannerRight}>
                        <View style={styles.bannerField}>
                            <Image
                                src="/png/file-text.png"
                                style={{ width: 13, height: 13 }}
                            />
                            <View>
                                <Text style={styles.bannerFieldLabel}>Quotation No.</Text>
                                <Text style={styles.bannerFieldValue}>{data.quotationNo || "0000-0000"}</Text>
                            </View>
                        </View>
                        <View style={styles.bannerFieldLast}>
                            <Image
                                src="/png/calendar-days.png"
                                style={{ width: 13, height: 13 }}
                            />
                            <View>
                                <Text style={styles.bannerFieldLabel}>Date</Text>
                                <Text style={styles.bannerFieldValue}>{formatDate(data.date)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Machine Images - Top Row */}
                <View style={styles.machineSection}>
                    <View style={styles.machineRow}>
                        <Image src="/machines/1.png?height=55&width=90" style={styles.machineImage} />
                        <Image src="/machines/2.png?height=55&width=90" style={styles.machineImage} />
                        <Image src="/machines/3.png?height=55&width=90" style={styles.machineImage} />
                        <Image src="/machines/4.png?height=55&width=90" style={styles.machineImage} />
                    </View>
                    <View style={styles.machineRow}>
                        <Image src="/machines/5.png?height=50&width=80" style={styles.machineImageSmall} />
                        <View style={styles.centerBrand}>
                            <Image src="/logo.png" style={{ width: 250, objectFit: 'contain' }} />
                            <View style={styles.centerCategories}>
                                <Text style={styles.categoryText}>LASER</Text>
                                <Text style={styles.categorySeparator}>|</Text>
                                <Text style={styles.categoryText}>WELDING</Text>
                                <Text style={styles.categorySeparator}>|</Text>
                                <Text style={styles.categoryText}>CUTTING</Text>
                                <Text style={styles.categorySeparator}>|</Text>
                                <Text style={styles.categoryText}>CLEANING</Text>
                                <Text style={styles.categorySeparator}>|</Text>
                                <Text style={styles.categoryText}>BENDING</Text>
                                <Text style={styles.categorySeparator}>|</Text>
                                <Text style={styles.categoryText}>AUTOMATION</Text>
                            </View>
                        </View>
                        <Image src="/machines/6.png?height=50&width=80" style={styles.machineImageSmall} />
                    </View>
                    <View style={styles.machineRow}>
                        <Image src="/machines/7.png?height=50&width=80" style={styles.machineImage} />
                        <Image src="/machines/8.png?height=50&width=80" style={styles.machineImage} />
                        <Image src="/machines/9.png?height=50&width=80" style={styles.machineImage} />
                        <Image src="/machines/10.png?height=50&width=80" style={styles.machineImage} />
                        <Image src="/machines/11.png?height=50&width=80" style={styles.machineImage} />
                    </View>
                </View>

                {/* Quotation For Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { justifyContent: "center", alignItems: "center" }]}>
                            <Image
                                src="/png/user.png"
                                style={{ width: 13, height: 13, }}
                            />
                        </View>
                        <Text style={styles.sectionTitle}>QUOTATION FOR</Text>
                    </View>
                    <View style={styles.quotationTable}>
                        {[
                            {
                                icon: "/png/building.png",
                                label: "Customer / Company Name",
                                value: data.customerName || "Enter customer or company name",
                            },
                            {
                                icon: "/png/users.png",
                                label: "Contact Person",
                                value: data.contactPerson || "Enter contact person",
                            },
                            {
                                icon: "/png/phone.png",
                                label: "Contact Number",
                                value: data.contactNumber || "Enter contact number",
                            },
                            {
                                icon: "/png/mail.png",
                                label: "Email Address",
                                value: data.email || "Enter email address",
                            },
                        ].map((item, index) => (
                            <View key={index} style={[
                                styles.quotationRow,
                                index === 3 ? { borderBottomWidth: 0 } : {},
                            ]}>
                                <View style={styles.iconCell}>
                                    <Image src={item.icon} style={styles.infoIcon} />
                                </View>

                                <View style={styles.labelCell}>
                                    <Text style={styles.tableLabel}>{item.label}</Text>
                                </View>

                                <View style={styles.valueCell}>
                                    <Text style={styles.tableValue}>{item.value}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>


                {/* Quotation Summary Section */}
                <View style={[styles.sectionContainer, { marginTop: 15 }]}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { justifyContent: "center", alignItems: "center" }]}>
                            <Image
                                src="/png/file-spreadsheet.png"
                                style={{ width: 13, height: 13 }}
                            />
                        </View>
                        <Text style={styles.sectionTitle}>QUOTATION SUMMARY</Text>
                    </View>
                    <View style={styles.summaryTable}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Machine Type</Text>
                            <Text style={styles.summaryValue}>{data.machineType || "Enter machine type"}</Text>
                        </View>
                        <View style={[styles.summaryRow, { backgroundColor: "#f9fafb" }]}>
                            <Text style={styles.summaryLabel}>Machine Power</Text>
                            <Text style={styles.summaryValue}>{data.machinePower || "Enter machine power"}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Price of Machine</Text>
                            <Text style={styles.summaryValue}>{data.priceOfMachine || "Enter price"}</Text>
                        </View>
                        <View style={[styles.summaryRow, { backgroundColor: "#f9fafb" }]}>
                            <Text style={styles.summaryLabel}>Validity</Text>
                            <Text style={styles.summaryValue}>{data.validity || "Enter validity period"}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Payment Terms</Text>
                            <Text style={styles.summaryValue}>{data.paymentTerms || "Enter payment terms"}</Text>
                        </View>
                        <View style={[styles.summaryRow, { backgroundColor: "#f9fafb" }]}>
                            <Text style={styles.summaryLabel}>Delivery Time</Text>
                            <Text style={styles.summaryValue}>{data.deliveryTime || "Enter delivery time"}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerTopLine} />

                    <View style={styles.footerContent}>
                        <View style={styles.footerLeft}>
                            <Image src="/png/qr.jpeg" style={styles.qrCode} />

                            <View style={styles.footerCompanyInfo}>
                                <Text style={styles.footerCompanyName}>
                                    JINAN SENFENG LASER TECHNOLOGY CO., LTD.
                                </Text>

                                <View style={styles.footerInfoRow}>
                                    <Image src="/png/map-pin.png" style={styles.footerIcon} />
                                    <Text style={styles.footerText}>
                                        No. 6666, East Industrial Zone, Jinan,{"\n"}
                                        Shandong, China
                                    </Text>
                                </View>

                                <View style={styles.footerInfoRow}>
                                    <Image src="/png/phone.png" style={styles.footerIcon} />
                                    <Text style={styles.footerText}>+86 531 8877 6878</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.footerDivider} />

                        <View style={styles.footerRight}>
                            <View style={styles.noteHeader}>
                                <Image src="/png/info.png" style={styles.noteIcon} />
                                <Text style={styles.noteTitle}>NOTE</Text>
                            </View>

                            <Text style={styles.noteText}>
                                This quotation is confidential and intended solely for{"\n"}
                                the addressee. Prices and specifications are subject to{"\n"}
                                change without prior notice.
                            </Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
